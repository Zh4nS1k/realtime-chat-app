import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest, sanitizeUser } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import type { UserDocument } from "@/models/User";
import { getIO } from "@/server/io";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, content, imageUrl } = await request.json();

  if (!conversationId || (!content && !imageUrl)) {
    return NextResponse.json({ message: "Message content or image is required" }, { status: 400 });
  }

  await connectDb();

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  const isMember = conversation.participants.some((p) => p.toString() === auth.user._id.toString());
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: auth.user._id,
    content: content?.trim(),
    imageUrl,
  });

  const populated = await message.populate("sender", "username email");
  const payload = {
    _id: message._id.toString(),
    conversationId,
    content: populated.content,
    imageUrl: populated.imageUrl,
    sender: sanitizeUser(populated.sender as UserDocument),
    createdAt: populated.createdAt,
  };

  const io = getIO();
  if (io) {
    io.to(conversationId.toString()).emit("message:new", payload);
  }

  return NextResponse.json({ message: payload });
}
