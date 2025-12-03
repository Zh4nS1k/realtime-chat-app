import mongoose, { Schema, model, models, Types } from "mongoose";

export type ConversationType = "dm" | "group";

export interface ConversationDocument extends mongoose.Document {
  name?: string;
  type: ConversationType;
  participants: Types.ObjectId[];
  createdBy: Types.ObjectId;
  dmKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
