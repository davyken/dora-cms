import "dotenv/config";
import { z } from "zod";

/**
 * All required configuration is validated once at startup — the process
 * fails fast with a clear message instead of surfacing confusing errors
 * later from deep inside a request handler.
 */
const baseEnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters — generate with `openssl rand -hex 32`"),
  DORA_ADMIN_PASSWORD_HASH: z
    .string()
    .min(1, "DORA_ADMIN_PASSWORD_HASH is required — generate one with `npm run hash-password -- <your-password>`"),
  ALLOWED_ORIGINS: z
    .string()
    .min(1, "ALLOWED_ORIGINS is required — comma-separated list of origins allowed to call this API"),
  PORT: z.string().optional(),

  // Which image-upload backend to use. Defaults to "s3" (the original,
  // still-supported adapter) so every existing deployment keeps working
  // unchanged. Each driver's own required vars are enforced below, not
  // with `.min(1)` on the fields themselves, since only one driver's vars
  // are actually required at a time.
  STORAGE_DRIVER: z.enum(["s3", "cloudinary", "vercel-blob", "local"]).default("s3"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_PUBLIC_URL_BASE: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Matches @vercel/blob's own conventional env var name, so a developer
  // who's already used Vercel Blob elsewhere doesn't need to learn a
  // dora-cms-specific name for the same token.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  // Only meaningful on a host with a persistent filesystem (Render, not
  // Vercel) — see the warning in src/lib/storage.ts. Both optional with
  // sensible defaults; nothing is strictly required for "local".
  LOCAL_UPLOAD_DIR: z.string().optional(),
  LOCAL_UPLOAD_PUBLIC_URL_BASE: z.string().optional(),

  // Optional. Rate limiting defaults to an in-memory store, which is correct
  // for a single server instance but silently under-enforces the moment a
  // deployment scales past one (each instance counts independently). Set
  // this to share rate-limit counters across instances via Redis instead —
  // see src/lib/rateLimitStore.ts.
  REDIS_URL: z.string().optional(),
});

export const envSchema = baseEnvSchema.superRefine((val, ctx) => {
  function require(field: keyof typeof val, message: string) {
    if (!val[field]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
    }
  }

  switch (val.STORAGE_DRIVER) {
    case "s3":
      require("S3_BUCKET", "S3_BUCKET is required when STORAGE_DRIVER=s3 (the default)");
      require("S3_REGION", "S3_REGION is required when STORAGE_DRIVER=s3 (the default)");
      require("S3_ACCESS_KEY_ID", "S3_ACCESS_KEY_ID is required when STORAGE_DRIVER=s3 (the default)");
      require("S3_SECRET_ACCESS_KEY", "S3_SECRET_ACCESS_KEY is required when STORAGE_DRIVER=s3 (the default)");
      break;
    case "cloudinary":
      require("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD_NAME is required when STORAGE_DRIVER=cloudinary");
      require("CLOUDINARY_API_KEY", "CLOUDINARY_API_KEY is required when STORAGE_DRIVER=cloudinary");
      require("CLOUDINARY_API_SECRET", "CLOUDINARY_API_SECRET is required when STORAGE_DRIVER=cloudinary");
      break;
    case "vercel-blob":
      require("BLOB_READ_WRITE_TOKEN", "BLOB_READ_WRITE_TOKEN is required when STORAGE_DRIVER=vercel-blob");
      break;
    case "local":
      // No required vars — LOCAL_UPLOAD_DIR and LOCAL_UPLOAD_PUBLIC_URL_BASE both default sensibly.
      break;
  }
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
