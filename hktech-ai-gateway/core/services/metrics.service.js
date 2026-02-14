import fs from "fs";
import path from "path";

const logsDir = path.resolve("/root/hktech-ai-gateway/logs");
const systemLogPath = path.join(logsDir, "system.log");
const agentsLogPath = path.join(logsDir, "agents.log");

const safeReadLines = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split(/\r?\n/).filter(Boolean);
  } catch (error) {
    return [];
  }
};

const parseLogs = (filePath) => {
  const lines = safeReadLines(filePath);
  return lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);
};

const withinLast24h = (timestamp) => {
  if (!timestamp) return false;
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return false;
  return ts >= Date.now() - 24 * 60 * 60 * 1000;
};

export const buildLlmMetrics = () => {
  const systemLogs = parseLogs(systemLogPath);
  const agentLogs = parseLogs(agentsLogPath);
  const allLogs = [...systemLogs, ...agentLogs];

  const totalRequests = allLogs.filter((entry) => entry.action === "request").length;
  const totalOperations = allLogs.length;

  const agentsActivity = agentLogs.reduce((acc, entry) => {
    const agent = entry.agent || "unknown";
    acc[agent] = (acc[agent] || 0) + 1;
    return acc;
  }, {});

  const last24hOperations = allLogs.filter((entry) => withinLast24h(entry.timestamp));
  const lastExecutions = last24hOperations.slice(-10);

  return {
    total_requests: totalRequests,
    total_operations: totalOperations,
    tokens_total: 0,
    tokens_placeholder: true,
    agents_activity: agentsActivity,
    system_health: {
      status: "ok",
      logs_collected: totalOperations
    },
    last_24h_operations: last24hOperations.length,
    last_executions: lastExecutions
  };
};
