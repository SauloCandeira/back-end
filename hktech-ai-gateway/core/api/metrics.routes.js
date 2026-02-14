import { Router } from "express";
import { withMeta } from "../utils/response.js";
import { buildLlmMetrics } from "../services/metrics.service.js";
import { logSystemEvent } from "../services/logging.service.js";
import { fetchLlmMetricsFromDb } from "../services/llmMetrics.service.js";

const router = Router();

router.get("/metrics/llm", async (_req, res) => {
  const dbMetrics = await fetchLlmMetricsFromDb();
  if (dbMetrics) {
    logSystemEvent({
      action: "metrics_llm",
      status: "ok",
      metadata: { source: "postgres" }
    });
    return res.json(withMeta({
      ...dbMetrics
    }));
  }

  const fallback = buildLlmMetrics();
  logSystemEvent({
    action: "metrics_llm",
    status: "fallback",
    metadata: { source: "logs" }
  });
  return res.json(withMeta({
    total_cost_today: 0,
    total_cost_month: 0,
    total_tokens_today: 0,
    total_requests_today: fallback.total_requests || 0,
    most_used_model: null,
    usage_by_model: [],
    usage_by_agent: Object.entries(fallback.agents_activity || {}).map(([agent, count]) => ({
      agent,
      tokens: Number(count) || 0,
      cost_usd: 0
    })),
    recent_operations: (fallback.last_executions || []).map((entry) => ({
      model: "unknown",
      agent: entry.agent || "unknown",
      tokens: 0,
      cost_usd: 0,
      endpoint: entry.action || "unknown",
      created_at: entry.timestamp || null
    }))
  }));
});

router.get("/metrics/system", (_req, res) => {
  logSystemEvent({
    action: "metrics_system",
    status: "ok"
  });
  res.json(withMeta({
    status: "placeholder",
    message: "System metrics will be available in a future release."
  }));
});

router.get("/metrics/agents", (_req, res) => {
  logSystemEvent({
    action: "metrics_agents",
    status: "ok"
  });
  res.json(withMeta({
    status: "placeholder",
    message: "Agent metrics will be available in a future release."
  }));
});

export default router;
