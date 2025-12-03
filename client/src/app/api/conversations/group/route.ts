import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest } from "@/lib/auth";
import Conversation from "@/models/Conversation";
import { buildConversationPayload } from "@/lib/chat";
import { getIO } from "@/server/io";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, participantIds } = await request.json();
  if (!name || !Array.isArray(participantIds)) {
    return NextResponse.json({ message: "Name and participantIds are required" }, { status: 400 });
  }

  const uniqueParticipants = Array.from(new Set([...participantIds.map(String), auth.user._id.toString()]));
  if (uniqueParticipants.length < 3) {
    return NextResponse.json({ message: "Group must have at least 3 participants" }, { status: 400 });
  }

  await connectDb();

  const created = await Conversation.create({
    name,
    type: "group",
    participants: uniqueParticipants,
    createdBy: auth.user._id,
  });

  const conversation = await created.populate("participants", "username email");
  const payload = await buildConversationPayload(conversation);

  const io = getIO();
  if (io) {
    uniqueParticipants.forEach((participantId) => {
      io.to(participantId.toString()).emit("conversation:new", payload);
      io.in(participantId.toString()).socketsJoin(conversation._id.toString());
    });
  }

  return NextResponse.json({ conversation: payload });
}
