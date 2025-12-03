import bcrypt from "bcryptjs";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import UserModel from "../models/User";
import { buildConversationPayload } from "../utils/chat";
import { sanitizeUser, signToken } from "../utils/auth";
import { GraphQLContext } from "./context";
import { connectDb } from "../db";
import { getIO } from "../socket";

export const resolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      await connectDb();
      return ctx.user ? sanitizeUser(ctx.user) : null;
    },
    users: async (_parent: unknown, args: { q?: string }, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const query = args.q || "";
      const users = await UserModel.find(
        query
          ? {
              $or: [
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
              ],
              _id: { $ne: ctx.user._id },
            }
          : { _id: { $ne: ctx.user._id } }
      )
        .sort({ username: 1 })
        .limit(20);
      return users.map(sanitizeUser);
    },
    conversations: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const conversations = await Conversation.find({ participants: ctx.user._id })
        .populate("participants", "username email")
        .sort({ updatedAt: -1 });
      return Promise.all(conversations.map((conv) => buildConversationPayload(conv)));
    },
    messages: async (_parent: unknown, args: { conversationId: string }, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const conversation = await Conversation.findById(args.conversationId);
      if (!conversation) throw new Error("Conversation not found");
      const isMember = conversation.participants.some((p: unknown) => String(p) === ctx.user!._id.toString());
      if (!isMember) throw new Error("Forbidden");
      const messages = await Message.find({ conversation: args.conversationId })
        .sort({ createdAt: 1 })
        .populate("sender", "username email");
      return messages.map((m) => ({
        _id: m._id.toString(),
        conversationId: args.conversationId,
        content: m.content,
        imageUrl: m.imageUrl,
        sender: sanitizeUser(m.sender as any),
        status: m.status,
        createdAt: m.createdAt,
      }));
    },
  },
  Mutation: {
    register: async (_parent: unknown, args: { email: string; username: string; password: string }) => {
      await connectDb();
      const { email, username, password } = args;
      if (!email || !username || !password) throw new Error("Email, username and password are required");
      const existing = await UserModel.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
      if (existing) throw new Error("User already exists");
      const hashed = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ email: email.toLowerCase(), username, password: hashed });
      const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username });
      return { user: sanitizeUser(user), token };
    },
    login: async (_parent: unknown, args: { email: string; password: string }) => {
      await connectDb();
      const { email, password } = args;
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      if (!user) throw new Error("Invalid credentials");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid credentials");
      const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username });
      return { user: sanitizeUser(user), token };
    },
    startDm: async (_parent: unknown, args: { userId: string }, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const { userId } = args;
      if (!userId) throw new Error("userId is required");
      if (userId.toString() === ctx.user._id.toString()) throw new Error("Нельзя создать чат с самим собой");
      const target = await UserModel.findById(userId);
      if (!target) throw new Error("User not found");
      const dmKey = [ctx.user._id.toString(), userId.toString()].sort().join(":");
      let conversation = await Conversation.findOne({ dmKey, type: "dm" }).populate("participants", "username email");
      if (!conversation) {
        const created = await Conversation.create({
          type: "dm",
          participants: [ctx.user._id, userId],
          createdBy: ctx.user._id,
          dmKey,
        });
        conversation = await created.populate("participants", "username email");
      }
      const payload = await buildConversationPayload(conversation);
      const io = getIO();
      if (io) {
        io.to(userId.toString()).emit("conversation:new", payload);
        io.to(ctx.user._id.toString()).emit("conversation:new", payload);
      }
      return payload;
    },
    createGroup: async (_parent: unknown, args: { name: string; participantIds: string[] }, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const { name, participantIds } = args;
      if (!name || !Array.isArray(participantIds)) throw new Error("Name and participantIds are required");
      const unique = Array.from(new Set([...participantIds.map(String), ctx.user._id.toString()]));
      if (unique.length < 3) throw new Error("Group must have at least 3 participants");
      const created = await Conversation.create({
        name,
        type: "group",
        participants: unique,
        createdBy: ctx.user._id,
      });
      const conversation = await created.populate("participants", "username email");
      const payload = await buildConversationPayload(conversation);
      const io = getIO();
      if (io) {
        unique.forEach((id) => io.to(id.toString()).emit("conversation:new", payload));
      }
      return payload;
    },
    sendMessage: async (
      _parent: unknown,
      args: { conversationId: string; content?: string; imageUrl?: string },
      ctx: GraphQLContext
    ) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const { conversationId, content, imageUrl } = args;
      if (!conversationId || (!content && !imageUrl)) throw new Error("Message content or image is required");
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) throw new Error("Conversation not found");
      const isMember = conversation.participants.some((p: unknown) => String(p) === ctx.user!._id.toString());
      if (!isMember) throw new Error("Forbidden");
      const message = await Message.create({
        conversation: conversationId,
        sender: ctx.user._id,
        content: content?.trim(),
        imageUrl,
        status: "sent",
      });
      // Immediately mark as delivered for now
      message.status = "delivered";
      await message.save();
      const populated = await message.populate("sender", "username email");
      const payloadMessage = {
        _id: message._id.toString(),
        conversationId,
        content: populated.content,
        imageUrl: populated.imageUrl,
        sender: sanitizeUser(populated.sender as any),
        status: message.status,
        createdAt: populated.createdAt,
      };
      const io = getIO();
      if (io) {
        io.to(conversationId.toString()).emit("message:new", payloadMessage);
        io.to(conversationId.toString()).emit("conversation:activity", { conversationId, lastMessage: payloadMessage });
      }
      return payloadMessage;
    },
    markRead: async (_parent: unknown, args: { conversationId: string }, ctx: GraphQLContext) => {
      await connectDb();
      if (!ctx.user) throw new Error("Unauthorized");
      const conversation = await Conversation.findById(args.conversationId);
      if (!conversation) throw new Error("Conversation not found");
      const isMember = conversation.participants.some((p: unknown) => String(p) === ctx.user!._id.toString());
      if (!isMember) throw new Error("Forbidden");

      const updated = await Message.updateMany(
        {
          conversation: args.conversationId,
          sender: { $ne: ctx.user._id },
          status: { $ne: "read" },
        },
        { $set: { status: "read" } }
      );

      if (updated.modifiedCount > 0) {
        const io = getIO();
        if (io) {
          const messages = await Message.find({
            conversation: args.conversationId,
            sender: { $ne: ctx.user._id },
            status: "read",
          }).select("_id status conversation");
          messages.forEach((m) => {
            io.to(args.conversationId).emit("message:status", {
              messageId: m._id.toString(),
              conversationId: args.conversationId,
              status: "read",
            });
          });
        }
      }

      return true;
    },
  },
};
