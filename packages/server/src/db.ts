import mongoose from "mongoose";
import { env } from "./env.js";

declare global {
  // eslint-disable-next-line no-var
  var __doraMongooseConn: Promise<typeof mongoose> | undefined;
}

/**
 * On Vercel each request may hit a fresh (or a reused warm) serverless
 * instance — caching the connection promise on `global` avoids opening a
 * new MongoDB connection per request while still working correctly on a
 * traditional long-running Render process.
 */
export function connectDb(): Promise<typeof mongoose> {
  if (!global.__doraMongooseConn) {
    global.__doraMongooseConn = mongoose.connect(env.MONGODB_URI);
  }
  return global.__doraMongooseConn;
}
