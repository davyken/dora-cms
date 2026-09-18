import { useState } from "react";
import { Editable } from "@dora-cms/react";

const FAQS = [
  { id: "1", q: "Do you take custom cake orders?", a: "Yes — reach out at least 48 hours ahead and we'll work out flavors, size, and pickup time with you." },
  { id: "2", q: "Is anything here vegan or gluten-free?", a: "We bake a vegan sourdough daily and a small batch of gluten-free banana bread on weekends." },
  { id: "3", q: "Do you deliver?", a: "Delivery is free on orders over $30 within a 5km radius, and available every day except Monday." },
  { id: "4", q: "What time should I come for the best selection?", a: "Before 8am for pastries, and right after our 4pm second bake for the widest bread selection." },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  return (
    <section id="faq" className="faq">
      <div className="section-heading">
        <span className="eyebrow">Good to Know</span>
        <h2>Frequently asked questions</h2>
      </div>
      <div className="faq-list">
        {FAQS.map((item) => {
          const open = openId === item.id;
          return (
            <div key={item.id} className={open ? "faq-item faq-item--open" : "faq-item"}>
              <button
                type="button"
                className="faq-question"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                {item.q}
                <span className="faq-chevron">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="faq-answer">
                  <Editable id={`faq-${item.id}-answer`} as="p">
                    {item.a}
                  </Editable>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
