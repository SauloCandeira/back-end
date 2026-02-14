import { Router } from "express";
import { listReports, getLatestReport } from "../services/openclawRuntime.service.js";
import { withMeta } from "../utils/response.js";
import { logSystemEvent } from "../services/logging.service.js";

const router = Router();

router.get("/reports", (_req, res) => {
  const reports = listReports();
  const latest = getLatestReport();
  logSystemEvent({
    action: "reports_list",
    status: "ok",
    metadata: { count: reports.length }
  });
  res.json(withMeta({
    reports,
    total_reports: reports.length,
    latest
  }));
});

export default router;
