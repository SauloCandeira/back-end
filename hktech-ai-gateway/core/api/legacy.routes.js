import { Router } from "express";
import path from "path";
import fs from "fs";
import { openclawConfig } from "../../config/openclaw.config.js";

const router = Router();

router.get("/ai-team", (_req, res) => {
  res.json({
    platform: "HKTECH",
    system: "Autonomous AI Startup",
    timestamp: new Date(),
    agents: [
      { name: "Jarvis", role: "CEO & Orchestrator", status: "active" },
      { name: "Friday", role: "Lead Developer", status: "active" },
      { name: "Sentinel", role: "Ops & Monitoring", status: "monitoring" },
      { name: "Oracle", role: "Analyst & Reports", status: "scheduled" },
      { name: "Elon", role: "Growth & Marketing", status: "strategic" }
    ]
  });
});

router.get("/reports/latest", (_req, res) => {
  try {
    if (!fs.existsSync(openclawConfig.reportsDir)) {
      return res.json({ message: "No reports directory yet" });
    }
    const files = fs.readdirSync(openclawConfig.reportsDir);
    if (files.length === 0) {
      return res.json({ message: "No reports generated yet" });
    }
    const latest = files.sort().reverse()[0];
    const content = fs.readFileSync(path.join(openclawConfig.reportsDir, latest), "utf-8");
    res.json({ file: latest, content });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to read reports" });
  }
});

router.get("/agents/souls", (_req, res) => {
  try {
    const agents = fs.readdirSync(openclawConfig.agentsDir);
    const souls = agents.map((agent) => {
      const soulPath = path.join(openclawConfig.agentsDir, agent, "SOUL.md");
      if (fs.existsSync(soulPath)) {
        const content = fs.readFileSync(soulPath, "utf-8");
        return { name: agent, soul: content };
      }
      return { name: agent, soul: null };
    });
    res.json({ agents: souls });
  } catch (error) {
    res.status(500).json({ error: "Failed to read SOUL files" });
  }
});

router.get("/agents/soul/:name", (req, res) => {
  try {
    const agentName = req.params.name.toLowerCase();
    const soulPath = path.join(openclawConfig.agentsDir, agentName, "SOUL.md");
    if (!fs.existsSync(soulPath)) {
      return res.status(404).json({ error: "SOUL not found" });
    }
    const content = fs.readFileSync(soulPath, "utf-8");
    res.json({ name: agentName, soul: content });
  } catch (error) {
    res.status(500).json({ error: "Failed to read SOUL" });
  }
});

router.post("/agents/soul/:name", (req, res) => {
  try {
    const agentName = req.params.name.toLowerCase();
    const { soul } = req.body;
    if (!soul) {
      return res.status(400).json({ error: "SOUL content required" });
    }
    const agentPath = path.join(openclawConfig.agentsDir, agentName);
    const soulPath = path.join(agentPath, "SOUL.md");
    if (!fs.existsSync(agentPath)) {
      fs.mkdirSync(agentPath, { recursive: true });
    }
    fs.writeFileSync(soulPath, soul, "utf-8");
    res.json({
      success: true,
      message: `SOUL of ${agentName} updated and synced with VPS`
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update SOUL" });
  }
});

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "HKTECH AI Gateway",
    port: Number(process.env.PORT || 3001),
    timestamp: new Date()
  });
});

export default router;
