import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest, sanitizeUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  return NextResponse.json({ user: sanitizeUser(auth.user) });
}
