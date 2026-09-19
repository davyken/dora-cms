import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { SeoFields } from "../src/SeoFields";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /SEO/ }));
}

describe("SeoFields", () => {
  it("renders nothing outside admin mode", async () => {
    installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
    const { container } = render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields />
      </DoraProvider>
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("renders nothing before the client is authenticated", async () => {
    setAdminMode(true);
    installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
    const { container } = render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields />
      </DoraProvider>
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("is collapsed by default and expands to show the fields for the given page", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields page="about" />
      </DoraProvider>
    );

    expect(screen.queryByText('Page SEO — "about"')).not.toBeInTheDocument();
    await openPanel(user);
    expect(screen.getByText('Page SEO — "about"')).toBeInTheDocument();
  });

  it("pre-fills fields from saved content, scoped by page", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: {
          items: [
            { slotId: "seo:about:title", type: "text", value: "About us", updatedAt: "now" },
            { slotId: "seo:about:description", type: "text", value: "Our story.", updatedAt: "now" },
          ],
        },
      }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields page="about" />
      </DoraProvider>
    );
    await openPanel(user);

    expect(screen.getByDisplayValue("About us")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Our story.")).toBeInTheDocument();
  });

  it("saves the title on blur, not on every keystroke", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "PUT /api/sites/site1/content/seo%3Adefault%3Atitle": () => ({
        body: { slotId: "seo:default:title", type: "text", value: "New title", updatedAt: "now" },
      }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields />
      </DoraProvider>
    );
    await openPanel(user);

    const titleInput = screen.getByPlaceholderText("Shown in the browser tab and search results");
    await user.type(titleInput, "New title");
    expect(calls.some((c) => c.method === "PUT")).toBe(false);

    await user.tab();
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
  });

  it("shows an upload control and an image preview once one is saved", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "seo:default:ogImage", type: "image", value: "https://cdn.test/og.png", updatedAt: "now" }] },
      }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields />
      </DoraProvider>
    );
    await openPanel(user);

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn.test/og.png");
    expect(screen.getByText("Replace image")).toBeInTheDocument();
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("lets an admin pick the OG image from the media library", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({
        body: { items: [{ id: "1", url: "https://cdn.test/library-og.png", mimeType: "image/png", createdAt: "now" }] },
      }),
      "PUT /api/sites/site1/content/seo%3Adefault%3AogImage": () => ({
        body: { slotId: "seo:default:ogImage", type: "image", value: "https://cdn.test/library-og.png", updatedAt: "now" },
      }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <SeoFields />
      </DoraProvider>
    );
    await openPanel(user);

    await user.click(screen.getByText("Choose existing"));
    const thumb = await screen.findByAltText("Uploaded image");
    await user.click(thumb.closest("button")!);

    await waitFor(() =>
      expect(screen.getByAltText("Social share image preview")).toHaveAttribute("src", "https://cdn.test/library-og.png")
    );
  });
});
