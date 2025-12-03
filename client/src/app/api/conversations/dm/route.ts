import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import UserModel from "@/models/User";
import { buildConversationPayload } from "@/lib/chat";
import { getIO } from "@/server/io";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ message: "userId is required" }, { status: 400 });
  }

  if (userId.toString() === auth.user._id.toString()) {
    return NextResponse.json({ message: "Нельзя создать чат с самим собой" }, { status: 400 });
  }

  await connectDb();

  const targetUser = await UserModel.findById(userId);
  if (!targetUser) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const dmKey = [auth.user._id.toString(), userId.toString()].sort().join(":");

  let conversation = await Conversation.findOne({ dmKey, type: "dm" }).populate("participants", "username email");

  if (!conversation) {
    const created = await Conversation.create({
      type: "dm",
      participants: [auth.user._id, userId],
      createdBy: auth.user._id,
      dmKey,
    });
    conversation = await created.populate("participants", "username email");
  }

  const payload = await buildConversationPayload(conversation);

  const io = getIO();
  if (io) {
    io.to(userId.toString()).emit("conversation:new", payload);
    io.in(userId.toString()).socketsJoin(conversation._id.toString());
    io.in(auth.user._id.toString()).socketsJoin(conversation._id.toString());
  }

  return NextResponse.json({ conversation: payload });
}
