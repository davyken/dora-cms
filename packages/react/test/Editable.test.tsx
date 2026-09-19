import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { Editable } from "../src/Editable";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

describe("Editable", () => {
  it("renders its default children as plain text when not in admin mode", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title" as="h1">
          Welcome
        </Editable>
      </DoraProvider>
    );
    await waitFor(() => expect(screen.getByText("Welcome")).toBeInTheDocument());
    expect(screen.getByText("Welcome").hasAttribute("contenteditable")).toBe(false);
  });

  it("renders the saved value instead of the default children when content exists", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "hero-title", type: "text", value: "Saved title", updatedAt: "now" }] },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title">Default</Editable>
      </DoraProvider>
    );
    await waitFor(() => expect(screen.getByText("Saved title")).toBeInTheDocument());
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });

  it("is not editable in admin mode without authentication", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title">Welcome</Editable>
      </DoraProvider>
    );
    await waitFor(() => expect(screen.getByText("Welcome")).toBeInTheDocument());
    expect(screen.getByText("Welcome").hasAttribute("contenteditable")).toBe(false);
  });

  it("becomes contentEditable once in admin mode and authenticated", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title">Welcome</Editable>
      </DoraProvider>
    );
    await waitFor(() => {
      const el = screen.getByText("Welcome");
      expect(el.getAttribute("contenteditable")).toBe("true");
    });
  });

  it("saves the new text on blur when it changed", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "PUT /api/sites/site1/content/hero-title": () => ({
        body: { slotId: "hero-title", type: "text", value: "Updated title", updatedAt: "now" },
      }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title">Welcome</Editable>
      </DoraProvider>
    );

    const el = await screen.findByText("Welcome");
    el.textContent = "Updated title";
    fireEvent.blur(el);

    await waitFor(() => expect(screen.getByText("Updated title")).toBeInTheDocument());
    const saveCall = calls.find((c) => c.method === "PUT" && c.path === "/api/sites/site1/content/hero-title");
    expect(saveCall).toBeTruthy();
    expect(JSON.parse(saveCall!.init!.body as string)).toEqual({ type: "text", value: "Updated title" });
  });

  it("does not save on blur when the text is unchanged", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <Editable id="hero-title">Welcome</Editable>
      </DoraProvider>
    );

    const el = await screen.findByText("Welcome");
    fireEvent.blur(el);

    await new Promise((r) => setTimeout(r, 0));
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  describe("richText", () => {
    it("shows no formatting toolbar by default", async () => {
      setAdminMode(true);
      seedAuthToken();
      installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
      render(
        <DoraProvider siteId="site1" apiUrl="http://api.test">
          <Editable id="hero-title">Welcome</Editable>
        </DoraProvider>
      );
      await screen.findByText("Welcome");
      expect(screen.queryByTitle("Bold")).not.toBeInTheDocument();
    });

    it("shows a bold/italic/link toolbar when richText is on and the client can edit", async () => {
      setAdminMode(true);
      seedAuthToken();
      installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
      render(
        <DoraProvider siteId="site1" apiUrl="http://api.test">
          <Editable id="hero-title" richText>
            Welcome
          </Editable>
        </DoraProvider>
      );
      expect(await screen.findByTitle("Bold")).toBeInTheDocument();
      expect(screen.getByTitle("Italic")).toBeInTheDocument();
      expect(screen.getByTitle("Link")).toBeInTheDocument();
    });

    it("shows no toolbar for a non-admin visitor even with richText on", async () => {
      installMockFetch({ "GET /api/sites/site1/content": () => ({ body: { items: [] } }) });
      render(
        <DoraProvider siteId="site1" apiUrl="http://api.test">
          <Editable id="hero-title" richText>
            Welcome
          </Editable>
        </DoraProvider>
      );
      await screen.findByText("Welcome");
      expect(screen.queryByTitle("Bold")).not.toBeInTheDocument();
    });

    it("saves the field's innerHTML as type richtext on blur", async () => {
      setAdminMode(true);
      seedAuthToken();
      const { calls } = installMockFetch({
        "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
        "PUT /api/sites/site1/content/hero-title": () => ({
          body: { slotId: "hero-title", type: "richtext", value: "<strong>Bold text</strong>", updatedAt: "now" },
        }),
      });
      render(
        <DoraProvider siteId="site1" apiUrl="http://api.test">
          <Editable id="hero-title" richText>
            Welcome
          </Editable>
        </DoraProvider>
      );

      const el = await screen.findByText("Welcome");
      el.innerHTML = "<strong>Bold text</strong>";
      fireEvent.blur(el);

      await waitFor(() => {
        const saveCall = calls.find((c) => c.method === "PUT" && c.path === "/api/sites/site1/content/hero-title");
        expect(saveCall).toBeTruthy();
        expect(JSON.parse(saveCall!.init!.body as string)).toEqual({
          type: "richtext",
          value: "<strong>Bold text</strong>",
        });
      });
    });

    it("renders a saved richtext value as real markup, not escaped text, for a non-admin visitor", async () => {
      installMockFetch({
        "GET /api/sites/site1/content": () => ({
          body: {
            items: [{ slotId: "hero-title", type: "richtext", value: "<strong>Saved bold</strong>", updatedAt: "now" }],
          },
        }),
      });
      render(
        <DoraProvider siteId="site1" apiUrl="http://api.test">
          <Editable id="hero-title" richText>
            Welcome
          </Editable>
        </DoraProvider>
      );
      const strong = await screen.findByText("Saved bold");
      expect(strong.tagName).toBe("STRONG");
    });
  });
});
