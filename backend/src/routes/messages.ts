import { Router } from "express";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { requireAuth } from "../middleware/auth";
import { sanitizeUser } from "../utils/auth";
import { getIO } from "../socket";
import type { UserDocument } from "../types";

const router = Router();

router.get("/:conversationId", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const isMember = conversation.participants.some((p: unknown) => String(p) === authUser._id.toString());
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: 1 })
    .populate("sender", "username email");

  return res.json({
    messages: messages.map((m) => ({
      _id: m._id.toString(),
      conversationId,
      content: m.content,
      imageUrl: m.imageUrl,
      sender: sanitizeUser(m.sender as UserDocument),
      createdAt: m.createdAt,
    })),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const { conversationId, content, imageUrl } = req.body as {
    conversationId: string;
    content?: string;
    imageUrl?: string;
  };

  if (!conversationId || (!content && !imageUrl)) {
    return res.status(400).json({ message: "Message content or image is required" });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const isMember = conversation.participants.some((p: unknown) => String(p) === authUser._id.toString());
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  const message = await Message.create({
    conversation: conversationId,
    sender: authUser._id,
    content: content?.trim(),
    imageUrl,
  });

  const populated = await message.populate("sender", "username email");
  const payload = {
    _id: message._id.toString(),
    conversationId,
    content: populated.content,
    imageUrl: populated.imageUrl,
    sender: sanitizeUser(populated.sender as UserDocument),
    createdAt: populated.createdAt,
  };

  const io = getIO();
  if (io) {
    io.to(conversationId.toString()).emit("message:new", payload);
    io.to(conversationId.toString()).emit("conversation:activity", { conversationId, lastMessage: payload });
  }

  return res.json({ message: payload });
});

export default router;
