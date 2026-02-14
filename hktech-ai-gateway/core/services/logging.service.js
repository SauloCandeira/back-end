import fs from "fs";
import path from "path";

const logsDir = path.resolve("/root/hktech-ai-gateway/logs");
const systemLogPath = path.join(logsDir, "system.log");
const agentsLogPath = path.join(logsDir, "agents.log");

const ensureLogsDir = () => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
};

const appendLog = (filePath, entry) => {
  ensureLogsDir();
  const line = `${JSON.stringify(entry)}\n`;
  fs.appendFileSync(filePath, line, "utf-8");
};

export const logSystemEvent = (payload) => {
  appendLog(systemLogPath, {
    timestamp: new Date().toISOString(),
    ...payload
  });
};

export const logAgentEvent = (payload) => {
  appendLog(agentsLogPath, {
    timestamp: new Date().toISOString(),
    ...payload
  });
};

export const logError = (payload) => {
  appendLog(systemLogPath, {
    timestamp: new Date().toISOString(),
    level: "error",
    ...payload
  });
};
