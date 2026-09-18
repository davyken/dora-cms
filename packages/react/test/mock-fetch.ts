import { vi } from "vitest";

type HandlerResult = { status?: number; body?: unknown };
type Handler = (init?: RequestInit) => HandlerResult;

/**
 * Installs a global fetch mock keyed by "METHOD /path" so each test only
 * has to describe the handful of endpoints it actually exercises, matching
 * the real requests createDoraApi() (src/api.ts) makes.
 */
export function installMockFetch(handlers: Record<string, Handler>) {
  const calls: { method: string; path: string; init?: RequestInit }[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method ?? "GET").toUpperCase();
    const path = new URL(url).pathname;
    calls.push({ method, path, init });

    const key = `${method} ${path}`;
    const handler = handlers[key];
    if (!handler) {
      throw new Error(`No mock handler registered for "${key}"`);
    }
    const { status = 200, body = {} } = handler(init);
    // A 204 (or other null-body status) throws if constructed with a
    // stringified body — send no body at all, matching a real 204 response.
    const responseBody = status === 204 ? null : JSON.stringify(body);
    return new Response(responseBody, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

export function setAdminMode(on: boolean): void {
  window.history.pushState({}, "", on ? "/?edit=true" : "/");
}

export function seedAuthToken(token = "fake-token"): void {
  window.localStorage.setItem("dora_token", token);
}
