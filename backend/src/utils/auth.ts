import jwt from "jsonwebtoken";
import type { AuthPayload, UserDocument } from "../types";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "7d" });
}

export function verifyToken(token?: string): AuthPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET as string) as unknown as AuthPayload;
  } catch (error) {
    console.error("JWT verify failed", error);
    return null;
  }
}

export function sanitizeUser(user: UserDocument) {
  const { _id, email, username, createdAt } = user;
  return { _id: _id.toString(), email, username, createdAt };
}
