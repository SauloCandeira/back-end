import { Router } from "express";
import os from "os";
import { getSystemStructure, listAgents, listCrons } from "../services/openclawRuntime.service.js";
import { loadAllContexts } from "../services/contextLoader.service.js";
import { withMeta } from "../utils/response.js";
import { logSystemEvent } from "../services/logging.service.js";

const router = Router();

router.get("/system/status", (_req, res) => {
  const agents = listAgents();
  const contexts = loadAllContexts();
  const crons = listCrons();
  const contextCount = contexts.system.length + contexts.agents.length + contexts.runtime.length;
  const memory = process.memoryUsage();

  logSystemEvent({
    action: "system_status",
    status: "ok",
    metadata: { agent_count: agents.length, context_count: contextCount }
  });

  res.json(withMeta({
    system: "HKTECH AI Core",
    openclaw: "running",
    vps: "online",
    gateway: "active",
    architecture: "GitHub Pages + Firebase + VPS AI Gateway",
    mission: "Autonomous AI Education Platform",
    uptime: process.uptime(),
    gateway_version: process.env.GATEWAY_VERSION || "1.0.0",
    agent_count: agents.length,
    context_count: contextCount,
    cron_count: crons.jobs_count || 0,
    memory_usage: {
      rss: memory.rss,
      heap_total: memory.heapTotal,
      heap_used: memory.heapUsed
    },
    host: {
      platform: os.platform(),
      uptime: os.uptime(),
      loadavg: os.loadavg()
    }
  }));
});

router.get("/system/structure", (_req, res) => {
  const contexts = loadAllContexts();
  const totalContexts = contexts.system.length + contexts.agents.length + contexts.runtime.length;
  const structure = getSystemStructure(totalContexts);
  logSystemEvent({
    action: "system_structure",
    status: "ok",
    metadata: { context_count: totalContexts }
  });
  res.json(withMeta({
    structure
  }));
});

router.post("/system/kill-switch", (req, res) => {
  const { enabled } = req.body ?? {};
  const nextValue = String(Boolean(enabled));
  process.env.AI_KILL_SWITCH = nextValue;
  logSystemEvent({
    action: "kill_switch_update",
    status: "ok",
    metadata: { enabled: nextValue === "true" }
  });
  res.json(withMeta({
    kill_switch: nextValue === "true"
  }));
});

export default router;
