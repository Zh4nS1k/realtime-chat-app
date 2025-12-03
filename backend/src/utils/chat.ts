import { sanitizeUser } from "./auth";
import Message from "../models/Message";
import type { ConversationDocument, UserDocument } from "../types";

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
          conversationId: conversation._id.toString(),
          content: lastMessage.content,
          imageUrl: lastMessage.imageUrl,
          fileUrl: (lastMessage as any).fileUrl,
          fileName: (lastMessage as any).fileName,
          sender: sanitizeUser(lastMessage.sender as UserDocument),
          createdAt: lastMessage.createdAt,
        }
      : null,
    updatedAt: conversation.updatedAt,
  };
}
