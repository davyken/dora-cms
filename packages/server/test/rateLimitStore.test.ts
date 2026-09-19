import { describe, expect, it } from "vitest";
import { rateLimitStore } from "../src/lib/rateLimitStore.js";

describe("rateLimitStore", () => {
  it("returns undefined (falling back to express-rate-limit's in-memory default) when REDIS_URL isn't set", () => {
    // global-setup.ts never sets REDIS_URL, matching the common single-instance deployment.
    expect(rateLimitStore()).toBeUndefined();
  });
});
