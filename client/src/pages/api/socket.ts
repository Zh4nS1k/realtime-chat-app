import type { NextApiRequest } from "next";
import { Server as IOServer } from "socket.io";
import { connectDb } from "@/lib/db";
import { sanitizeUser, verifyToken, type AuthPayload } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import UserModel, { type UserDocument } from "@/models/User";
import type { NextApiResponseServerIO } from "@/types/next";
import { setIO } from "@/server/io";

type ServerSocket = import("socket.io").Socket<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  { user: AuthPayload; userDoc: UserDocument }
>;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    await connectDb();

    const io = new IOServer<
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>,
      { user: AuthPayload; userDoc: UserDocument }
    >(res.socket.server, {
      path: "/api/socket/io",
      cors: {
        origin: process.env.NEXT_PUBLIC_SOCKET_URL || "*",
      },
    });

    res.socket.server.io = io;
    setIO(io);

    io.use(async (socket, next) => {
      const authedSocket = socket as ServerSocket;
      const token = authedSocket.handshake.auth?.token as string | undefined;
      const payload = verifyToken(token);
      if (!payload) {
        return next(new Error("Unauthorized"));
      }
      const user = await UserModel.findById(payload.userId);
      if (!user) return next(new Error("Unauthorized"));
      // Stash user on socket for downstream handlers.
      authedSocket.data.user = payload;
      authedSocket.data.userDoc = user;
      authedSocket.join(payload.userId);
      return next();
    });

    io.on("connection", async (rawSocket) => {
      const socket = rawSocket as ServerSocket;
      const payload = socket.data.user;

      const conversations = await Conversation.find({ participants: payload.userId }).select("_id");
      conversations.forEach((conv) => socket.join(conv._id.toString()));

      socket.on("join-conversation", async (conversationId: string) => {
        if (!conversationId) return;
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const isMember = conversation.participants.some((id) => id.toString() === payload.userId);
        if (!isMember) return;
        socket.join(conversationId);
      });

      socket.on("message:send", async (data: { conversationId: string; content?: string; imageUrl?: string }) => {
        const { conversationId, content, imageUrl } = data;
        if (!conversationId || (!content && !imageUrl)) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const isMember = conversation.participants.some((id) => id.toString() === payload.userId);
        if (!isMember) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: payload.userId,
          content: content?.trim(),
          imageUrl,
        });

        const populated = await message.populate("sender", "username email");
        const messagePayload = {
          _id: message._id.toString(),
          conversationId,
          sender: sanitizeUser(populated.sender as UserDocument),
          content: populated.content,
          imageUrl: populated.imageUrl,
          createdAt: populated.createdAt,
        };

        io.to(conversationId).emit("message:new", messagePayload);
        io.to(conversationId).emit("conversation:activity", { conversationId, lastMessage: messagePayload });
      });
    });
  }

  res.end();
}
