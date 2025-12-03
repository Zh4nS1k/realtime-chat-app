import type mongoose from "mongoose";

export type AuthPayload = {
  userId: string;
  email: string;
  username: string;
};

export interface UserDocument extends mongoose.Document {
  email: string;
  username: string;
  password: string;
  createdAt: Date;
}

export type ConversationType = "dm" | "group";

export interface ConversationDocument extends mongoose.Document {
  name?: string;
  type: ConversationType;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  dmKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDocument extends mongoose.Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content?: string;
  imageUrl?: string;
  status: "sent" | "delivered" | "read";
  createdAt: Date;
  updatedAt: Date;
}
