# @dora-cms/server

The API backend for [`@dora-cms/react`](https://www.npmjs.com/package/@dora-cms/react) — content,
blog, image upload, and admin auth, backed by MongoDB. Deployable as a persistent Node service
(Render) or as Vercel serverless functions.

Full guide, including the security model: [docs/ARCHITECTURE.md](https://github.com/dora-cms/dora-cms/blob/main/docs/ARCHITECTURE.md)
in the repo.

## Setup

```bash
cp .env.example .env
```

Fill in `.env`:

- `MONGODB_URI` — a MongoDB connection string (MongoDB Atlas free tier works).
- `JWT_SECRET` — `openssl rand -hex 32`.
- `DORA_ADMIN_PASSWORD_HASH` — run `npm run hash-password -- "the-clients-password"` and paste
  the printed hash. Never put the plain password in `.env`.
- `ALLOWED_ORIGINS` — comma-separated origins allowed to call this API from a browser.
- Image storage — pick one with `STORAGE_DRIVER` (defaults to `s3`, so leaving it unset keeps the
  original behavior):
  - `s3` (default): `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` — any
    S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, ...). Set `S3_ENDPOINT` for
    non-AWS providers.
  - `cloudinary`: `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`.
  - `vercel-blob`: `BLOB_READ_WRITE_TOKEN` (only useful when this backend is itself on Vercel).
  - `local`: no vars required; writable disk only — works on Render or local dev, not Vercel.
- `REDIS_URL` — optional; shares rate-limit counters across instances once you scale past one
  (defaults to an in-memory store, correct for a single instance).

## Run locally

```bash
npm run dev    # tsx watch, http://localhost:4000
```

## Deploy

**Render (or any persistent Node host):**

```bash
npm run build
npm start
```

**Vercel:** create a Vercel project with **Root Directory = `packages/server`**. The included
`api/index.ts` and `vercel.json` route every request to the shared Express app as a single
serverless function.

Either way, set the same env vars from `.env.example` in the platform's dashboard.

## Endpoints

All routes are scoped under `/api/sites/:siteId/...`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | — | Exchange the admin password for a 2h JWT |
| PUT | `/auth/password` | Bearer | Change the site's admin password |
| GET | `/content` | — | Fetch all saved content for the site (cached for anonymous requests) |
| PUT | `/content/:slotId` | Bearer | Save a `text` \| `richtext` \| `image` \| `color` value |
| DELETE | `/content/:slotId` | Bearer | Clear a saved value, reverting to the component's default |
| POST | `/upload` | Bearer | Upload an image (multipart `file` field), returns `{ url }` |
| GET | `/media` | Bearer | List the site's previously uploaded images (media library) |
| GET | `/blog` | — | List blog posts, newest first (cached for anonymous requests) |
| POST | `/blog` | Bearer | Create a post (`title`, `body`, optional `coverImage`) |
| PUT | `/blog/:id` | Bearer | Update a post |
| DELETE | `/blog/:id` | Bearer | Delete a post |
| PUT | `/blog/reorder` | Bearer | Persist a new post order (`{ order: string[] }` of post ids) |

## License

MIT
