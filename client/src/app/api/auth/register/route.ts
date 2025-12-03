import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import UserModel from "@/models/User";
import { sanitizeUser, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json({ message: "Email, username and password are required" }, { status: 400 });
    }

    await connectDb();

    const existing = await UserModel.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return NextResponse.json({ message: "User already exists with provided email or username" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email: email.toLowerCase(),
      username,
      password: hashed,
    });

    const token = signToken({ userId: user._id.toString(), email: user.email, username: user.username });

    return NextResponse.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("Register error", error);
    return NextResponse.json({ message: "Failed to register" }, { status: 500 });
  }
}
