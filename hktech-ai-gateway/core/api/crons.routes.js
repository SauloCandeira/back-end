import { Router } from "express";
import { listCrons } from "../services/openclawRuntime.service.js";
import { withMeta } from "../utils/response.js";
import { logSystemEvent } from "../services/logging.service.js";

const router = Router();

router.get("/crons", (_req, res) => {
  const crons = listCrons();
  logSystemEvent({
    action: "crons_list",
    status: "ok",
    metadata: { count: crons.jobs_count }
  });
  res.json(withMeta({
    crons,
    total_crons: crons.jobs_count
  }));
});

export default router;
