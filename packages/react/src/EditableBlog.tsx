import React, { useEffect, useState } from "react";
import { useDora } from "./DoraProvider";
import type { BlogPost } from "./types";

export interface EditableBlogProps {
  /** Custom renderer for each post in view mode. Falls back to a plain <article>. */
  renderPost?: (post: BlogPost) => React.ReactNode;
}

/**
 * Renders the site's blog posts, and — for an authenticated admin — lets the
 * client add, edit and delete posts directly from the live page. This is the
 * one place clients can add brand-new content, because each post's shape
 * (title/body/cover image) is fixed by the developer ahead of time.
 */
export function EditableBlog({ renderPost }: EditableBlogProps) {
  const { api, isAdminMode, isAuthenticated } = useDora();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canEdit = isAdminMode && isAuthenticated;

  const refresh = () => {
    api
      .getBlogPosts()
      .then(({ posts }) => setPosts(posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [api]);

  const handleCreate = async () => {
    if (!draft || !draft.title.trim() || !draft.body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createBlogPost({ title: draft.title.trim(), body: draft.body.trim() });
      setDraft(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish post");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await api.deleteBlogPost(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete post");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="dora-blog">
      {error && <p className="dora-blog-error">{error}</p>}
      {posts.map((post) =>
        renderPost ? (
          <React.Fragment key={post.id}>{renderPost(post)}</React.Fragment>
        ) : (
          <article key={post.id} className="dora-blog-post">
            <h2>{post.title}</h2>
            {/* Body is sanitized server-side (allow-listed tags only) before storage. */}
            <div dangerouslySetInnerHTML={{ __html: post.body }} />
            {canEdit && (
              <button type="button" disabled={busy} onClick={() => handleDelete(post.id)} className="dora-blog-delete">
                Delete post
              </button>
            )}
          </article>
        )
      )}

      {canEdit && (
        <div className="dora-blog-new">
          {draft ? (
            <>
              <input
                placeholder="Post title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <textarea
                placeholder="Post body"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <div className="dora-blog-new-actions">
                <button type="button" disabled={busy} onClick={handleCreate}>
                  Publish
                </button>
                <button type="button" disabled={busy} onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setDraft({ title: "", body: "" })}>
              + New post
            </button>
          )}
        </div>
      )}
    </div>
  );
}
