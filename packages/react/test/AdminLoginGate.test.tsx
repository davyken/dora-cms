import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminLoginGate } from "../src/AdminLoginGate";
import { DoraProvider } from "../src/DoraProvider";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

describe("AdminLoginGate", () => {
  it("renders children directly when not in admin mode", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );
    expect(await screen.findByText("Site content")).toBeInTheDocument();
  });

  it("renders children directly when already authenticated", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );
    expect(await screen.findByText("Site content")).toBeInTheDocument();
  });

  it("shows a login form instead of children when in admin mode and not authenticated", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );
    expect(await screen.findByText("Site admin login")).toBeInTheDocument();
    expect(screen.queryByText("Site content")).not.toBeInTheDocument();
  });

  it("reveals children after a successful login", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "POST /api/sites/site1/auth/login": () => ({ body: { token: "real-token" } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );

    await user.type(await screen.findByPlaceholderText("Password"), "correct-password");
    await user.click(screen.getByText("Sign in"));

    await waitFor(() => expect(screen.getByText("Site content")).toBeInTheDocument());
  });

  it("shows an error message and stays on the form after a failed login", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "POST /api/sites/site1/auth/login": () => ({ status: 401, body: { message: "Incorrect password" } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );

    await user.type(await screen.findByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByText("Sign in"));

    expect(await screen.findByText("Incorrect password")).toBeInTheDocument();
    expect(screen.queryByText("Site content")).not.toBeInTheDocument();
  });

  it("toggles the password field between hidden and visible text", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminLoginGate>
          <p>Site content</p>
        </AdminLoginGate>
      </DoraProvider>
    );

    const input = await screen.findByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Show password" });
    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
