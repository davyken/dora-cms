import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Media } from "../models/Media.js";

export const mediaRouter = Router({ mergeParams: true });

// req.params.siteId comes from the parent mount (mergeParams: true in
// app.ts); Express's per-route type inference can't see across that mount,
// so it's read as a string explicitly rather than typed on each handler.
function siteIdOf(params: Record<string, string>): string {
  return params.siteId;
}

const MAX_ITEMS = 200;

// Admin-only — the library is a picker for the client's own uploads, not
// public data.
mediaRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const items = await Media.find({ siteId: siteIdOf(req.params) })
      .sort({ createdAt: -1 })
      .limit(MAX_ITEMS)
      .lean();
    res.json({
      items: items.map((i) => ({ id: String(i._id), url: i.url, mimeType: i.mimeType, createdAt: i.createdAt })),
    });
  } catch (err) {
    next(err);
  }
});
