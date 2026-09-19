import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DoraHead } from "../src/DoraHead";
import { DoraProvider } from "../src/DoraProvider";
import { installMockFetch } from "./mock-fetch";

describe("DoraHead", () => {
  it("applies the given defaults when nothing is saved yet", async () => {
    installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <DoraHead title="Maison Dora" description="A bakery." ogImage="https://cdn.test/default-og.png" />
      </DoraProvider>
    );

    await waitFor(() => expect(document.title).toBe("Maison Dora"));
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", "A bakery.");
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute("content", "https://cdn.test/default-og.png");
  });

  it("prefers a saved value over the given default", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "seo:default:title", type: "text", value: "Saved title", updatedAt: "now" }] },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <DoraHead title="Default title" description="Default description" ogImage="" />
      </DoraProvider>
    );

    await waitFor(() => expect(document.title).toBe("Saved title"));
  });

  it("scopes saved values by the page prop", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: {
          items: [
            { slotId: "seo:home:title", type: "text", value: "Home title", updatedAt: "now" },
            { slotId: "seo:about:title", type: "text", value: "About title", updatedAt: "now" },
          ],
        },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <DoraHead page="about" title="fallback" description="" ogImage="" />
      </DoraProvider>
    );

    await waitFor(() => expect(document.title).toBe("About title"));
  });
});
