import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DoraProvider, useDora } from "../src/DoraProvider";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

function Probe() {
  const { content, loading, isAdminMode, isAuthenticated, login, logout } = useDora();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="admin-mode">{String(isAdminMode)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="content">{content["hero-title"]?.value ?? "(none)"}</span>
      <button onClick={() => login("secret")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <DoraProvider siteId="site1" apiUrl="http://api.test">
      <Probe />
    </DoraProvider>
  );
}

describe("DoraProvider", () => {
  it("is not in admin mode without ?edit=true", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("admin-mode")).toHaveTextContent("false");
  });

  it("is in admin mode with ?edit=true", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("admin-mode")).toHaveTextContent("true");
  });

  it("loads saved content into context on mount", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({
        body: { items: [{ slotId: "hero-title", type: "text", value: "Welcome!", updatedAt: "now" }] },
      }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("content")).toHaveTextContent("Welcome!"));
  });

  it("starts authenticated when a token is already in localStorage", async () => {
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));
  });

  it("login() stores the returned token and flips isAuthenticated", async () => {
    const user = userEvent.setup();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "POST /api/sites/site1/auth/login": () => ({ body: { token: "real-token" } }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    await user.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));
    expect(window.localStorage.getItem("dora_token")).toBe("real-token");
  });

  it("logout() clears the token and flips isAuthenticated back to false", async () => {
    seedAuthToken();
    const user = userEvent.setup();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    renderProbe();
    await waitFor(() => expect(screen.getByTestId("authenticated")).toHaveTextContent("true"));

    await user.click(screen.getByText("logout"));

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(window.localStorage.getItem("dora_token")).toBeNull();
  });
});
