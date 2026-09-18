import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env.js";

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
});

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export const authRouter = Router({ mergeParams: true });

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Password is required" });
    }

    const isValid = await bcrypt.compare(parsed.data.password, env.DORA_ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign({ siteId: req.params.siteId }, env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});
