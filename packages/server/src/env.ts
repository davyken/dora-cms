import "dotenv/config";
import { z } from "zod";

/**
 * All required configuration is validated once at startup — the process
 * fails fast with a clear message instead of surfacing confusing errors
 * later from deep inside a request handler.
 */
const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters — generate with `openssl rand -hex 32`"),
  DORA_ADMIN_PASSWORD_HASH: z
    .string()
    .min(1, "DORA_ADMIN_PASSWORD_HASH is required — generate one with `npm run hash-password -- <your-password>`"),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, "ALLOWED_ORIGINS is required — comma-separated list of origins allowed to call this API"),
  PORT: z.string().optional(),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required for image uploads"),
  S3_REGION: z.string().min(1, "S3_REGION is required for image uploads"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required for image uploads"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required for image uploads"),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL_BASE: z.string().optional(),
  // Optional. Rate limiting defaults to an in-memory store, which is correct
  // for a single server instance but silently under-enforces the moment a
  // deployment scales past one (each instance counts independently). Set
  // this to share rate-limit counters across instances via Redis instead —
  // see src/lib/rateLimitStore.ts.
  REDIS_URL: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    // Throwing (rather than process.exit) keeps this safe to import from a
    // Vercel serverless function, which has no long-lived process to exit.
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
