import { useEffect, useState } from "react";
import { EditableImage } from "@dora-cms/react";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
  { href: "#blog", label: "Journal" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={scrolled ? "navbar navbar--scrolled" : "navbar"}>
      <div className="navbar-inner">
        <EditableImage id="logo" src="/logo.svg" alt="Maison Dora logo" className="navbar-logo" />

        <nav className="navbar-links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="navbar-cta">
          Visit Us
        </a>

        <button
          type="button"
          className="navbar-burger"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileOpen && (
        <nav className="navbar-mobile">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="#contact" onClick={() => setMobileOpen(false)}>
            Visit Us
          </a>
        </nav>
      )}
    </header>
  );
}
