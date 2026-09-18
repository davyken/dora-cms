import { Editable } from "@dora-cms/react";

export function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Editable id="topbar-message" as="span">
          Fresh bread daily, 6am – 7pm · Free delivery over $30
        </Editable>
        <div className="topbar-links">
          <a href="tel:+15551234567">+1 (555) 123-4567</a>
          <a href="mailto:hello@maisondora.example">hello@maisondora.example</a>
        </div>
      </div>
    </div>
  );
}
