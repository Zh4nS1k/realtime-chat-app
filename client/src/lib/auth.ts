import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { connectDb } from "./db";
import UserModel, { UserDocument } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export type AuthPayload = {
  userId: string;
  email: string;
  username: string;
};

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token?: string): AuthPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err) {
    console.error("JWT verification failed", err);
    return null;
  }
}

export function sanitizeUser(user: UserDocument) {
  const { _id, email, username, createdAt } = user;
  return { _id: _id.toString(), email, username, createdAt };
}

export async function getAuthFromRequest(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [, token] = header.split(" ");
  const payload = verifyToken(token);
  if (!payload) return null;
  await connectDb();
  const user = await UserModel.findById(payload.userId);
  if (!user) return null;
  return { user, payload };
}
