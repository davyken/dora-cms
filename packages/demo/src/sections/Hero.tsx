import { useEffect, useState } from "react";
import { Editable } from "@dora-cms/react";

// Static rotating backdrop — not individually client-editable. dora-cms
// doesn't have a "repeatable image list" primitive yet (only <EditableBlog>
// supports add/remove), so a fully client-editable carousel is a real
// feature gap, not an oversight — see docs/ARCHITECTURE.md §7.
const SLIDES = ["/hero-1.svg", "/hero-2.svg", "/hero-3.svg"];
const SLIDE_DURATION_MS = 5000;

export function Hero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-slides">
        {SLIDES.map((src, i) => (
          <div
            key={src}
            className="hero-slide"
            style={{ backgroundImage: `url(${src})`, opacity: i === active ? 1 : 0 }}
          />
        ))}
        <div className="hero-scrim" />
      </div>

      <div className="hero-content">
        <Editable id="hero-title" as="h1">
          Maison Dora
        </Editable>
        <Editable id="hero-subtitle" as="p">
          Sourdough, pastry, and coffee, baked fresh every morning in the heart of town.
        </Editable>
        <div className="hero-actions">
          <a href="#services" className="btn btn-primary">
            Explore the Menu
          </a>
          <a href="#about" className="btn btn-ghost">
            Our Story
          </a>
        </div>
      </div>

      <div className="hero-dots">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Show slide ${i + 1}`}
            className={i === active ? "hero-dot hero-dot--active" : "hero-dot"}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </section>
  );
}
