import {
  AdminLoginGate,
  DoraProvider,
  Editable,
  EditableBlog,
  EditableImage,
  ThemeEditor,
  useDora,
} from "@dora-cms/react";

const SITE_ID = import.meta.env.VITE_DORA_SITE_ID ?? "demo";
const API_URL = import.meta.env.VITE_DORA_API_URL ?? "http://localhost:4000";

export function App() {
  return (
    <DoraProvider siteId={SITE_ID} apiUrl={API_URL}>
      <AdminLoginGate>
        <Site />
      </AdminLoginGate>
    </DoraProvider>
  );
}

function Site() {
  const { isAdminMode, isAuthenticated } = useDora();

  return (
    <div className="page">
      {!isAdminMode && (
        <a className="demo-banner" href="?edit=true">
          This is a live dora-cms demo — click here to try editing this page as the site owner
        </a>
      )}
      {isAdminMode && isAuthenticated && (
        <div className="demo-banner demo-banner--admin">
          Admin mode — the password for this demo is in the README. Edit text by clicking it,
          swap images below them, and use the color picker in the corner.
        </div>
      )}

      <ThemeEditor variables={[{ key: "primary", label: "Brand color", default: "#b45309" }]} />

      <header className="site-header">
        <EditableImage id="logo" src="/logo.svg" alt="Maison Dora logo" className="logo" />
        <nav>
          <a href="#about">About</a>
          <a href="#blog">Journal</a>
        </nav>
      </header>

      <section className="hero">
        <Editable id="hero-title" as="h1">
          Maison Dora
        </Editable>
        <Editable id="hero-subtitle" as="p">
          Sourdough, pastry, and coffee — baked fresh every morning in the heart of town.
        </Editable>
      </section>

      <section id="about" className="about">
        <EditableImage id="about-image" src="/oven.svg" alt="Our wood-fired oven" className="about-image" />
        <Editable id="about-text" as="p">
          Every loaf here starts with a starter that's been alive for eleven years. We mill part
          of our own flour, and everything on the counter by 7am was made before sunrise.
        </Editable>
      </section>

      <section id="blog" className="blog">
        <h2>From the journal</h2>
        <EditableBlog />
      </section>

      <footer>
        <p>
          Built with{" "}
          <a href="https://github.com/davyken/dora-cms" target="_blank" rel="noreferrer">
            dora-cms
          </a>{" "}
          — a drop-in, self-hosted content layer for React sites.
        </p>
      </footer>
    </div>
  );
}
