import mongoose, { Schema, model, models } from "mongoose";

export interface UserDocument extends mongoose.Document {
  email: string;
  username: string;
  password: string;
  createdAt: Date;
}

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
