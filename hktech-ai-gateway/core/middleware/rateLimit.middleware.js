import { logSystemEvent } from "../services/logging.service.js";

const rateState = new Map();
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const DEFAULT_MAX = Number(process.env.RATE_LIMIT_MAX || 120);

const now = () => Date.now();

const cleanup = () => {
  const cutoff = now();
  for (const [key, entry] of rateState.entries()) {
    if (entry.resetAt <= cutoff) {
      rateState.delete(key);
    }
  }
};

export const rateLimitMiddleware = (req, res, next) => {
  const path = req.path || "";
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const key = `${ip}:${path}`;
  const limit = DEFAULT_MAX;
  const windowMs = DEFAULT_WINDOW_MS;

  cleanup();

  const entry = rateState.get(key);
  if (!entry || entry.resetAt <= now()) {
    rateState.set(key, { count: 1, resetAt: now() + windowMs });
    return next();
  }

  if (entry.count >= limit) {
    logSystemEvent({
      action: "rate_limit",
      status: "blocked",
      metadata: { path, ip }
    });
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests",
      timestamp: new Date().toISOString()
    });
  }

  entry.count += 1;
  return next();
};
