import { Router } from "express";
import { listAgents, getAgentDetail } from "../services/openclawRuntime.service.js";
import { withMeta } from "../utils/response.js";
import { logAgentEvent } from "../services/logging.service.js";

const router = Router();

router.get("/agents", (_req, res) => {
  const agents = listAgents();
  logAgentEvent({
    action: "agents_list",
    status: "ok",
    metadata: { count: agents.length }
  });
  res.json(withMeta({
    agents,
    total_agents: agents.length
  }));
});

router.get("/agents/:name", (req, res) => {
  const agent = getAgentDetail(req.params.name);
  if (!agent) {
    logAgentEvent({
      action: "agent_detail",
      status: "not_found",
      agent: req.params.name
    });
    return res.status(404).json(withMeta({
      error: "Agent not found"
    }));
  }
  logAgentEvent({
    action: "agent_detail",
    status: "ok",
    agent: agent.name
  });
  res.json(withMeta({ agent }));
});

export default router;
