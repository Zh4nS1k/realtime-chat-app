import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest, sanitizeUser } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import type { UserDocument } from "@/models/User";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  await connectDb();

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  const isMember = conversation.participants.some((p) => p.toString() === auth.user._id.toString());
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const messages = await Message.find({ conversation: id })
    .sort({ createdAt: 1 })
    .populate("sender", "username email");

  return NextResponse.json({
    messages: messages.map((m) => ({
      _id: m._id.toString(),
      conversationId: id,
      content: m.content,
      imageUrl: m.imageUrl,
      sender: sanitizeUser(m.sender as UserDocument),
      createdAt: m.createdAt,
    })),
  });
}
