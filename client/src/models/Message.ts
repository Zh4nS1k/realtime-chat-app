import mongoose, { Schema, model, models, Types } from "mongoose";

export interface MessageDocument extends mongoose.Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

const MessageModel = models.Message || model<MessageDocument>("Message", MessageSchema);

export default MessageModel;
