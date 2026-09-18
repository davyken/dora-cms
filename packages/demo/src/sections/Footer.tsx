import { Editable } from "@dora-cms/react";

export function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer-grid">
        <div className="footer-col footer-col--brand">
          <h3>Maison Dora</h3>
          <Editable id="footer-blurb" as="p">
            A neighborhood bakery serving sourdough, pastry, and coffee since day one — baked
            fresh, every single morning.
          </Editable>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram">
              IG
            </a>
            <a href="#" aria-label="Facebook">
              FB
            </a>
            <a href="#" aria-label="TikTok">
              TT
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#faq">FAQ</a>
          <a href="#blog">Journal</a>
        </div>

        <div className="footer-col">
          <h4>Visit Us</h4>
          <Editable id="footer-address" as="p">
            12 Baker Street, Springfield
          </Editable>
          <Editable id="footer-hours" as="p">
            Mon–Sat: 6am – 7pm · Sun: 7am – 2pm
          </Editable>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <a href="tel:+15551234567">+1 (555) 123-4567</a>
          <a href="mailto:hello@maisondora.example">hello@maisondora.example</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Maison Dora. All rights reserved.</span>
        <span>
          Built with{" "}
          <a href="https://github.com/davyken/dora-cms" target="_blank" rel="noreferrer">
            dora-cms
          </a>
        </span>
      </div>
    </footer>
  );
}
