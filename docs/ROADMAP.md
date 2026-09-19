# Roadmap — next up

What's left to make `dora-cms` hold up under real, widespread use ("millions of developers"
scale), ranked by leverage. Nothing here is scoped out on purpose (that list lives in
[ARCHITECTURE.md §7](./ARCHITECTURE.md#7-whats-deliberately-not-in-v1)) — these are things worth
doing, not yet done.

## High-leverage (reliability under real traffic / real trust)

1. **CI on every push/PR.** Only [`.github/workflows/publish.yml`](../.github/workflows/publish.yml)
   exists today, and it's a manual `workflow_dispatch` for releases. There's no workflow that runs
   typecheck + tests automatically on push or PR — meaning an external contributor's PR currently
   ships with zero automated signal, and nothing stops a broken commit from landing on `main`.
   Add `.github/workflows/test.yml` (matrix over the workspaces, `npm run typecheck` +
   `npm test`) and put the resulting badge in the README. This is the single biggest credibility
   gap for a package other people are expected to trust and contribute to.

2. **No HTTP caching on `GET /content`.** Every visitor to every site currently hits MongoDB
   directly for the same data, with no `Cache-Control` or `ETag`. A site that gets real traffic
   will hammer its own backend for identical responses. Add something like
   `Cache-Control: public, max-age=30, stale-while-revalidate=300` to
   `packages/server/src/routes/content.ts`'s `GET /` handler — this lets Vercel's/Cloudflare's
   edge cache the response, cutting DB load dramatically for zero cost to freshness (content
   changes are rare relative to pageviews, and staleness is bounded to seconds). This is the
   single biggest "won't fall over under real traffic" fix available right now.

3. **Rate limiters use `express-rate-limit`'s default in-memory store.** This works correctly for
   exactly one server instance. It silently stops enforcing correctly the moment a developer scales
   their Render/Vercel backend past one instance (each instance gets its own counter) — which is
   precisely the traffic level where rate limiting matters most. Either document this limit
   explicitly (so nobody assumes protection they don't have) or wire an optional Redis-backed
   store (`rate-limit-redis`) behind an env var for anyone scaling past a single instance.

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

Not started. `docs/ARCHITECTURE.md` and `docs/PUBLISHING.md` are the source of truth for what
*is* built; this file is the source of truth for what's next.
