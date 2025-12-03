import { Schema, model, models } from "mongoose";
import type { ConversationDocument } from "../types";

const ConversationSchema = new Schema<ConversationDocument>(
  {
    name: { type: String },
    type: { type: String, enum: ["dm", "group"], required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dmKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const ConversationModel = models.Conversation || model<ConversationDocument>("Conversation", ConversationSchema);

export default ConversationModel;
