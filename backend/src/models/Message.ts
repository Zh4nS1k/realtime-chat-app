import { Schema, model, models } from "mongoose";
import type { MessageDocument } from "../types";

const MessageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    imageUrl: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

const MessageModel = models.Message || model<MessageDocument>("Message", MessageSchema);

export default MessageModel;
