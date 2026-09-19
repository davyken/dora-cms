# Roadmap — next up

What's left to make `dora-cms` hold up under real, widespread use ("millions of developers"
scale), ranked by leverage. Nothing here is scoped out on purpose (that list lives in
[ARCHITECTURE.md §7](./ARCHITECTURE.md#7-whats-deliberately-not-in-v1)) — these are things worth
doing, not yet done.

## High-leverage (reliability under real traffic / real trust) — done

1. **CI on every push/PR.** ✅ [`.github/workflows/test.yml`](../.github/workflows/test.yml) runs
   `npm run typecheck`, `npm test`, and `npm run build` across every workspace on every push to
   `main` and every PR. Badge is in the root README.

2. **No HTTP caching on `GET /content`.** ✅ `GET /content` and `GET /blog`
   (`packages/server/src/routes/content.ts`, `blog.ts`) now send
   `Cache-Control: public, max-age=30, stale-while-revalidate=300` for anonymous requests, letting
   Vercel's/Cloudflare's edge cache absorb repeat reads. Skipped whenever the request carries an
   `Authorization` header, so an admin who just saved always sees their own edit immediately — see
   [ARCHITECTURE.md §4](./ARCHITECTURE.md#4-architecture).

3. **Rate limiters used only an in-memory store.** ✅ `packages/server/src/lib/rateLimitStore.ts`
   wires an optional Redis-backed store (`rate-limit-redis` + `ioredis`) behind a new `REDIS_URL`
   env var. Unset (the default) keeps the zero-dependency in-memory store for the common
   single-instance case; set it once a deployment scales past one instance. See
   [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-security).

## Adoption-friction (fewer setup failures, more installs) — not started

## Adoption-friction (fewer setup failures, more installs)

4. **React 19 / Next.js App Router compatibility isn't explicitly verified.** `peerDependencies`
   just says `react: ">=18"`. Given how much of the React ecosystem in 2026 is Next.js App Router
   (server components, streaming SSR), do a real smoke test there — `DoraProvider`'s
   `typeof window === "undefined"` guards suggest it should be SSR-safe already, but "should be"
   isn't "verified."

5. **The CLI (`@dora-cms/cli init`) still doesn't provision infrastructure.** It generates
   `.env` interactively (secrets, password hash, storage config) but the developer still has to
   go create the MongoDB Atlas cluster and R2/S3 bucket themselves and paste in the resulting
   credentials. This remains the single highest-value item for adoption friction if the goal is
   truly "millions of developers" — most setup failures at that scale come from mismatched or
   malformed database/storage credentials, not from the CMS code itself.

## Status

Items 1–3 (high-leverage) are done. Items 4–5 (adoption-friction) are not started.
`docs/ARCHITECTURE.md` and `docs/PUBLISHING.md` are the source of truth for what *is* built; this
file is the source of truth for what's next.
