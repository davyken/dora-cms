import { Editable } from "@dora-cms/react";

const SERVICES = [
  { id: "1", icon: "🍞", title: "Fresh Sourdough", desc: "Baked every morning from our eleven-year-old starter, ready by 6am." },
  { id: "2", icon: "🥐", title: "Pastry Counter", desc: "Croissants, danishes, and seasonal tarts made in small batches." },
  { id: "3", icon: "☕", title: "Coffee Bar", desc: "Single-origin beans roasted locally, pulled fresh throughout the day." },
];

export function Services() {
  return (
    <section id="services" className="services">
      <div className="section-heading">
        <span className="eyebrow">What We Offer</span>
        <h2>Baked, brewed, and ready for you</h2>
      </div>
      <div className="services-grid">
        {SERVICES.map((s) => (
          <article key={s.id} className="service-card">
            <div className="service-icon">{s.icon}</div>
            <Editable id={`service-${s.id}-title`} as="h3">
              {s.title}
            </Editable>
            <Editable id={`service-${s.id}-desc`} as="p">
              {s.desc}
            </Editable>
          </article>
        ))}
      </div>
    </section>
  );
}
