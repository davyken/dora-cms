import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import { TEST_ADMIN_PASSWORD } from "./constants.js";

// Route tests share one in-memory MongoDB (see global-setup.ts), so every
// test gets its own siteId to stay isolated regardless of execution order.
export function uniqueSiteId(prefix = "site"): string {
  return `${prefix}-${randomUUID()}`;
}

export function agent() {
  return request(createApp());
}

export async function loginAndGetToken(siteId: string): Promise<string> {
  const res = await agent().post(`/api/sites/${siteId}/auth/login`).send({ password: TEST_ADMIN_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Test login failed with status ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}
