import { Schema, model, models } from "mongoose";
import type { UserDocument } from "../types";

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    username: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel = models.User || model<UserDocument>("User", UserSchema);

export default UserModel;
