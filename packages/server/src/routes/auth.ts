import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env.js";
import { rateLimitStore } from "../lib/rateLimitStore.js";
import { requireAuth } from "../middleware/auth.js";
import { SiteAuth } from "../models/SiteAuth.js";

// Slows down password guessing without needing per-site lockout state.
// Skipped under the test suite: every test in the process shares one IP,
// and many unrelated tests log in — the limiter itself is exercised in
// isolation in test/auth.test.ts instead.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
  skip: () => process.env.NODE_ENV === "test",
  store: rateLimitStore(),
});

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  store: rateLimitStore(),
});

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export const authRouter = Router({ mergeParams: true });

// The site's active password hash: whatever was set via "Change password"
// in the admin UI, or — until that's ever been used — the hash the
// developer generated with `dora-cms init` / `hash-password` and set as
// DORA_ADMIN_PASSWORD_HASH. This is what lets password changes work
// without needing to rewrite the platform's environment variables from
// inside the running app.
async function currentPasswordHash(siteId: string): Promise<string> {
  const record = await SiteAuth.findOne({ siteId }).lean();
  return record ? record.passwordHash : env.DORA_ADMIN_PASSWORD_HASH;
}

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hash = await currentPasswordHash(req.params.siteId);
    const isValid = await bcrypt.compare(parsed.data.password, hash);
    if (!isValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ siteId: req.params.siteId }, env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(200),
});

authRouter.put("/password", requireAuth, changePasswordLimiter, async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid request" });
    }

    const siteId = req.params.siteId;
    const hash = await currentPasswordHash(siteId);
    const isValid = await bcrypt.compare(parsed.data.currentPassword, hash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await SiteAuth.findOneAndUpdate({ siteId }, { siteId, passwordHash: newHash }, { upsert: true, runValidators: true });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
