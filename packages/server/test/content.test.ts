import { describe, expect, it } from "vitest";
import { agent, loginAndGetToken, uniqueSiteId } from "./helpers.js";

describe("GET /api/sites/:siteId/content", () => {
  it("returns an empty list for a site with no saved content", async () => {
    const res = await agent().get(`/api/sites/${uniqueSiteId()}/content`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});

describe("PUT /api/sites/:siteId/content/:slotId", () => {
  it("requires authentication", async () => {
    const res = await agent()
      .put(`/api/sites/${uniqueSiteId()}/content/hero-title`)
      .send({ type: "text", value: "Hello" });
    expect(res.status).toBe(401);
  });

  it("saves and strips markup from a text value", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);

    const res = await agent()
      .put(`/api/sites/${siteId}/content/hero-title`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "text", value: "Welcome <script>alert(1)</script> Home" });

    expect(res.status).toBe(200);
    expect(res.body.value).toBe("Welcome  Home");
    expect(res.body.type).toBe("text");
  });

  it("upserts — saving the same slotId again overwrites the previous value", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const put = (value: string) =>
      agent()
        .put(`/api/sites/${siteId}/content/hero-title`)
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "text", value });

    await put("First");
    await put("Second");

    const res = await agent().get(`/api/sites/${siteId}/content`);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].value).toBe("Second");
  });

  it("accepts a valid hex color", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/theme.primary`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "color", value: "#4f46e5" });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe("#4f46e5");
  });

  it("rejects a non-hex color value", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/theme.primary`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "color", value: "red" });
    expect(res.status).toBe(400);
  });

  it("accepts an https image URL", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/logo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "image", value: "https://cdn.example.com/logo.png" });
    expect(res.status).toBe(200);
  });

  it("rejects a javascript: URL submitted as an image (stored-XSS guard)", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/logo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "image", value: "javascript:alert(document.cookie)" });
    expect(res.status).toBe(400);
  });

  it("rejects a plain http (non-https) image URL", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/logo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "image", value: "http://cdn.example.com/logo.png" });
    expect(res.status).toBe(400);
  });

  it("allow-lists safe tags for richtext but strips <script>", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/about`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "richtext", value: "<p>Hello <b>world</b></p><script>alert(1)</script>" });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe("<p>Hello <b>world</b></p>");
  });

  it("rejects an invalid content type", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/content/hero-title`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "video", value: "nope" });
    expect(res.status).toBe(400);
  });

  it("keeps content isolated between sites", async () => {
    const siteA = uniqueSiteId("a");
    const siteB = uniqueSiteId("b");
    const tokenA = await loginAndGetToken(siteA);

    await agent()
      .put(`/api/sites/${siteA}/content/hero-title`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ type: "text", value: "Site A's title" });

    const res = await agent().get(`/api/sites/${siteB}/content`);
    expect(res.body.items).toEqual([]);
  });
});

describe("DELETE /api/sites/:siteId/content/:slotId", () => {
  it("requires authentication", async () => {
    const res = await agent().delete(`/api/sites/${uniqueSiteId()}/content/logo`);
    expect(res.status).toBe(401);
  });

  it("deletes a saved value, so it stops appearing in the public list", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);

    await agent()
      .put(`/api/sites/${siteId}/content/logo`)
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "image", value: "https://cdn.example.com/logo.png" });

    const del = await agent().delete(`/api/sites/${siteId}/content/logo`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const res = await agent().get(`/api/sites/${siteId}/content`);
    expect(res.body.items).toEqual([]);
  });

  it("returns 404 when there is nothing saved for that slot", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent().delete(`/api/sites/${siteId}/content/logo`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
