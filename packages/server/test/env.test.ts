import { describe, expect, it } from "vitest";
import { envSchema } from "../src/env.js";

const BASE = {
  MONGODB_URI: "mongodb://localhost/test",
  JWT_SECRET: "x".repeat(32),
  DORA_ADMIN_PASSWORD_HASH: "hash",
  ALLOWED_ORIGINS: "http://localhost:3000",
};

describe("envSchema STORAGE_DRIVER validation", () => {
  it("defaults to s3 and requires the S3 vars when they're missing", () => {
    const result = envSchema.safeParse(BASE);
    expect(result.success).toBe(false);
  });

  it("accepts the s3 driver once its vars are set", () => {
    const result = envSchema.safeParse({
      ...BASE,
      S3_BUCKET: "bucket",
      S3_REGION: "auto",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects STORAGE_DRIVER=cloudinary without Cloudinary vars", () => {
    const result = envSchema.safeParse({ ...BASE, STORAGE_DRIVER: "cloudinary" });
    expect(result.success).toBe(false);
  });

  it("accepts STORAGE_DRIVER=cloudinary once its vars are set", () => {
    const result = envSchema.safeParse({
      ...BASE,
      STORAGE_DRIVER: "cloudinary",
      CLOUDINARY_CLOUD_NAME: "demo",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects STORAGE_DRIVER=vercel-blob without a token", () => {
    const result = envSchema.safeParse({ ...BASE, STORAGE_DRIVER: "vercel-blob" });
    expect(result.success).toBe(false);
  });

  it("accepts STORAGE_DRIVER=vercel-blob once BLOB_READ_WRITE_TOKEN is set", () => {
    const result = envSchema.safeParse({ ...BASE, STORAGE_DRIVER: "vercel-blob", BLOB_READ_WRITE_TOKEN: "token" });
    expect(result.success).toBe(true);
  });

  it("accepts STORAGE_DRIVER=local with no extra vars required", () => {
    const result = envSchema.safeParse({ ...BASE, STORAGE_DRIVER: "local" });
    expect(result.success).toBe(true);
  });

  it("rejects an unrecognized STORAGE_DRIVER value", () => {
    const result = envSchema.safeParse({ ...BASE, STORAGE_DRIVER: "azure-blob" });
    expect(result.success).toBe(false);
  });
});
