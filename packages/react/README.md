# @dora-cms/react

React components that make parts of an existing site live-editable by a non-technical client —
no Git, no CMS dashboard, no rebuild. Pairs with [`@dora-cms/server`](https://www.npmjs.com/package/@dora-cms/server)
as the backend.

Full guide: [docs/ARCHITECTURE.md](https://github.com/dora-cms/dora-cms/blob/main/docs/ARCHITECTURE.md) in the repo.

## Install

```bash
npm install @dora-cms/react
```

## Usage

```jsx
import "@dora-cms/react/styles.css";
import {
  DoraProvider,
  Editable,
  EditableImage,
  ThemeEditor,
  EditableBlog,
  AdminLoginGate,
  AdminAccountPanel,
  SeoFields,
  DoraHead,
} from "@dora-cms/react";

function App() {
  return (
    <DoraProvider siteId="my-site" apiUrl="https://api.yoursite.com" adminPath="/admin">
      <AdminLoginGate>
        <DoraHead title="Welcome to Our Bakery" description="Fresh bread daily." ogImage="" />
        <ThemeEditor variables={[{ key: "primary", label: "Brand color", default: "#4f46e5" }]} />
        <AdminAccountPanel />
        <SeoFields />
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
        <Editable id="hero-title" as="h1">Welcome to Our Bakery</Editable>
        <EditableBlog />
      </AdminLoginGate>
    </DoraProvider>
  );
}
```

Visit the site normally, and visit `/admin` (or whatever path/query param you configured, see
`adminPath`/`adminParam` below) to see the admin login and edit affordances. `/admin` needs your
host to serve `index.html` for that path too, since there's no real page there — e.g. Vercel's
`rewrites`, see the [demo's `vercel.json`](https://github.com/dora-cms/dora-cms/blob/main/packages/demo/vercel.json).

## API

- **`<DoraProvider siteId apiUrl adminParam? adminPath?>`** — wraps your app; loads content and
  exposes `useDora()`. `adminPath` (e.g. `"/admin"`) puts the page into admin mode by URL path
  instead of the default `?edit=true` query param; set one or the other, not both.
- **`<Editable id as? richText?>children</Editable>`** — inline-editable text. `richText` shows a
  bold/italic/link toolbar and saves as sanitized HTML instead of plain text.
- **`<EditableImage id src alt />`** — click-to-replace image, with a "Choose existing" option to
  reuse a previous upload from the media library instead; uploads are compressed/downscaled
  client-side before they're sent.
- **`<ThemeEditor variables={[{ key, label, default }]} />`** — applies saved colors as
  `--dora-{key}` CSS custom properties; renders a color-picker panel for admins.
- **`<EditableBlog renderPost? />`** — renders the site's blog posts; admins can add, delete, and
  drag-to-reorder posts by a handle on each one.
- **`<AdminLoginGate>children</AdminLoginGate>`** — shows a password form (with a show/hide
  toggle) when in admin mode and not yet authenticated; otherwise renders `children`.
- **`<AdminAccountPanel />`** — collapsible panel letting the authenticated client change their
  own admin password; renders nothing outside admin mode.
- **`<SeoFields page?>`** — collapsible admin panel for a page's title/meta description/
  social-share image, scoped by `page` (default `"default"`) for multi-page sites.
- **`<MediaPicker onSelect onClose />`** — full-viewport overlay listing every image the client
  has previously uploaded; used internally by `<EditableImage>`/`<SeoFields>`'s "Choose existing",
  exported in case you want to build your own picker trigger elsewhere.
- **`<DoraHead page? title description ogImage>`** — applies `useSeo()`'s result to
  `document.title`/`<meta>` tags; a convenience for plain client-rendered SPAs (doesn't affect
  server-rendered markup — use `useSeo()` with your framework's head API for that).
- **`useSeo(page, defaults)`** — `{ title, description, ogImage }`, saved values falling back to
  `defaults`.
- **`useDora()`** — low-level access to `{ content, isAdminMode, isAuthenticated, login, logout, setContentValue, api }`.

## License

MIT
