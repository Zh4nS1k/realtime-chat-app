import { Router } from "express";
import Conversation from "../models/Conversation";
import { requireAuth } from "../middleware/auth";
import { buildConversationPayload } from "../utils/chat";
import UserModel from "../models/User";
import { getIO } from "../socket";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const conversations = await Conversation.find({ participants: authUser._id })
    .populate("participants", "username email")
    .sort({ updatedAt: -1 });

  const payload = await Promise.all(conversations.map((conversation) => buildConversationPayload(conversation)));
  return res.json({ conversations: payload });
});

router.post("/dm", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (userId.toString() === authUser._id.toString()) {
    return res.status(400).json({ message: "Нельзя создать чат с самим собой" });
  }

  const target = await UserModel.findById(userId);
  if (!target) return res.status(404).json({ message: "User not found" });

  const dmKey = [authUser._id.toString(), userId.toString()].sort().join(":");
  let conversation = await Conversation.findOne({ dmKey, type: "dm" }).populate("participants", "username email");

  if (!conversation) {
    const created = await Conversation.create({
      type: "dm",
      participants: [authUser._id, userId],
      createdBy: authUser._id,
      dmKey,
    });
    conversation = await created.populate("participants", "username email");
  }

  const payload = await buildConversationPayload(conversation);
  const io = getIO();
  if (io) {
    io.to(userId.toString()).emit("conversation:new", payload);
    io.to(authUser._id.toString()).emit("conversation:new", payload);
  }
  return res.json({ conversation: payload });
});

router.post("/group", requireAuth, async (req, res) => {
  const authUser = (req as any).authUser;
  const { name, participantIds } = req.body as { name: string; participantIds: string[] };
  if (!name || !Array.isArray(participantIds)) {
    return res.status(400).json({ message: "Name and participantIds are required" });
  }

  const unique = Array.from(new Set([...participantIds.map(String), authUser._id.toString()]));
  if (unique.length < 3) return res.status(400).json({ message: "Group must have at least 3 participants" });

  const created = await Conversation.create({
    name,
    type: "group",
    participants: unique,
    createdBy: authUser._id,
  });

  const conversation = await created.populate("participants", "username email");
  const payload = await buildConversationPayload(conversation);

  const io = getIO();
  if (io) {
    unique.forEach((id) => io.to(id.toString()).emit("conversation:new", payload));
  }

  return res.json({ conversation: payload });
});

export default router;
