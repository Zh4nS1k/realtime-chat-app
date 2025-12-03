import type { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { verifyToken } from "./utils/auth";
import UserModel from "./models/User";
import Conversation from "./models/Conversation";
import Message from "./models/Message";
import { sanitizeUser } from "./utils/auth";
import type { AuthPayload, UserDocument } from "./types";

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  io = new IOServer(server, {
    cors: { origin: process.env.CLIENT_ORIGIN || "*" },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const payload = verifyToken(token);
    if (!payload) return next(new Error("Unauthorized"));
    const user = await UserModel.findById(payload.userId);
    if (!user) return next(new Error("Unauthorized"));
    (socket.data as any).user = payload;
    (socket.data as any).userDoc = user;
    socket.join(payload.userId);
    return next();
  });

  io.on("connection", async (socket) => {
    const payload = (socket.data as any).user as AuthPayload;
    const conversations = await Conversation.find({ participants: payload.userId }).select("_id");
    conversations.forEach((conv) => socket.join(conv._id.toString()));

    socket.on("join-conversation", async (conversationId: string) => {
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      const isMember = conversation.participants.some((id: unknown) => String(id) === payload.userId);
      if (!isMember) return;
      socket.join(conversationId);
    });

    socket.on("message:send", async (data: { conversationId: string; content?: string; imageUrl?: string; fileUrl?: string; fileName?: string }) => {
      const { conversationId, content, imageUrl, fileUrl, fileName } = data;
      if (!conversationId || (!content && !imageUrl && !fileUrl)) return;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      const isMember = conversation.participants.some((id: unknown) => String(id) === payload.userId);
      if (!isMember) return;

      const message = await Message.create({
        conversation: conversationId,
        sender: payload.userId,
        content: content?.trim(),
        imageUrl,
        fileUrl,
        fileName,
        status: "sent",
      });

      // mark delivered immediately
      message.status = "delivered";
      await message.save();

      const populated = await message.populate("sender", "username email");
      const messagePayload = {
        _id: message._id.toString(),
        conversationId,
        sender: sanitizeUser(populated.sender as UserDocument),
        content: populated.content,
        imageUrl: populated.imageUrl,
        fileUrl: populated.fileUrl,
        fileName: populated.fileName,
        status: message.status,
        createdAt: populated.createdAt,
      };

      io?.to(conversationId).emit("message:new", messagePayload);
      io?.to(conversationId).emit("conversation:activity", { conversationId, lastMessage: messagePayload });
    });

    socket.on("typing:start", async (data: { conversationId: string }) => {
      const { conversationId } = data;
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      const isMember = conversation.participants.some((id: unknown) => String(id) === payload.userId);
      if (!isMember) return;
      socket.to(conversationId).emit("typing:start", {
        conversationId,
        username: (socket.data as any).userDoc.username,
      });
    });

    socket.on("typing:stop", async (data: { conversationId: string }) => {
      const { conversationId } = data;
      if (!conversationId) return;
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;
      const isMember = conversation.participants.some((id: unknown) => String(id) === payload.userId);
      if (!isMember) return;
      socket.to(conversationId).emit("typing:stop", {
        conversationId,
        username: (socket.data as any).userDoc.username,
      });
    });
  });

  return io;
}

export function getIO() {
  return io;
}
