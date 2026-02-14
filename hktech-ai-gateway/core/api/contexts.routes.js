import { Router } from "express";
import { loadAllContexts } from "../services/contextLoader.service.js";
import { withMeta } from "../utils/response.js";
import { logSystemEvent } from "../services/logging.service.js";

const router = Router();

router.get("/contexts", (_req, res) => {
  const contexts = loadAllContexts();
  const total = contexts.system.length + contexts.agents.length + contexts.runtime.length;
  logSystemEvent({
    action: "contexts_load",
    status: "ok",
    metadata: { total }
  });
  res.json(withMeta({
    contexts,
    total_contexts: total
  }));
});

export default router;
