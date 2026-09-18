import { Editable } from "@dora-cms/react";

const TESTIMONIALS = [
  { id: "1", name: "Amelia R.", role: "Regular customer", quote: "Best sourdough in the city, hands down. I walk past three other bakeries to get here." },
  { id: "2", name: "Julien T.", role: "Local chef", quote: "We source our dinner bread from Maison Dora exclusively — consistent, honest, delicious." },
  { id: "3", name: "Priya K.", role: "Neighbor", quote: "The morning coffee-and-croissant routine here is the best part of my week." },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="testimonials">
      <div className="section-heading">
        <span className="eyebrow">Kind Words</span>
        <h2>What our neighbors say</h2>
      </div>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((t) => (
          <article key={t.id} className="testimonial-card">
            <p className="testimonial-quote-mark">“</p>
            <Editable id={`testimonial-${t.id}-quote`} as="p" className="testimonial-quote">
              {t.quote}
            </Editable>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.name.charAt(0)}</div>
              <div>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
