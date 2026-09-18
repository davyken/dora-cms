import type { BlogPost, ContentItem, ContentType, DoraConfig } from "./types";

const TOKEN_KEY = "dora_token";

export class DoraApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "DoraApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — admin
    // session simply won't persist across reloads; not fatal.
  }
}

function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // see setToken
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createDoraApi(config: DoraConfig) {
  const base = config.apiUrl.replace(/\/$/, "");
  const siteBase = `${base}/api/sites/${encodeURIComponent(config.siteId)}`;

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${siteBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { message?: string });
      throw new DoraApiError(body.message || `Request failed with status ${res.status}`, res.status);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    async login(password: string): Promise<void> {
      const { token } = await request<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setToken(token);
    },

    logout(): void {
      clearToken();
    },

    isAuthenticated(): boolean {
      return Boolean(getToken());
    },

    getContent(): Promise<{ items: ContentItem[] }> {
      return request("/content");
    },

    saveContent(slotId: string, type: ContentType, value: string): Promise<ContentItem> {
      return request(`/content/${encodeURIComponent(slotId)}`, {
        method: "PUT",
        body: JSON.stringify({ type, value }),
      });
    },

    async deleteContent(slotId: string): Promise<void> {
      try {
        await request(`/content/${encodeURIComponent(slotId)}`, { method: "DELETE" });
      } catch (err) {
        // Nothing saved for this slot yet — resetting is already a no-op, not a failure.
        if (err instanceof DoraApiError && err.status === 404) return;
        throw err;
      }
    },

    async uploadImage(file: File): Promise<{ url: string }> {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${siteBase}/upload`, {
        method: "POST",
        headers: { ...authHeaders() },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(body.message || "Image upload failed");
      }
      return res.json() as Promise<{ url: string }>;
    },

    getBlogPosts(): Promise<{ posts: BlogPost[] }> {
      return request("/blog");
    },

    createBlogPost(post: { title: string; body: string; coverImage?: string }): Promise<BlogPost> {
      return request("/blog", { method: "POST", body: JSON.stringify(post) });
    },

    updateBlogPost(id: string, post: Partial<{ title: string; body: string; coverImage: string }>): Promise<BlogPost> {
      return request(`/blog/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(post) });
    },

    deleteBlogPost(id: string): Promise<void> {
      return request(`/blog/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

export type DoraApi = ReturnType<typeof createDoraApi>;
