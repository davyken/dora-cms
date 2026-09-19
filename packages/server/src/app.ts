import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { connectDb } from "./db.js";
import { env } from "./env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { blogRouter } from "./routes/blog.js";
import { contentRouter } from "./routes/content.js";
import { uploadRouter } from "./routes/upload.js";
import { LOCAL_UPLOAD_DEFAULT_DIR } from "./lib/storage.js";

const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (server-to-server, curl) or an explicitly
        // allow-listed origin — anything else is rejected.
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use(async (_req, _res, next) => {
    try {
      await connectDb();
      next();
    } catch (err) {
      next(err);
    }
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Only relevant with STORAGE_DRIVER=local (Render or local dev — see the
  // warning on LocalDiskStorageAdapter in lib/storage.ts). A no-op mount
  // for every other driver, since nothing ever writes into this directory.
  if (env.STORAGE_DRIVER === "local") {
    app.use("/uploads", express.static(env.LOCAL_UPLOAD_DIR ?? LOCAL_UPLOAD_DEFAULT_DIR));
  }

  app.use("/api/sites/:siteId/auth", authRouter);
  app.use("/api/sites/:siteId/content", contentRouter);
  app.use("/api/sites/:siteId/blog", blogRouter);
  app.use("/api/sites/:siteId/upload", uploadRouter);

  app.use(errorHandler);

  return app;
}
