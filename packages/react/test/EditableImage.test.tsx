import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { EditableImage } from "../src/EditableImage";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

describe("EditableImage", () => {
  it("renders a plain image with no controls when not in admin mode", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
      </DoraProvider>
    );
    const img = await screen.findByAltText("Logo");
    expect(img).toHaveAttribute("src", "/logo.png");
    expect(screen.queryByText("Change image")).not.toBeInTheDocument();
  });

  it("shows a saved image URL instead of the default src", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "logo", type: "image", value: "https://cdn.test/logo.png", updatedAt: "now" }] },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
      </DoraProvider>
    );
    const img = await screen.findByAltText("Logo");
    expect(img).toHaveAttribute("src", "https://cdn.test/logo.png");
  });

  it("shows a 'Change image' control only in authenticated admin mode", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
      </DoraProvider>
    );
    expect(await screen.findByText("Change image")).toBeInTheDocument();
  });

  it("uploads the selected file, then saves the returned URL as content", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "POST /api/sites/site1/upload": () => ({ body: { url: "https://cdn.test/new-logo.png" } }),
      "PUT /api/sites/site1/content/logo": () => ({
        body: { slotId: "logo", type: "image", value: "https://cdn.test/new-logo.png", updatedAt: "now" },
      }),
    });
    const user = userEvent.setup();

    const { container } = render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableImage id="logo" src="/logo.png" alt="Logo" />
      </DoraProvider>
    );

    await screen.findByText("Change image");
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["fake-bytes"], "logo.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await waitFor(() => expect(screen.getByAltText("Logo")).toHaveAttribute("src", "https://cdn.test/new-logo.png"));
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/sites/site1/upload")).toBe(true);
  });
});
