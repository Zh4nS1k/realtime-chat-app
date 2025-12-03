import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import { buildConversationPayload } from "@/lib/chat";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  const conversations = await Conversation.find({ participants: auth.user._id })
    .populate("participants", "username email")
    .sort({ updatedAt: -1 });

  const payload = await Promise.all(conversations.map((conversation) => buildConversationPayload(conversation)));

  return NextResponse.json({ conversations: payload });
}
