import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import prompts from "prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runInit } from "../src/init.js";

vi.mock("prompts", () => ({ default: vi.fn() }));

const mockedPrompts = vi.mocked(prompts);

const validAnswers = {
  mongodbUri: "mongodb://localhost:27017/dora-cms",
  adminPassword: "a-strong-password",
  allowedOrigins: "http://localhost:3000",
  s3Bucket: "bucket",
  s3Region: "auto",
  s3AccessKeyId: "key",
  s3SecretAccessKey: "secret",
  s3Endpoint: "",
  s3PublicUrlBase: "",
};

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "dora-cli-test-"));
  mockedPrompts.mockReset();
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("runInit", () => {
  it("writes a .env file containing every collected value plus a generated JWT secret and password hash", async () => {
    mockedPrompts.mockResolvedValueOnce(validAnswers);

    await runInit(dir);

    const envPath = path.join(dir, ".env");
    const content = readFileSync(envPath, "utf-8");

    expect(content).toContain("MONGODB_URI=mongodb://localhost:27017/dora-cms");
    expect(content).toContain("ALLOWED_ORIGINS=http://localhost:3000");
    expect(content).toContain("S3_BUCKET=bucket");
    expect(content).toMatch(/JWT_SECRET=[0-9a-f]{64}/);
    expect(content).toMatch(/DORA_ADMIN_PASSWORD_HASH=\$2[aby]\$/);
    // The plaintext password should never end up in the written file.
    expect(content).not.toContain("a-strong-password");
  });

  it("does not overwrite an existing .env when the user declines", async () => {
    const envPath = path.join(dir, ".env");
    writeFileSync(envPath, "EXISTING=true\n");

    mockedPrompts.mockResolvedValueOnce({ overwrite: false });

    await runInit(dir);

    expect(readFileSync(envPath, "utf-8")).toBe("EXISTING=true\n");
    expect(mockedPrompts).toHaveBeenCalledTimes(1);
  });

  it("overwrites an existing .env when the user confirms", async () => {
    const envPath = path.join(dir, ".env");
    writeFileSync(envPath, "EXISTING=true\n");

    mockedPrompts.mockResolvedValueOnce({ overwrite: true }).mockResolvedValueOnce(validAnswers);

    await runInit(dir);

    const content = readFileSync(envPath, "utf-8");
    expect(content).not.toContain("EXISTING=true");
    expect(content).toContain("MONGODB_URI=mongodb://localhost:27017/dora-cms");
  });
});
