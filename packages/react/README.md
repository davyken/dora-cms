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
import { DoraProvider, Editable, EditableImage, ThemeEditor, EditableBlog, AdminLoginGate } from "@dora-cms/react";

function App() {
  return (
    <DoraProvider siteId="my-site" apiUrl="https://api.yoursite.com">
      <AdminLoginGate>
        <ThemeEditor variables={[{ key: "primary", label: "Brand color", default: "#4f46e5" }]} />
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
        <Editable id="hero-title" as="h1">Welcome to Our Bakery</Editable>
        <EditableBlog />
      </AdminLoginGate>
    </DoraProvider>
  );
}
```

Visit the site normally, and visit it with `?edit=true` to see the admin login and edit affordances.

## API

- **`<DoraProvider siteId apiUrl adminParam?>`** — wraps your app; loads content and exposes
  `useDora()`.
- **`<Editable id as?>children</Editable>`** — inline-editable text.
- **`<EditableImage id src alt />`** — click-to-replace image.
- **`<ThemeEditor variables={[{ key, label, default }]} />`** — applies saved colors as
  `--dora-{key}` CSS custom properties; renders a color-picker panel for admins.
- **`<EditableBlog renderPost? />`** — renders the site's blog posts; admins can add/delete posts.
- **`<AdminLoginGate>children</AdminLoginGate>`** — shows a password form when `?edit=true` and
  not yet authenticated; otherwise renders `children`.
- **`useDora()`** — low-level access to `{ content, isAdminMode, isAuthenticated, login, logout, setContentValue, api }`.

## License

MIT
