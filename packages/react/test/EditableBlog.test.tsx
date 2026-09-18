import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DoraProvider } from "../src/DoraProvider";
import { EditableBlog } from "../src/EditableBlog";
import { installMockFetch, seedAuthToken, setAdminMode } from "./mock-fetch";

const samplePost = {
  id: "1",
  title: "First post",
  slug: "first-post",
  body: "<p>Hello</p>",
  publishedAt: "now",
};

describe("EditableBlog", () => {
  it("renders fetched posts", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/blog": () => ({ body: { posts: [samplePost] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableBlog />
      </DoraProvider>
    );
    expect(await screen.findByText("First post")).toBeInTheDocument();
  });

  it("shows no admin controls for a non-admin visitor", async () => {
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/blog": () => ({ body: { posts: [samplePost] } }),
    });
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableBlog />
      </DoraProvider>
    );
    await screen.findByText("First post");
    expect(screen.queryByText("+ New post")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete post")).not.toBeInTheDocument();
  });

  it("lets an authenticated admin publish a new post", async () => {
    setAdminMode(true);
    seedAuthToken();
    let posts = [samplePost];
    const { calls } = installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/blog": () => ({ body: { posts } }),
      "POST /api/sites/site1/blog": () => {
        const newPost = { id: "2", title: "Second post", slug: "second-post", body: "Body text", publishedAt: "now" };
        posts = [newPost, ...posts];
        return { status: 201, body: newPost };
      },
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableBlog />
      </DoraProvider>
    );

    await user.click(await screen.findByText("+ New post"));
    await user.type(screen.getByPlaceholderText("Post title"), "Second post");
    await user.type(screen.getByPlaceholderText("Post body"), "Body text");
    await user.click(screen.getByText("Publish"));

    await waitFor(() => expect(screen.getByText("Second post")).toBeInTheDocument());
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/sites/site1/blog")).toBe(true);
  });

  it("lets an authenticated admin delete a post", async () => {
    setAdminMode(true);
    seedAuthToken();
    let posts = [samplePost];
    installMockFetch({
      "GET /api/sites/site1/content": () => ({ body: { items: [] } }),
      "GET /api/sites/site1/blog": () => ({ body: { posts } }),
      "DELETE /api/sites/site1/blog/1": () => {
        posts = [];
        return { status: 204, body: undefined };
      },
    });
    const user = userEvent.setup();
    render(
      <DoraProvider siteId="site1" apiUrl="http://api.test">
        <EditableBlog />
      </DoraProvider>
    );

    await screen.findByText("First post");
    await user.click(screen.getByText("Delete post"));

    await waitFor(() => expect(screen.queryByText("First post")).not.toBeInTheDocument());
  });
});
