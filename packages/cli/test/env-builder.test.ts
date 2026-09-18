import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { buildEnvFile, generateJwtSecret, hashPassword } from "../src/env-builder.js";

describe("generateJwtSecret", () => {
  it("returns a 64-character hex string (32 random bytes)", () => {
    const secret = generateJwtSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a different value on each call", () => {
    expect(generateJwtSecret()).not.toBe(generateJwtSecret());
  });
});

describe("hashPassword", () => {
  it("produces a bcrypt hash that verifies against the original password", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple");
    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare("CorrectHorseBatteryStaple", hash)).resolves.toBe(true);
  });

  it("does not verify against a different password", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple");
    await expect(bcrypt.compare("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("buildEnvFile", () => {
  const base = {
    mongodbUri: "mongodb+srv://user:pass@cluster.mongodb.net/dora-cms",
    jwtSecret: "a".repeat(64),
    adminPasswordHash: "$2a$12$hashvalue",
    allowedOrigins: "https://yoursite.com,http://localhost:3000",
    s3Bucket: "my-bucket",
    s3Region: "auto",
    s3AccessKeyId: "AKIAEXAMPLE",
    s3SecretAccessKey: "secretvalue",
  };

  it("includes every required key with its value", () => {
    const env = buildEnvFile(base);
    expect(env).toContain(`MONGODB_URI=${base.mongodbUri}`);
    expect(env).toContain(`JWT_SECRET=${base.jwtSecret}`);
    expect(env).toContain(`DORA_ADMIN_PASSWORD_HASH=${base.adminPasswordHash}`);
    expect(env).toContain(`ALLOWED_ORIGINS=${base.allowedOrigins}`);
    expect(env).toContain(`S3_BUCKET=${base.s3Bucket}`);
    expect(env).toContain(`S3_REGION=${base.s3Region}`);
    expect(env).toContain(`S3_ACCESS_KEY_ID=${base.s3AccessKeyId}`);
    expect(env).toContain(`S3_SECRET_ACCESS_KEY=${base.s3SecretAccessKey}`);
  });

  it("defaults PORT to 4000 when not provided", () => {
    expect(buildEnvFile(base)).toContain("PORT=4000");
  });

  it("uses a provided PORT instead of the default", () => {
    expect(buildEnvFile({ ...base, port: "8080" })).toContain("PORT=8080");
  });

  it("omits S3_ENDPOINT and S3_PUBLIC_URL_BASE when not provided", () => {
    const env = buildEnvFile(base);
    expect(env).not.toContain("S3_ENDPOINT=");
    expect(env).not.toContain("S3_PUBLIC_URL_BASE=");
  });

  it("includes S3_ENDPOINT and S3_PUBLIC_URL_BASE when provided", () => {
    const env = buildEnvFile({
      ...base,
      s3Endpoint: "https://abc.r2.cloudflarestorage.com",
      s3PublicUrlBase: "https://cdn.yoursite.com",
    });
    expect(env).toContain("S3_ENDPOINT=https://abc.r2.cloudflarestorage.com");
    expect(env).toContain("S3_PUBLIC_URL_BASE=https://cdn.yoursite.com");
  });

  it("ends with a trailing newline", () => {
    expect(buildEnvFile(base).endsWith("\n")).toBe(true);
  });
});
