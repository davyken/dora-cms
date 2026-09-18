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

  app.use("/api/sites/:siteId/auth", authRouter);
  app.use("/api/sites/:siteId/content", contentRouter);
  app.use("/api/sites/:siteId/blog", blogRouter);
  app.use("/api/sites/:siteId/upload", uploadRouter);

  app.use(errorHandler);

  return app;
}
