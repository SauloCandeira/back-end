import { logSystemEvent } from "../services/logging.service.js";

export const killSwitchMiddleware = (req, res, next) => {
  const enabled = String(process.env.AI_KILL_SWITCH || "false").toLowerCase() === "true";
  if (!enabled) return next();

  if (req.path === "/system/kill-switch" && req.method === "POST") {
    return next();
  }

  logSystemEvent({
    action: "kill_switch_block",
    status: "blocked",
    metadata: { path: req.path, method: req.method }
  });

  return res.status(423).json({
    error: "AI_KILL_SWITCH_ENABLED",
    message: "AI operations are temporarily disabled.",
    timestamp: new Date().toISOString()
  });
};
