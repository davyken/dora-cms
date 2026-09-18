import { Router } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { UnsupportedFileTypeError } from "../lib/errors.js";
import { getStorageAdapter } from "../lib/storage.js";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new UnsupportedFileTypeError("Only PNG, JPEG, WEBP or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

// Skipped under the test suite — see the comment on loginLimiter in routes/auth.ts.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: () => process.env.NODE_ENV === "test",
});

export const uploadRouter = Router({ mergeParams: true });

uploadRouter.post("/", requireAuth, uploadLimiter, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const storage = getStorageAdapter();
    const url = await storage.upload(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
});
