import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AuthedRequest extends Request {
  siteId?: string;
}

/**
 * Verifies the bearer token AND that it was issued for the siteId in the
 * URL — without the second check, a token for one client's site could be
 * replayed against another site hosted on the same backend.
 */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { siteId: string };
    if (payload.siteId !== req.params.siteId) {
      return res.status(403).json({ message: "Token is not valid for this site" });
    }
    req.siteId = payload.siteId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
