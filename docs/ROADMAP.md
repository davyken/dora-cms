# Roadmap — what's implemented and what's next

For the next developer picking this up: this file tracks what's been added beyond the original
v1 build, and what's still open. `docs/ARCHITECTURE.md` explains *why* each piece works the way
it does; this file just tracks status. Nothing here is scoped out on purpose (that list lives in
[ARCHITECTURE.md §7](./ARCHITECTURE.md#7-whats-deliberately-not-in-v1)).

## Reliability under real traffic / real trust — done

1. **CI on every push/PR.** ✅ [`.github/workflows/test.yml`](../.github/workflows/test.yml) runs
   `npm run typecheck`, `npm test`, and `npm run build` across every workspace on every push to
   `main` and every PR. Badge is in the root README.

2. **HTTP caching on the public read routes.** ✅ `GET /content` and `GET /blog`
   (`packages/server/src/routes/content.ts`, `blog.ts`) send
   `Cache-Control: public, max-age=30, stale-while-revalidate=300` for anonymous requests, letting
   Vercel's/Cloudflare's edge cache absorb repeat reads. Skipped whenever the request carries an
   `Authorization` header, so an admin who just saved always sees their own edit immediately — see
   [ARCHITECTURE.md §4](./ARCHITECTURE.md#4-architecture).

3. **Optional Redis-backed rate limiting.** ✅ `packages/server/src/lib/rateLimitStore.ts` wires
   an optional Redis store (`rate-limit-redis` + `ioredis`) behind a new `REDIS_URL` env var.
   Unset (the default) keeps the zero-dependency in-memory store for the common single-instance
   case; set it once a deployment scales past one instance. See
   [ARCHITECTURE.md §6](./ARCHITECTURE.md#6-security).

## Specialities — in progress

Added in response to "what other specialities can we add" — picked from a longer list, being
built in priority order.

4. **Pluggable storage adapters.** ✅ `STORAGE_DRIVER` env var (`packages/server/src/lib/storage.ts`)
   picks between `s3` (default — AWS S3/R2/B2, unchanged), `cloudinary` (managed image CDN),
   `vercel-blob` (zero extra signup on a Vercel-hosted backend), and `local` (zero cloud accounts
   for dev, or Render — not Vercel, no persistent disk there). See
   [ARCHITECTURE.md §4](./ARCHITECTURE.md#4-architecture).

5. **SEO fields per page.** ✅ `<SeoFields page?>` (admin panel), `useSeo(page, defaults)` (data
   hook), `<DoraHead>` (convenience for client-rendered SPAs) — `packages/react/src/{SeoFields.tsx,seo.ts,DoraHead.tsx}`.
   Title/description/OG image are just three more `ContentItem` slots, scoped by `page`. See
   [ARCHITECTURE.md §4](./ARCHITECTURE.md#4-architecture).

6. **Rich text formatting toolbar.** ✅ `<Editable richText>` shows a bold/italic/link toolbar and
   saves as the already-supported `"richtext"` type — `packages/react/src/Editable.tsx`. Uses
   `document.execCommand`, a deliberate lightweight choice over a full editor dependency — see
   [ARCHITECTURE.md §4](./ARCHITECTURE.md#4-architecture) for the trade-off and its testing gap
   (execCommand is unimplemented in jsdom).

7. **Media library.** ✅ Every upload is now recorded in a `Media` collection
   (`packages/server/src/models/Media.ts`) independent of whether it's currently in use, listed
   via `GET /media`, and browsable through `<MediaPicker>` — wired into `<EditableImage>`'s and
   `<SeoFields>`' "Choose existing" buttons. Removing an item from the library isn't implemented
   yet (only listing/reuse) — a reasonable follow-up if needed.

8. **Content version history / undo.** 🔲 Not started. Edits overwrite `ContentItem.value` in
   place with no history — a client who breaks something has no way back except asking the
   developer to fix it in Mongo directly. Needs a revisions collection (e.g. `ContentRevision`
   capturing the previous value on every `PUT /content/:slotId`), a `GET` endpoint to list a
   slot's history, and a "revert to this version" action in the admin UI.

## Bigger changes — queued, not started

9. **Multiple admin users with roles.** 🔲 Not started, and the largest of everything on this
   page. Auth is currently single-tenant by design — one shared password per site
   (`SiteAuth`/`DORA_ADMIN_PASSWORD_HASH`, see ARCHITECTURE.md §6). Real multi-user support means
   a `User` collection (email/password or invite-based), JWTs carrying a `userId` + `role` claim
   instead of just `siteId`, `requireAuth` checking role on each route, and — importantly — a
   migration path so an existing single-password deployment doesn't break when this ships. Do
   this as its own careful pass, not bundled with anything else.

## Adoption-friction (fewer setup failures, more installs) — not started

10. **React 19 / Next.js App Router compatibility isn't explicitly verified.** `peerDependencies`
    just says `react: ">=18"`. Given how much of the React ecosystem in 2026 is Next.js App Router
    (server components, streaming SSR), do a real smoke test there — `DoraProvider`'s
    `typeof window === "undefined"` guards suggest it should be SSR-safe already, but "should be"
    isn't "verified."

11. **The CLI (`@dora-cms/cli init`) still doesn't provision infrastructure.** It generates `.env`
    interactively (secrets, password hash, storage config) but the developer still has to go
    create the MongoDB Atlas cluster and storage bucket themselves and paste in the resulting
    credentials. Remains the single highest-value item for adoption friction at real scale — most
    setup failures come from mismatched or malformed credentials, not from the CMS code itself.

## Status

Items 1–7 are done and published to npm. Item 8 (content version history) is next. Item 9
(multi-admin auth) is queued separately, deliberately last, since it's the riskiest change here.
Items 10–11 are untouched. `docs/ARCHITECTURE.md` and `docs/PUBLISHING.md` are the source of truth
for what *is* built; this file is the source of truth for status and what's next.
