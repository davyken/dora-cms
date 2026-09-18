import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { ContentItem } from "../models/ContentItem.js";

export const contentRouter = Router({ mergeParams: true });

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const HTTPS_URL = /^https:\/\//i;

// req.params.siteId comes from the parent mount (mergeParams: true in
// app.ts); Express's per-route type inference can't see across that mount,
// so it's read as a string explicitly rather than typed on each handler.
function siteIdOf(params: Record<string, string>): string {
  return params.siteId;
}

// Public — the live site needs to read content without an admin session.
contentRouter.get("/", async (req, res, next) => {
  try {
    const items = await ContentItem.find({ siteId: siteIdOf(req.params) }).lean();
    res.json({
      items: items.map((i) => ({
        slotId: i.slotId,
        type: i.type,
        value: i.value,
        updatedAt: i.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const saveSchema = z.object({
  type: z.enum(["text", "richtext", "image", "color"]),
  value: z.string().min(0).max(20000),
});

contentRouter.put("/:slotId", requireAuth, async (req, res, next) => {
  try {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid content payload" });
    }
    const { type } = parsed.data;
    let value = parsed.data.value;

    // Type-specific validation/sanitization — this is what stops a client
    // (or anyone with a stolen token) from storing a javascript: URL as an
    // "image", or arbitrary markup as "text", that later runs for every
    // visitor of the site.
    if (type === "color") {
      if (!HEX_COLOR.test(value)) {
        return res.status(400).json({ message: "Color must be a hex value like #4f46e5" });
      }
    } else if (type === "image") {
      if (!HTTPS_URL.test(value)) {
        return res.status(400).json({ message: "Image value must be an https URL" });
      }
    } else if (type === "richtext") {
      value = sanitizeHtml(value, sanitizeHtml.defaults);
    } else {
      value = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
    }

    const siteId = siteIdOf(req.params);
    const item = await ContentItem.findOneAndUpdate(
      { siteId, slotId: req.params.slotId },
      { siteId, slotId: req.params.slotId, type, value },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    if (!item) {
      // Unreachable with upsert + new: true, but keeps the return type non-null for TS.
      return res.status(500).json({ message: "Something went wrong" });
    }

    res.json({ slotId: item.slotId, type: item.type, value: item.value, updatedAt: item.updatedAt });
  } catch (err) {
    next(err);
  }
});

// Reverts a slot back to whatever default the component itself renders
// (its `src`/`children` prop) by deleting the stored override entirely,
// rather than trying to store an empty value.
contentRouter.delete("/:slotId", requireAuth, async (req, res, next) => {
  try {
    const result = await ContentItem.deleteOne({ siteId: siteIdOf(req.params), slotId: req.params.slotId });
    if (result.deletedCount === 0) return res.status(404).json({ message: "No saved value for this slot" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
