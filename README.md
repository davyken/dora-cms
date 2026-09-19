# dora-cms

Drop-in, self-hosted content editing for React sites. Wrap your existing components, and your
client can edit text, images, theme colors, and a blog — directly on the live page — without
Git, a CMS account, or a rebuild.

```jsx
import {
  DoraProvider,
  Editable,
  EditableImage,
  ThemeEditor,
  EditableBlog,
  AdminLoginGate,
  AdminAccountPanel,
} from "@dora-cms/react";

function App() {
  return (
    <DoraProvider siteId="my-site" apiUrl="https://api.yoursite.com" adminPath="/admin">
      <AdminLoginGate>
        <ThemeEditor variables={[{ key: "primary", label: "Brand color", default: "#4f46e5" }]} />
        <AdminAccountPanel />
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
        <Editable id="hero-title" as="h1">Welcome to Our Bakery</Editable>
        <EditableBlog />
      </AdminLoginGate>
    </DoraProvider>
  );
}
```

## Documentation

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — user stories, the full dev/client flow, the
  deployment model, and the security decisions behind every route.
- [docs/PUBLISHING.md](./docs/PUBLISHING.md) — how these packages get published to npm, and
  exactly what (and what doesn't) happen when a developer runs `npm install`.

## Packages

- [`packages/react`](./packages/react) — `@dora-cms/react`: the editing components.
- [`packages/server`](./packages/server) — `@dora-cms/server`: the API backend (MongoDB-backed),
  deployable to Render or Vercel.
- [`packages/cli`](./packages/cli) — `@dora-cms/cli`: `npx @dora-cms/cli init` generates the
  backend's `.env` interactively (secrets, password hash, storage config).

## Quickstart (local development)

```bash
npm install

# 1. Configure the backend — either the interactive CLI...
npm run dev --workspace=@dora-cms/cli -- init packages/server
# ...or by hand:
#   cp packages/server/.env.example packages/server/.env
#   npm run hash-password -- "the-clients-password"
#   (paste the printed hash into packages/server/.env as DORA_ADMIN_PASSWORD_HASH)

# 2. Run the backend
npm run dev:server   # http://localhost:4000

# 3. Build the React package (or `npm run build -w @dora-cms/react` in watch mode during development)
npm run build -w @dora-cms/react
```

Then in your site: `npm install @dora-cms/react` (from a published version, or `npm link` locally
during development), point `apiUrl` at `http://localhost:4000`, and visit `/admin` on your site
(or `?edit=true` if you didn't set `adminPath`). Note that a static host needs an SPA rewrite for
`/admin` to resolve — see [`packages/demo/vercel.json`](./packages/demo/vercel.json).

## Deploying

Both are covered in detail in [docs/ARCHITECTURE.md §5](./docs/ARCHITECTURE.md#5-deployment):

- **Backend on Render:** deploy `packages/server` as a Node web service (`npm run build && npm start`).
- **Backend on Vercel:** deploy `packages/server` as its own Vercel project (Root Directory =
  `packages/server`) — it ships its own `api/` + `vercel.json`.
- **Frontend:** deploy your React site however you already do (Vercel, Netlify, static host —
  the frontend only needs the backend's URL, it doesn't need to be co-located with it).

## License

MIT
