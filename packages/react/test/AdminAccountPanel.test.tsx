import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminAccountPanel } from "../src/AdminAccountPanel";
import { DoraProvider } from "../src/DoraProvider";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /Account/ }));
}

describe("AdminAccountPanel", () => {
  it("renders nothing outside admin mode", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const { container } = render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("renders nothing before the client is authenticated", async () => {
    setAdminMode(true);
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const { container } = render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await waitFor(() => expect(container.textContent).toBe(""));
  });

  it("is collapsed by default and expands to show the change-password form", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );

    expect(screen.queryByText("Change password", { selector: "p" })).not.toBeInTheDocument();
    await openPanel(user);
    expect(screen.getByText("Change password", { selector: "p" })).toBeInTheDocument();
  });

  it("rejects a new password shorter than 8 characters without calling the API", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await openPanel(user);

    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm new password"), "short");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("New password must be at least 8 characters")).toBeInTheDocument();
    expect(calls.some((c) => c.path.endsWith("/auth/password"))).toBe(false);
  });

  it("rejects mismatched new/confirm passwords without calling the API", async () => {
    setAdminMode(true);
    seedAuthToken();
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await openPanel(user);

    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword2");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("New passwords don't match")).toBeInTheDocument();
    expect(calls.some((c) => c.path.endsWith("/auth/password"))).toBe(false);
  });

  it("submits a successful password change and clears the fields", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "PUT /api/sites/site1/auth/password": () => ({ status: 204 }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await openPanel(user);

    const currentInput = screen.getByLabelText("Current password") as HTMLInputElement;
    const newInput = screen.getByLabelText("New password") as HTMLInputElement;
    const confirmInput = screen.getByLabelText("Confirm new password") as HTMLInputElement;

    await user.type(currentInput, "oldpassword");
    await user.type(newInput, "newpassword1");
    await user.type(confirmInput, "newpassword1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(currentInput.value).toBe("");
    expect(newInput.value).toBe("");
    expect(confirmInput.value).toBe("");
  });

  it("shows the server error message when the API rejects the change", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "PUT /api/sites/site1/auth/password": () => ({ status: 401, body: { message: "Incorrect current password" } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await openPanel(user);

    await user.type(screen.getByLabelText("Current password"), "wrongpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "newpassword1");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Incorrect current password")).toBeInTheDocument();
  });

  it("toggles all three password fields between hidden and visible text", async () => {
    setAdminMode(true);
    seedAuthToken();
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <AdminAccountPanel />
      </DoraProvider>
    );
    await openPanel(user);

    const currentInput = screen.getByLabelText("Current password");
    expect(currentInput).toHaveAttribute("type", "password");

    await user.click(screen.getByLabelText("Show passwords"));

    expect(currentInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute("type", "text");
  });
});
