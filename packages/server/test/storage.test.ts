import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getStorageAdapter (default STORAGE_DRIVER=s3)", () => {
  it("constructs without throwing and exposes an upload() function", async () => {
    // global-setup.ts sets S3_BUCKET/S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY
    // and leaves STORAGE_DRIVER unset, matching every pre-existing deployment.
    const { getStorageAdapter } = await import("../src/lib/storage.js");
    const adapter = getStorageAdapter();
    expect(typeof adapter.upload).toBe("function");
  });
});

describe("LocalDiskStorageAdapter (STORAGE_DRIVER=local)", () => {
  const dir = path.join(os.tmpdir(), `dora-cms-test-uploads-${Date.now()}`);
  const originalDriver = process.env.STORAGE_DRIVER;
  const originalDir = process.env.LOCAL_UPLOAD_DIR;

  beforeEach(() => {
    process.env.STORAGE_DRIVER = "local";
    process.env.LOCAL_UPLOAD_DIR = dir;
    vi.resetModules();
  });

  afterEach(async () => {
    if (originalDriver === undefined) delete process.env.STORAGE_DRIVER;
    else process.env.STORAGE_DRIVER = originalDriver;
    if (originalDir === undefined) delete process.env.LOCAL_UPLOAD_DIR;
    else process.env.LOCAL_UPLOAD_DIR = originalDir;
    vi.resetModules();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("writes the uploaded file to disk and returns a URL under the public base", async () => {
    const { getStorageAdapter } = await import("../src/lib/storage.js");
    const adapter = getStorageAdapter();

    const url = await adapter.upload(Buffer.from("fake-image-bytes"), "photo.png", "image/png");

    expect(url).toMatch(/^\/uploads\/[0-9a-f-]+\.png$/);
    const savedFiles = await fs.readdir(dir);
    expect(savedFiles).toHaveLength(1);
    expect(await fs.readFile(path.join(dir, savedFiles[0]!), "utf8")).toBe("fake-image-bytes");
  });
});
