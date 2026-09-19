import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { MediaPicker } from "../src/MediaPicker";
import { installMockFetch } from "./mock-fetch";

describe("MediaPicker", () => {
  it("shows a loading state, then a message when there are no uploads", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <MediaPicker onSelect={vi.fn()} onClose={vi.fn()} />
      </DoraProvider>
    );
    expect(await screen.findByText("No uploads yet — upload an image first.")).toBeInTheDocument();
  });

  it("renders a thumbnail per uploaded item", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({
        body: {
          items: [
            { id: "1", url: "https://cdn.test/one.png", mimeType: "image/png", createdAt: "now" },
            { id: "2", url: "https://cdn.test/two.png", mimeType: "image/png", createdAt: "now" },
          ],
        },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <MediaPicker onSelect={vi.fn()} onClose={vi.fn()} />
      </DoraProvider>
    );
    await waitFor(() => expect(screen.getAllByRole("img")).toHaveLength(2));
  });

  it("calls onSelect with the clicked item's URL", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({
        body: { items: [{ id: "1", url: "https://cdn.test/one.png", mimeType: "image/png", createdAt: "now" }] },
      }),
    });
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <MediaPicker onSelect={onSelect} onClose={vi.fn()} />
      </DoraProvider>
    );

    const thumb = await screen.findByRole("img");
    await user.click(thumb.closest("button")!);

    expect(onSelect).toHaveBeenCalledWith("https://cdn.test/one.png");
  });

  it("calls onClose when the close button is clicked", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({ body: { items: [] } }),
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <MediaPicker onSelect={vi.fn()} onClose={onClose} />
      </DoraProvider>
    );

    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked, but not when the dialog itself is clicked", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/media": () => ({ body: { items: [] } }),
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <MediaPicker onSelect={vi.fn()} onClose={onClose} />
      </DoraProvider>
    );

    await user.click(await screen.findByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalled();
  });
});
