# @dora-cms/demo

A small bakery landing page ("Maison Dora") that exists to prove `@dora-cms/react` actually
works end to end against a real deployed `@dora-cms/server` — the dogfooding site referenced in
`docs/ARCHITECTURE.md`. Not published to npm.

## Run locally

```bash
cp .env.example .env
# VITE_DORA_API_URL should point at your running @dora-cms/server (default http://localhost:4000)
npm run dev --workspace=@dora-cms/demo
```

Visit the printed URL normally to see the public site, or add `?edit=true` to see the admin
login (password is whatever you set with `dora-cms init` / `hash-password` on the backend).

## Deploy

Deploy as its own Vercel project with **Root Directory = `packages/demo`**. Set
`VITE_DORA_API_URL` in the Vercel project's environment variables to your deployed backend's URL
(e.g. the Render service URL).

## License

MIT
