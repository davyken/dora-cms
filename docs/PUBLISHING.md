# Publishing to npm, and what happens on `npm install`

Two separate questions, both answered here: how you actually push a new version of dora-cms to
npm, and — since you asked specifically — what a developer sees, and doesn't see, in the moment
right after they type `npm install`.

## 1. What actually gets published

Three separate packages, each published independently:

| Package | Scope | What it is |
|---|---|---|
| `@dora-cms/react` | scoped | The components developers `import` into their site |
| `@dora-cms/server` | scoped | The backend — mostly deployed as its own service (Render/Vercel), not imported as a runtime dependency of another app |
| `dora-cms` | unscoped | The CLI (`npx dora-cms init`) |

They're versioned together for now (all `0.1.0`), but nothing forces that — you can bump one
without the others once they stabilize independently.

## 2. One-time npm account setup

1. `npm adduser` (or `npm login` if you already have an account) — do this once per machine.
2. Enable 2FA on your npm account (`npm profile enable-2fa auth-and-writes`). As of npm's current
   policy, publishing without 2FA on a new account isn't possible for long — set it up now rather
   than getting blocked later.
3. If you want the packages under an npm **organization** instead of your personal account (so
   `@dora-cms/*` isn't tied to one person), create it at npmjs.com first and make sure your login
   has publish rights to it before the first publish.

## 3. Publishing a package

From inside each package directory (`packages/react`, `packages/server`, `packages/cli`):

```bash
npm run build          # never publish unbuilt source — dist/ is what "files" ships
npm version patch      # or minor / major — bumps package.json and creates a git tag
npm publish
```

Two things already set up in `package.json` that make this work without extra flags:

- **`publishConfig.access: "public"`** on both `@dora-cms/react` and `@dora-cms/server`. Scoped
  packages (`@scope/name`) default to **private** on `npm publish`, which fails immediately
  unless you're on a paid npm org plan. This field makes `npm publish` behave as if you'd passed
  `--access public`, every time, without having to remember the flag. `dora-cms` (the CLI) is
  unscoped, so it's public by default either way — the field's there for consistency, not
  necessity.
- **`files: ["dist", ...]`** — only the compiled output (plus a couple of deploy-relevant extras
  for `@dora-cms/server`: `api/`, `vercel.json`, `.env.example`) is published. Source `.ts`,
  tests, and config never end up in the published tarball. Run `npm pack --dry-run` in a package
  directory any time to see exactly what would ship.

### Provenance (recommended, not yet wired up)

If you publish from GitHub Actions (not your laptop), add `--provenance` to the `npm publish`
call:

```bash
npm publish --provenance --access public
```

This cryptographically links the published package to the exact commit and workflow run that
built it — npm shows a "Provenance" badge on the package page, and it's one of the strongest
signals of supply-chain trust a package can carry in 2026. It requires OIDC, which means it has
to run in CI (GitHub Actions with `id-token: write` permission) — it can't be done from a local
`npm publish`. Worth setting up once you have a CI workflow; not required to publish at all.

## 4. What a developer sees when they run `npm install`

This is the part you asked about directly, and it has a firm answer: **almost nothing, and
deliberately so.**

### Why dora-cms doesn't ask questions automatically during install

It would be technically possible to hook a `postinstall` script that immediately launches an
interactive setup wizard the moment `npm install @dora-cms/server` finishes. dora-cms does **not**
do this, on purpose:

- **It breaks non-interactive installs.** CI pipelines, Docker builds, and `npm ci` all run
  without a TTY attached. A script that blocks waiting for keyboard input in that context doesn't
  skip gracefully — it hangs (or errors confusingly), breaking every automated build that installs
  the package.
- **It's a supply-chain red flag.** Lifecycle scripts (`preinstall`/`postinstall`) that run
  arbitrary code automatically on install are exactly the mechanism behind real npm supply-chain
  incidents (`event-stream` being the canonical example). Because of that history, a growing share
  of the ecosystem runs installs with `--ignore-scripts` by default, and some organizations block
  packages with non-trivial postinstall behavior outright. A package that *needs* its postinstall
  script to function is a package that silently breaks in those environments.
- **It's what more trustworthy, comparable tools already do instead.** Prisma (`npx prisma init`),
  Vite (`npm create vite@latest`), shadcn/ui (`npx shadcn init`), and dora-cms's own CLI all put
  interactive setup behind an **explicit, separate command** the developer chooses to run — never
  behind an implicit hook that fires the moment a package lands in `node_modules`.

So: `npm install @dora-cms/react` and `npm install @dora-cms/server` do exactly what installing
any normal package does — download it, and nothing else. No prompts, no network calls beyond npm
itself, no side effects.

### Where the questions actually happen

The setup questions live entirely in the explicit, opt-in command the developer runs when *they*
decide to configure the backend — already built as `packages/cli`:

```bash
npx dora-cms init
```

This is the full list of questions it asks, and why each one is there:

| Prompt | Why it's asked | Where it ends up |
|---|---|---|
| MongoDB connection string | The backend needs somewhere to store content | `MONGODB_URI` |
| The password the site owner will log in with | Becomes the client's admin login | Hashed with bcrypt → `DORA_ADMIN_PASSWORD_HASH` (the plaintext is never written to disk — see `docs/ARCHITECTURE.md` §6) |
| Allowed origins | Which sites may call this API from a browser | `ALLOWED_ORIGINS` |
| S3-compatible bucket name, region, access key, secret key | Uploaded images need object storage (see `docs/ARCHITECTURE.md` §4 for why they're not stored in MongoDB) | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| S3 endpoint (optional) | Only needed for non-AWS providers like Cloudflare R2 | `S3_ENDPOINT` |
| Public URL base for uploads (optional) | Only needed if a CDN sits in front of the bucket | `S3_PUBLIC_URL_BASE` |

Two things it generates for the developer, asking nothing:

- **`JWT_SECRET`** — a random 32-byte secret. There's no meaningful question to ask here; a human
  picking this value would only make it weaker than a generated one.
- **The admin password hash** — computed from the one password question above, using bcrypt.

The result is written to `.env` (with file permissions restricted to the owner, since it holds
secrets), and the command prints the two deployment paths (Render / Vercel) as next steps. See
`packages/cli/README.md` for the exact usage.

### The one thing a postinstall script legitimately *can* do

If you want a package to say something right after install — pointing a developer at the `init`
command, for example — the safe pattern is a **non-interactive, side-effect-free console message**,
never a prompt:

```js
// scripts/postinstall.js — illustrative, not currently added to any package here
console.log("\n@dora-cms/server installed. Run `npx dora-cms init` to configure it.\n");
```

This never blocks, never touches the filesystem or network, and does nothing meaningfully
different in CI than it does on a developer's laptop (the message just goes to a log nobody
reads). Whether to add even this is optional — it's a nice-to-have discoverability nudge, not a
substitute for real documentation.
