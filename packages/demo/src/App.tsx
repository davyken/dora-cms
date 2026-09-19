import { AdminAccountPanel, AdminLoginGate, DoraHead, DoraProvider, EditableBlog, SeoFields, ThemeEditor, useDora } from "@dora-cms/react";
import { About } from "./sections/About";
import { FAQ } from "./sections/FAQ";
import { Footer } from "./sections/Footer";
import { Hero } from "./sections/Hero";
import { Navbar } from "./sections/Navbar";
import { ScrollToTop } from "./sections/ScrollToTop";
import { Services } from "./sections/Services";
import { Testimonials } from "./sections/Testimonials";
import { Topbar } from "./sections/Topbar";

const SITE_ID = import.meta.env.VITE_DORA_SITE_ID ?? "demo";
const API_URL = import.meta.env.VITE_DORA_API_URL ?? "http://localhost:4000";

const THEME_VARIABLES = [
  { key: "primary", label: "Primary (headings, links)", default: "#b45309" },
  { key: "secondary", label: "Secondary (buttons)", default: "#7c2d12" },
  { key: "accent", label: "Accent (highlights)", default: "#fbbf24" },
];

export function App() {
  return (
    <DoraProvider siteId={SITE_ID} apiUrl={API_URL} adminPath="/admin">
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
        <a className="demo-banner" href="/admin">
          This is a live dora-cms demo — click here to try editing this page as the site owner
        </a>
      )}
      {isAdminMode && isAuthenticated && (
        <div className="demo-banner demo-banner--admin">
          Admin mode — edit text by clicking it, swap images below them, drag blog posts by their
          handle to reorder, and open "Theme colors", "Account", or "SEO" in the corners to change
          the palette, your password, or this page's search/share metadata.
        </div>
      )}

      <DoraHead
        title="Maison Dora — Artisan Bakery"
        description="Sourdough, pastry, and coffee baked fresh every morning in the heart of town."
        ogImage=""
      />
      <ThemeEditor variables={THEME_VARIABLES} />
      <AdminAccountPanel />
      <SeoFields />

      <Topbar />
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Testimonials />
      <FAQ />

      <section id="blog" className="blog">
        <div className="section-heading">
          <span className="eyebrow">Latest Updates</span>
          <h2>From the journal</h2>
        </div>
        <EditableBlog />
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
