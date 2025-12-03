import { sanitizeUser } from "./auth";
import type { ConversationDocument } from "@/models/Conversation";
import type { UserDocument } from "@/models/User";
import Message from "@/models/Message";

export async function buildConversationPayload(conversation: ConversationDocument) {
  const lastMessage = await Message.findOne({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .populate("sender", "username email");

  const participants = conversation.participants as unknown as UserDocument[];

  return {
    _id: conversation._id.toString(),
    type: conversation.type,
    name: conversation.name,
    participants: participants.map(sanitizeUser),
    lastMessage: lastMessage
      ? {
          _id: lastMessage._id.toString(),
          content: lastMessage.content,
          imageUrl: lastMessage.imageUrl,
          sender: sanitizeUser(lastMessage.sender as UserDocument),
          createdAt: lastMessage.createdAt,
        }
      : null,
    updatedAt: conversation.updatedAt,
  };
}
