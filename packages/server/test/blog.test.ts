import { describe, expect, it } from "vitest";
import { agent, loginAndGetToken, uniqueSiteId } from "./helpers.js";

describe("GET /api/sites/:siteId/blog", () => {
  it("returns an empty list for a site with no posts", async () => {
    const res = await agent().get(`/api/sites/${uniqueSiteId()}/blog`);
    expect(res.status).toBe(200);
    expect(res.body.posts).toEqual([]);
  });
});

describe("POST /api/sites/:siteId/blog", () => {
  it("requires authentication", async () => {
    const res = await agent()
      .post(`/api/sites/${uniqueSiteId()}/blog`)
      .send({ title: "Hello", body: "<p>Body</p>" });
    expect(res.status).toBe(401);
  });

  it("rejects a missing title or body", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .post(`/api/sites/${siteId}/blog`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Only a title" });
    expect(res.status).toBe(400);
  });

  it("creates a post, generates a slug, and sanitizes title/body", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .post(`/api/sites/${siteId}/blog`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Hello <script>alert(1)</script> World",
        body: "<p>Body</p><script>alert(2)</script>",
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Hello  World");
    expect(res.body.body).toBe("<p>Body</p>");
    expect(res.body.slug).toBe("hello-world");
    expect(typeof res.body.id).toBe("string");
  });

  it("appends a numeric suffix when the generated slug collides", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const create = () =>
      agent()
        .post(`/api/sites/${siteId}/blog`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Same Title", body: "<p>Body</p>" });

    const first = await create();
    const second = await create();

    expect(first.body.slug).toBe("same-title");
    expect(second.body.slug).toBe("same-title-1");
  });
});

describe("PUT /api/sites/:siteId/blog/:id", () => {
  it("updates an existing post", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const created = await agent()
      .post(`/api/sites/${siteId}/blog`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original", body: "<p>Original body</p>" });

    const res = await agent()
      .put(`/api/sites/${siteId}/blog/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.body).toBe("<p>Original body</p>"); // untouched field preserved
  });

  it("returns 404 for a post that doesn't exist", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/blog/000000000000000000000000`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/sites/:siteId/blog/:id", () => {
  it("deletes a post and it no longer appears in the list", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const created = await agent()
      .post(`/api/sites/${siteId}/blog`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "To delete", body: "<p>Body</p>" });

    const del = await agent()
      .delete(`/api/sites/${siteId}/blog/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(204);

    const list = await agent().get(`/api/sites/${siteId}/blog`);
    expect(list.body.posts).toEqual([]);
  });

  it("returns 404 when deleting a post that doesn't exist", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .delete(`/api/sites/${siteId}/blog/000000000000000000000000`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("cannot delete another site's post", async () => {
    const siteA = uniqueSiteId("a");
    const siteB = uniqueSiteId("b");
    const tokenA = await loginAndGetToken(siteA);
    const tokenB = await loginAndGetToken(siteB);

    const created = await agent()
      .post(`/api/sites/${siteA}/blog`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Site A post", body: "<p>Body</p>" });

    const res = await agent()
      .delete(`/api/sites/${siteB}/blog/${created.body.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/sites/:siteId/blog/reorder", () => {
  it("requires authentication", async () => {
    const res = await agent()
      .put(`/api/sites/${uniqueSiteId()}/blog/reorder`)
      .send({ order: ["000000000000000000000000"] });
    expect(res.status).toBe(401);
  });

  it("rejects an empty order array", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const res = await agent()
      .put(`/api/sites/${siteId}/blog/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ order: [] });
    expect(res.status).toBe(400);
  });

  it("reorders posts so the list reflects the given order", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const create = (title: string) =>
      agent()
        .post(`/api/sites/${siteId}/blog`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title, body: "<p>Body</p>" })
        .then((r) => r.body);

    const first = await create("First");
    const second = await create("Second");
    const third = await create("Third");

    // Default order is newest-first: Third, Second, First.
    const before = await agent().get(`/api/sites/${siteId}/blog`);
    expect(before.body.posts.map((p: { title: string }) => p.title)).toEqual(["Third", "Second", "First"]);

    const reorder = await agent()
      .put(`/api/sites/${siteId}/blog/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ order: [first.id, second.id, third.id] });
    expect(reorder.status).toBe(204);

    const after = await agent().get(`/api/sites/${siteId}/blog`);
    expect(after.body.posts.map((p: { title: string }) => p.title)).toEqual(["First", "Second", "Third"]);
  });

  it("a newly created post still sorts first even after a manual reorder", async () => {
    const siteId = uniqueSiteId();
    const token = await loginAndGetToken(siteId);
    const create = (title: string) =>
      agent()
        .post(`/api/sites/${siteId}/blog`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title, body: "<p>Body</p>" })
        .then((r) => r.body);

    const first = await create("First");
    const second = await create("Second");

    await agent()
      .put(`/api/sites/${siteId}/blog/reorder`)
      .set("Authorization", `Bearer ${token}`)
      .send({ order: [first.id, second.id] });

    await create("Third");

    const res = await agent().get(`/api/sites/${siteId}/blog`);
    expect(res.body.posts.map((p: { title: string }) => p.title)).toEqual(["Third", "First", "Second"]);
  });

  it("does not let a reorder move another site's posts", async () => {
    const siteA = uniqueSiteId("a");
    const siteB = uniqueSiteId("b");
    const tokenA = await loginAndGetToken(siteA);
    const tokenB = await loginAndGetToken(siteB);

    const postA = await agent()
      .post(`/api/sites/${siteA}/blog`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ title: "Site A post", body: "<p>Body</p>" })
      .then((r) => r.body);

    const res = await agent()
      .put(`/api/sites/${siteB}/blog/reorder`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ order: [postA.id] });
    expect(res.status).toBe(204); // no-op, not an error — see routes/blog.ts

    const check = await agent().get(`/api/sites/${siteA}/blog`);
    expect(check.body.posts[0].title).toBe("Site A post");
  });
});
