# dora-cms — architecture, user stories, and how it works

`dora-cms` is a drop-in, self-hosted content-editing layer for React sites. A developer wraps
existing content in a few components; their non-technical client can then edit that content —
text, images, theme colors, and a blog — directly on the live site, without Git, a CMS account,
or a page rebuild.

This document explains **why** it exists, **who** does what, and **how** the pieces fit
together. It's the reference for anyone (including future contributors) trying to understand the
system, not an API reference — see each package's README for that.

## 1. The problem

Freelancers and agencies building sites for small businesses and NGOs repeatedly need to let a
non-technical client edit their own text/images after launch. The existing options are all a
mismatch:

- A full headless CMS (Contentful, Sanity, Strapi) — heavy, needs schema setup, often paid.
- Git-based editors (TinaCMS) — the client would need Git literacy, which defeats the purpose.
- Hand-rolling a tiny admin panel per client — the exact repeated cost `dora-cms` removes.

## 2. User stories

**As a developer**, I want to mark a few pieces of an existing React site as editable and ship a
working client-editing experience in under a day, without designing a database schema, building
an admin UI, or standing up my own auth system.

**As a developer**, I want my normal visitors to see zero difference in the shipped site — no
extra bundle weight or UI — when the client isn't in edit mode.

**As a client (site owner)**, I want to open a link to my own site, log in, and change my
headline, swap my logo, pick my brand color, and publish a blog post — using the real page I
already recognize, not a separate dashboard I have to learn.

**As a client**, I do not want to touch code, Git, or an npm install at any point.

## 3. Who does what — the full flow

### Developer (one-time per project)

1. `npm install @dora-cms/react` in their React app.
2. Wrap the content that should be editable:
   ```jsx
   <Editable id="hero-title"><h1>Welcome to Our Bakery</h1></Editable>
   <EditableImage id="logo" src="/logo.png" alt="Bakery logo" />
   <ThemeEditor variables={[{ key: "primary", label: "Brand color", default: "#4f46e5" }]} />
   <EditableBlog />
   ```
3. Deploy `@dora-cms/server` as the backend (see §5 — Render or Vercel).
4. Run the password-hash helper once and set it as an env var:
   `npm run hash-password -- "the-clients-password"`.
5. Deploy the site as normal. To a regular visitor, nothing looks different.
6. Give the client a link like `https://yoursite.com/admin` (or `?edit=true`, if `adminPath`
   wasn't set) plus the password.

### Client (ongoing, no technical steps)

1. Opens the edit link, sees a login form (with a show/hide toggle on the password field), enters
   the password.
2. Every editable region now shows a subtle outline. Clicking text edits it in place; clicking an
   image lets them upload a replacement; the theme panel lets them pick colors; the blog section
   lets them add, edit, delete, or drag-to-reorder posts by a handle on each one.
3. Every change saves immediately and is live for every visitor — no rebuild, no redeploy, no
   developer involvement.
4. From the account panel, the client can change their own admin password at any time — no need
   to ask the developer to regenerate and redeploy a new hash.

### What the client can and can't do

| Action | Supported in v1? |
|---|---|
| Edit existing text | Yes (`<Editable>`) |
| Swap an existing image (logo, hero image, ...) | Yes (`<EditableImage>`) |
| Change theme colors | Yes (`<ThemeEditor>`) |
| Add/edit/delete blog posts | Yes (`<EditableBlog>`) — the one place clients can add brand-new content, because a post's shape (title/body/cover image) is fixed by the developer |
| Reorder blog posts | Yes — drag by the handle on each post; the new order is saved immediately |
| Change their own admin password | Yes (`<AdminAccountPanel>`) — no developer involvement needed |
| Move, resize, or freely reposition boxes on the page | **No** — this is a full visual page-builder (Webflow/Builder.io territory) and was explicitly scoped out of v1 as a multi-month undertaking; drag-and-drop here is limited to reordering existing lists (like blog posts), not freeform layout — see §7 |
| Add an entirely new section that didn't exist in the code | **No** — only the developer defines what's editable |

## 4. Architecture

```
dora-cms/
  packages/
    react/    @dora-cms/react — <Editable>, <EditableImage>, <ThemeEditor>, <EditableBlog>,
              <AdminLoginGate>, <AdminAccountPanel>, <DoraProvider>. Pure UI + a thin fetch
              client. No backend code lives here.
    server/   @dora-cms/server — Express API: content, blog, upload, auth routes. One
              codebase, two entry points (see §5).
    cli/      @dora-cms/cli — `npx @dora-cms/cli init` interactively generates the backend's
              `.env` (secrets, password hash, storage config).
```

**Why one backend, two entry points:** a developer's deploy target (Vercel serverless vs. a
persistent Render service) shouldn't change the business logic. `src/app.ts` builds the Express
app once; `src/index.ts` starts it as a long-running process (Render), and `src/vercel.ts` /
`api/index.ts` wrap the same app as a Vercel serverless function. Fixing a bug or adding a route
only ever happens in one place.

**Why the frontend and backend are decoupled:** `<DoraProvider>` only needs one config value —
the backend's URL. The site can be static-hosted anywhere (Vercel, Netlify, GitHub Pages) while
the `dora-cms` backend runs somewhere else entirely, including a hosted instance a developer
doesn't manage themselves. Nothing in `@dora-cms/react` assumes co-location with the backend.

**Why content is schema-less key/value, not per-field database columns:** `ContentItem` stores
`{ siteId, slotId, type, value }`. Adding a new editable region to a site is just wrapping more
JSX with a new `id` — it needs zero backend changes or migrations. This was a deliberate
trade-off: less relational rigor, in exchange for the core promise that adopting `dora-cms`
never requires touching the database.

