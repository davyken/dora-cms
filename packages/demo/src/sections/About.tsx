import { Editable, EditableImage } from "@dora-cms/react";

export function About() {
  return (
    <section id="about" className="about">
      <EditableImage id="about-image" src="/oven.svg" alt="Our wood-fired oven" className="about-image" />
      <div className="about-copy">
        <span className="eyebrow">Our Story</span>
        <h2>A neighborhood bakery, eleven years in the making</h2>
        <Editable id="about-text" as="p">
          Every loaf here starts with a starter that's been alive for eleven years. We mill part
          of our own flour, and everything on the counter by 7am was made before sunrise. No
          shortcuts, no additives — just flour, water, salt, and time.
        </Editable>
        <div className="about-stats">
          <div>
            <strong>11</strong>
            <span>Years baking</span>
          </div>
          <div>
            <strong>40+</strong>
            <span>Daily recipes</span>
          </div>
          <div>
            <strong>6am</strong>
            <span>Fresh, every day</span>
          </div>
        </div>
      </div>
    </section>
  );
}
