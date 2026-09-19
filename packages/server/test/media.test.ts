import { describe, expect, it } from "vitest";
import { Media } from "../src/models/Media.js";
import { agent, loginAndGetToken, uniqueSiteId } from "./helpers.js";

describe("GET /api/sites/:siteId/media", () => {
  it("requires authentication", async () => {
    const res = await agent().get(`/api/sites/${uniqueSiteId()}/media`);
    expect(res.status).toBe(401);
  });

  it("returns an empty list for a site with no uploads", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent().get(`/api/sites/${siteId}/media`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("returns items newest first", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    await Media.create({ siteId, url: "https://cdn.test/first.png", mimeType: "image/png" });
    await new Promise((r) => setTimeout(r, 5));
    await Media.create({ siteId, url: "https://cdn.test/second.png", mimeType: "image/png" });

    const res = await agent().get(`/api/sites/${siteId}/media`).set("Authorization", `Bearer ${token}`);
    expect(res.body.items.map((i: { url: string }) => i.url)).toEqual([
      "https://cdn.test/second.png",
      "https://cdn.test/first.png",
    ]);
  });

  it("only returns the requesting site's own uploads", async () => {
    const siteA = uniqueSiteId();
    const siteB = uniqueSiteId();
    const tokenA = await loginAndGetToken(siteA);
    await Media.create({ siteId: siteA, url: "https://cdn.test/a.png", mimeType: "image/png" });
    await Media.create({ siteId: siteB, url: "https://cdn.test/b.png", mimeType: "image/png" });

    const res = await agent().get(`/api/sites/${siteA}/media`).set("Authorization", `Bearer ${tokenA}`);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].url).toBe("https://cdn.test/a.png");
  });
});
