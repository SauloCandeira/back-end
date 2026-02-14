import { Router } from "express";
import { listSkills } from "../services/openclawRuntime.service.js";
import { withMeta } from "../utils/response.js";
import { logSystemEvent } from "../services/logging.service.js";

const router = Router();

router.get("/skills", (_req, res) => {
  const skills = listSkills();
  logSystemEvent({
    action: "skills_list",
    status: "ok",
    metadata: { count: skills.scripts_count }
  });
  res.json(withMeta({
    skills,
    total_skills: skills.scripts_count
  }));
});

export default router;
