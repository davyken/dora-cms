import { beforeEach, describe, expect, it, vi } from "vitest";
import { agent, loginAndGetToken, uniqueSiteId } from "./helpers.js";

// vi.mock calls are hoisted above imports by Vitest's transform, so the
// upload route picks up this mocked adapter instead of hitting real S3.
vi.mock("../src/lib/storage.js", () => ({
  getStorageAdapter: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue("https://cdn.example.com/uploads/fake.png"),
  })),
}));

// A minimal but valid 1x1 PNG, so multer's real file-parsing path is exercised.
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a4944415478da6360000002000155" +
    "0182b7c40000000049454e44ae426082",
  "hex"
);

describe("POST /api/sites/:siteId/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    const res = await agent().post(`/api/sites/${uniqueSiteId()}/upload`).attach("file", TINY_PNG, "logo.png");
    expect(res.status).toBe(401);
  });

  it("rejects a request with no file", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent().post(`/api/sites/${siteId}/upload`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("rejects a disallowed file type", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .post(`/api/sites/${siteId}/upload`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("not an image"), { filename: "payload.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  it("uploads a valid image and returns the storage adapter's URL", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .post(`/api/sites/${siteId}/upload`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", TINY_PNG, { filename: "logo.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.url).toBe("https://cdn.example.com/uploads/fake.png");
  });

  it("records the upload in the site's media library", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    await agent()
      .post(`/api/sites/${siteId}/upload`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", TINY_PNG, { filename: "logo.png", contentType: "image/png" });

    const mediaRes = await agent().get(`/api/sites/${siteId}/media`).set("Authorization", `Bearer ${token}`);
    expect(mediaRes.status).toBe(200);
    expect(mediaRes.body.items).toHaveLength(1);
    expect(mediaRes.body.items[0]).toMatchObject({
      url: "https://cdn.example.com/uploads/fake.png",
      mimeType: "image/png",
    });
  });
});
