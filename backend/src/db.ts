import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!global.__mongooseConn) {
    global.__mongooseConn = { conn: null, promise: null };
  }

  if (global.__mongooseConn.conn) return global.__mongooseConn.conn;
  if (!global.__mongooseConn.promise) {
    global.__mongooseConn.promise = mongoose.connect(uri);
  }
  global.__mongooseConn.conn = await global.__mongooseConn.promise;
  return global.__mongooseConn.conn;
}
