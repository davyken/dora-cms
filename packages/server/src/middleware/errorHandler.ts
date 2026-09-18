import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { UnsupportedFileTypeError } from "../lib/errors.js";

/**
 * Centralized error handler. Logs the real error server-side but never
 * leaks internals (stack traces, DB error text) to the client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof MulterError || err instanceof UnsupportedFileTypeError) {
    return res.status(400).json({ message: err.message });
  }
  if (err instanceof Error && err.message.startsWith("Not allowed by CORS")) {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  res.status(500).json({ message: "Something went wrong" });
}
