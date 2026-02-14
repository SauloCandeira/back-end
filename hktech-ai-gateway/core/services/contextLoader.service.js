import path from "path";
import { openclawConfig } from "../../config/openclaw.config.js";
import { safeListDir, safeReadFile, safeStat, safeExists } from "../utils/fsUtils.js";

const repoContextsRoot = path.resolve("/root/hktech-ai-gateway/contexts");

const readContextDir = (dirPath, type, source) => {
  if (!safeExists(dirPath)) return [];
  return safeListDir(dirPath)
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(dirPath, file);
      const content = safeReadFile(fullPath);
      const stat = safeStat(fullPath);
      return {
        id: `${type}:${file}`,
        name: file.replace(/\.md$/i, ""),
        type,
        source,
        content: content || "",
        updated_at: stat?.mtime?.toISOString?.() || null
      };
    });
};

export const loadSystemContexts = () => {
  const dirPath = path.join(repoContextsRoot, "system");
  return readContextDir(dirPath, "system", "repo");
};

export const loadAgentContexts = () => {
  const dirPath = path.join(repoContextsRoot, "agents");
  return readContextDir(dirPath, "agents", "repo");
};

export const loadRuntimeContexts = () => {
  const dirPath = openclawConfig.contextsDir;
  return readContextDir(dirPath, "runtime", "openclaw");
};

export const loadAllContexts = () => {
  const system = loadSystemContexts();
  const agents = loadAgentContexts();
  const runtime = loadRuntimeContexts();
  return { system, agents, runtime };
};
