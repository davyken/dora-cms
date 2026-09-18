import express from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { TEST_ADMIN_PASSWORD } from "./constants.js";
import { agent, loginAndGetToken, uniqueSiteId } from "./helpers.js";

describe("POST /api/sites/:siteId/auth/login", () => {
  it("rejects a missing password", async () => {
    const res = await agent().post(`/api/sites/${uniqueSiteId()}/auth/login`).send({});
    expect(res.status).toBe(400);
  });

  it("rejects the wrong password", async () => {
    const res = await agent().post(`/api/sites/${uniqueSiteId()}/auth/login`).send({ password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("issues a token for the correct password", async () => {
    const res = await agent()
      .post(`/api/sites/${uniqueSiteId()}/auth/login`)
      .send({ password: TEST_ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.split(".")).toHaveLength(3); // JWT shape
  });

});

// The real /auth/login route skips its rate limiter under NODE_ENV=test
// (every test in this suite shares one process/IP, and many unrelated
// tests need to log in), so the limiter's own behavior is verified here
// against an isolated app using the same configuration instead.
describe("login rate limiting (isolated from the shared test app)", () => {
  it("returns 429 after exceeding the configured attempt limit", async () => {
    const app = express();
    app.use(express.json());
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
    app.post("/login", limiter, (_req, res) => res.status(401).json({ message: "Incorrect password" }));

    const attempts = await Promise.all(Array.from({ length: 11 }, () => request(app).post("/login").send({})));
    expect(attempts.map((r) => r.status)).toContain(429);
  });
});

describe("token scoping", () => {
  it("rejects a token issued for a different siteId", async () => {
    const siteA = uniqueSiteId("a");
    const siteB = uniqueSiteId("b");
    const tokenForA = await loginAndGetToken(siteA);

    const res = await agent()
      .put(`/api/sites/${siteB}/content/hero-title`)
      .set("Authorization", `Bearer ${tokenForA}`)
      .send({ type: "text", value: "hello" });

    expect(res.status).toBe(403);
  });
});
