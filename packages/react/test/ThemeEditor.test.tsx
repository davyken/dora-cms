import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { ThemeEditor } from "../src/ThemeEditor";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

const variables = [{ key: "primary", label: "Brand color", default: "#4f46e5" }];

describe("ThemeEditor", () => {
  it("applies the default color as a CSS custom property even for non-admin visitors", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <ThemeEditor variables={variables} />
      </DoraProvider>
    );
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue("--dora-primary")).toBe("#4f46e5")
    );
  });

  it("applies a saved color instead of the default", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "theme.primary", type: "color", value: "#ff0000", updatedAt: "now" }] },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <ThemeEditor variables={variables} />
      </DoraProvider>
    );
    await waitFor(() =>
      expect(document.documentElement.style.getPropertyValue("--dora-primary")).toBe("#ff0000")
    );
  });

  it("renders no picker UI for a non-admin visitor", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <ThemeEditor variables={variables} />
      </DoraProvider>
    );
    await waitFor(() => expect(document.documentElement.style.getPropertyValue("--dora-primary")).toBe("#4f46e5"));
    expect(screen.queryByText("Brand color")).not.toBeInTheDocument();
  });

  it("renders a color picker for an authenticated admin and saves on change", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "PUT /api/sites/site1/content/theme.primary": () => ({
        body: { slotId: "theme.primary", type: "color", value: "#00ff00", updatedAt: "now" },
      }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <ThemeEditor variables={variables} />
      </DoraProvider>
    );

    const input = (await screen.findByText("Brand color")).closest("label")!.querySelector("input")!;
    await user.click(input);
    fireEventChange(input, "#00ff00");

    await waitFor(() =>
      expect(calls.some((c) => c.method === "PUT" && c.path === "/api/sites/site1/content/theme.primary")).toBe(true)
    );
  });
});

// jsdom's userEvent doesn't drive <input type="color"> pickers, so the
// change is dispatched directly, same as a real browser's color picker would.
function fireEventChange(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
