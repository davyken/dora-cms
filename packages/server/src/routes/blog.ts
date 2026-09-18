import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { BlogPost, type BlogPostDoc } from "../models/BlogPost.js";

export const blogRouter = Router({ mergeParams: true });

// req.params.siteId comes from the parent mount (mergeParams: true in
// app.ts); Express's per-route type inference can't see across that mount,
// so it's read as a string explicitly rather than typed on each handler.
function siteIdOf(params: Record<string, string>): string {
  return params.siteId;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100) || "post"
  );
}

async function uniqueSlug(siteId: string, title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let attempt = 1;
  // Bounded by realistic post counts; avoids an unbounded loop on pathological input.
  while (attempt < 1000 && (await BlogPost.exists({ siteId, slug }))) {
    slug = `${base}-${attempt}`;
    attempt += 1;
  }
  return slug;
}

function serialize(post: Pick<BlogPostDoc, "_id" | "title" | "slug" | "body" | "coverImage" | "createdAt">) {
  return {
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    body: post.body,
    coverImage: post.coverImage,
    publishedAt: post.createdAt,
  };
}

// Public — visitors read blog posts without an admin session.
blogRouter.get("/", async (req, res, next) => {
  try {
    const posts = await BlogPost.find({ siteId: siteIdOf(req.params) }).sort({ createdAt: -1 }).lean();
    res.json({ posts: posts.map(serialize) });
  } catch (err) {
    next(err);
  }
});

const postSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(100000),
  coverImage: z.string().url().startsWith("https://").optional(),
});

blogRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Title and body are required" });
    }
    const siteId = siteIdOf(req.params);
    const title = sanitizeHtml(parsed.data.title, { allowedTags: [], allowedAttributes: {} });
    const body = sanitizeHtml(parsed.data.body, sanitizeHtml.defaults);
    const slug = await uniqueSlug(siteId, title);

    const post = await BlogPost.create({ siteId, title, body, slug, coverImage: parsed.data.coverImage });
    res.status(201).json(serialize(post));
  } catch (err) {
    next(err);
  }
});

const updateSchema = postSchema.partial();

blogRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid post payload" });
    }

    const update: Record<string, string> = {};
    if (parsed.data.title !== undefined) {
      update.title = sanitizeHtml(parsed.data.title, { allowedTags: [], allowedAttributes: {} });
    }
    if (parsed.data.body !== undefined) {
      update.body = sanitizeHtml(parsed.data.body, sanitizeHtml.defaults);
    }
    if (parsed.data.coverImage !== undefined) {
      update.coverImage = parsed.data.coverImage;
    }

    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, siteId: siteIdOf(req.params) },
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(serialize(post));
  } catch (err) {
    next(err);
  }
});

blogRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await BlogPost.deleteOne({ _id: req.params.id, siteId: siteIdOf(req.params) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Post not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
