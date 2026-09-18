import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import { TEST_ADMIN_PASSWORD } from "./constants.js";

let mongod: MongoMemoryServer;

/**
 * Runs once before any test file. Starts a throwaway in-memory MongoDB and
 * populates every env var src/env.ts requires, so importing the app in a
 * test file never hits the "missing config" fail-fast path. Vitest starts
 * test workers only after this resolves, so process.env mutations here are
 * inherited by them.
 */
export async function setup(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-jwt-secret-0123456789abcdef0123456789";
  process.env.DORA_ADMIN_PASSWORD_HASH = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
  process.env.ALLOWED_ORIGINS = "http://localhost:3000";
  // Upload tests mock ../src/lib/storage.js instead of talking to real S3 —
  // these only need to satisfy env.ts's schema.
  process.env.S3_BUCKET = "test-bucket";
  process.env.S3_REGION = "auto";
  process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
  process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
}

export async function teardown(): Promise<void> {
  await mongod?.stop();
}
