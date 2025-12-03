import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getAuthFromRequest, sanitizeUser } from "@/lib/auth";
import UserModel from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const users = await UserModel.find(
    query
      ? {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
          _id: { $ne: auth.user._id },
        }
      : { _id: { $ne: auth.user._id } }
  )
    .sort({ username: 1 })
    .limit(20);

  return NextResponse.json({ users: users.map(sanitizeUser) });
}