**Why images aren't stored in MongoDB:** binary blobs bloat documents, defeat CDN caching, and
hit MongoDB's 16MB document ceiling awkwardly. Uploaded images go to S3-compatible object storage
(`src/lib/storage.ts` — works with AWS S3, Cloudflare R2, Backblaze B2, etc.) and only the
resulting URL is stored in Mongo, alongside the text/color content.

**Single-tenant-per-deployment auth:** there's no multi-user account system. Each developer runs
their own backend instance with one admin password, matching how each developer already
self-hosts their own instance for their own client(s). This kept v1 small on purpose — a
multi-tenant user/roles system is a legitimate future addition, not a v1 requirement.

**Password bootstrap vs. self-service change:** `DORA_ADMIN_PASSWORD_HASH` is the *bootstrap*
password — set once via `npm run hash-password` before first deploy. Once the client changes
their password from `<AdminAccountPanel>`, the new hash is written to a `SiteAuth` document in
Mongo (keyed by `siteId`), which takes precedence over the env var from then on. The env var stays
as the fallback/recovery path (e.g. if a client forgets their password, the developer can always
reset via a new hash and env var, which regains control since the DB record can be cleared).

## 5. Deployment

The same backend code deploys two ways, depending on where the developer's site lives:

- **Render (or any persistent Node host):** deploy `packages/server` as a standard Node web
  service. Entry point: `src/index.ts` → `npm run build && npm start`.
- **Vercel (serverless):** deploy `packages/server` as its own Vercel project (Project Settings →
  Root Directory = `packages/server`). `api/index.ts` + `vercel.json` route every request to the
  same Express app running as a function. `src/db.ts` caches the Mongo connection on `global` so
  a warm serverless instance reuses it instead of reconnecting per request.

Either way, MongoDB itself is an external managed database (e.g. MongoDB Atlas) — the backend
never assumes local disk, which is what makes it deployable on a platform with no persistent
filesystem (Vercel) as well as one with (Render).

## 6. Security

These are the specific decisions made while building this, and why — read this before extending
any route.

- **Passwords are never stored or compared in plaintext.** The developer generates a bcrypt hash
  once (`npm run hash-password`) and only the hash lives in `DORA_ADMIN_PASSWORD_HASH`.
- **Auth is a short-lived JWT (2h), sent as `Authorization: Bearer <token>`,** not a cookie — this
  avoids CSRF entirely (there's no ambient credential a cross-site request could ride on) and
  works cleanly when the frontend and backend are on different domains, which is the common case
  here. The trade-off, noted deliberately: the token lives in `localStorage`, so it's exposed if
  the site has an unrelated XSS bug elsewhere. This is an acceptable v1 trade-off given the
  backend's own XSS surface (see below) is sanitized server-side.
- **A JWT is scoped to one `siteId`.** `requireAuth` checks the token's `siteId` claim matches the
  URL's `:siteId` — without this, a token issued for one client's site could be replayed against
  another site hosted on the same backend instance.
- **Login is rate-limited** (10 attempts / 15 min per IP) to slow down password guessing.
- **Every write is validated with `zod`, then type-specific sanitization is applied server-side**
  before it ever reaches the database:
  - `text` values are stripped of all HTML tags.
  - `image` values must match `^https://` — this specifically blocks a `javascript:` URL being
    stored as an image `src`, which would otherwise execute for every visitor.
  - `color` values must match a hex color pattern — blocks CSS/script injection through a
    `<style>`-adjacent value.
  - `richtext` and blog `body` values go through `sanitize-html`'s default allow-list (safe tags
    only, no `<script>`, no inline event handlers).
  - Blog `title` is stripped to plain text.
- **CORS is an explicit allow-list** (`ALLOWED_ORIGINS`), not a wildcard — only origins the
  developer names can call the API from a browser.
- **`helmet`** sets standard security headers on every response.
- **Uploads are restricted** to `image/png|jpeg|webp|gif`, capped at 5MB, and rate-limited (30 /
  15 min) — this bounds both storage abuse and the attack surface of the upload endpoint.
- **Environment variables are validated at startup with `zod`,** not read ad-hoc — a
  misconfigured deployment fails immediately with a specific message instead of behaving
  unpredictably (e.g. silently accepting an empty `JWT_SECRET`).
- **Error responses never leak internals.** The central error handler logs full errors
  server-side but returns a generic message to the client — stack traces and DB error text never
  reach the network response.

## 7. What's deliberately not in v1

Keeping this explicit so it isn't accidentally "discovered missing" later — these were scoped out
after weighing cost vs. value, not overlooked:

- **Freeform drag-and-drop layout editing.** A real layout engine (drag, resize, collision,
  responsive breakpoints, undo/redo) is a multi-month build on its own — see §3. What *is*
  supported is drag-to-reorder within an existing list (`<EditableBlog>`'s posts, via `@dnd-kit`)
  — a deliberately smaller, well-scoped slice of "drag and drop" that doesn't require a layout
  engine. If freeform positioning becomes a priority later, the plan is to integrate an existing
  engine (e.g. `craft.js`) rather than building one from scratch.
- **A setup CLI that auto-detects the deploy target and provisions a database/storage
  automatically.** `npx @dora-cms/cli init` exists and interactively generates the backend's
  `.env` (secrets, password hash, storage config), but it doesn't provision the actual
  MongoDB/S3-compatible resources — the developer still creates those accounts themselves and
  pastes in the resulting credentials.
- **Multi-tenant accounts/roles.** One admin password per backend instance, matching the
  self-hosted-per-developer model. The client can change that one password themselves (see §4),
  but there's still only one account, not per-user logins.
