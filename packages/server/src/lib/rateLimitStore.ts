import type { Store } from "express-rate-limit";
import { Redis } from "ioredis";
import { RedisStore } from "rate-limit-redis";
import { env } from "../env.js";

type RedisReply = boolean | number | string | (boolean | number | string)[];

let store: Store | undefined;

/**
 * express-rate-limit's default store only counts requests seen by the
 * current process — correct for one instance, silently wrong the moment a
 * deployment scales past one (each instance keeps its own counter, so the
 * real effective limit becomes `limit * instanceCount`). Setting REDIS_URL
 * shares counters across every instance instead; leaving it unset keeps the
 * zero-dependency in-memory default, which is fine for the common
 * single-instance case.
 */
export function rateLimitStore(): Store | undefined {
  if (!env.REDIS_URL) return undefined;
  if (!store) {
    const client = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    store = new RedisStore({
      sendCommand: (...args: string[]) => {
        const [command, ...rest] = args;
        return client.call(command, ...rest) as Promise<RedisReply>;
      },
    });
  }
  return store;
}
