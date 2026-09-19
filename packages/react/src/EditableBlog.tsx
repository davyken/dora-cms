import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";
import { useDora } from "./DoraProvider";
import type { BlogPost } from "./types";

export interface EditableBlogProps {
  /** Custom renderer for each post in view mode. Falls back to a plain <article>. */
  renderPost?: (post: BlogPost) => React.ReactNode;
}

/**
 * Renders the site's blog posts, and — for an authenticated admin — lets the
 * client add, edit, delete, and drag-to-reorder posts directly from the
 * live page. This is the one place clients can add brand-new content,
 * because each post's shape (title/body/cover image) is fixed by the
 * developer ahead of time.
 */
export function EditableBlog({ renderPost }: EditableBlogProps) {
  const { api, isAdminMode, isAuthenticated } = useDora();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canEdit = isAdminMode && isAuthenticated;
  // Requires a small drag before activating, so clicking into the post
  // itself (e.g. to select text) doesn't get mistaken for a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(posts, oldIndex, newIndex);
    setPosts(reordered); // optimistic — snappy drag feedback
    try {
      await api.reorderBlogPosts(reordered.map((p) => p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the new order");
      refresh(); // revert to whatever the server actually has
    }
  };

  if (loading) return null;

  return (
    <div className="dora-blog">
      {error && <p className="dora-blog-error">{error}</p>}

      {canEdit ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {posts.map((post) => (
              <SortablePost key={post.id} post={post} renderPost={renderPost} onDelete={handleDelete} busy={busy} />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        posts.map((post) =>
          renderPost ? (
            <React.Fragment key={post.id}>{renderPost(post)}</React.Fragment>
          ) : (
            <article key={post.id} className="dora-blog-post">
              <h2>{post.title}</h2>
              {/* Body is sanitized server-side (allow-listed tags only) before storage. */}
              <div dangerouslySetInnerHTML={{ __html: post.body }} />
            </article>
          )
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

interface SortablePostProps {
  post: BlogPost;
  renderPost?: (post: BlogPost) => React.ReactNode;
  onDelete: (id: string) => void;
  busy: boolean;
}

function SortablePost({ post, renderPost, onDelete, busy }: SortablePostProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (renderPost) {
    return (
      <div ref={setNodeRef} style={style} className="dora-blog-sortable">
        <span className="dora-blog-drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </span>
        {renderPost(post)}
      </div>
    );
  }

  return (
    <article ref={setNodeRef} style={style} className="dora-blog-post">
      <div className="dora-blog-post-header">
        <span className="dora-blog-drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </span>
        <h2>{post.title}</h2>
      </div>
      {/* Body is sanitized server-side (allow-listed tags only) before storage. */}
      <div dangerouslySetInnerHTML={{ __html: post.body }} />
      <button type="button" disabled={busy} onClick={() => onDelete(post.id)} className="dora-blog-delete">
        Delete post
      </button>
    </article>
  );
}
