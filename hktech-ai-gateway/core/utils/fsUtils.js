import fs from "fs";
import path from "path";

export const safeExists = (targetPath) => {
  try {
    return fs.existsSync(targetPath);
  } catch (error) {
    return false;
  }
};

export const safeListDir = (targetPath) => {
  try {
    return fs.readdirSync(targetPath);
  } catch (error) {
    return [];
  }
};

export const safeReadFile = (targetPath, encoding = "utf-8") => {
  try {
    return fs.readFileSync(targetPath, encoding);
  } catch (error) {
    return null;
  }
};

export const safeStat = (targetPath) => {
  try {
    return fs.statSync(targetPath);
  } catch (error) {
    return null;
  }
};

export const listDirectories = (targetPath) => {
  try {
    return fs.readdirSync(targetPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    return [];
  }
};

export const readFileTail = (targetPath, maxBytes = 20000) => {
  try {
    const stats = fs.statSync(targetPath);
    const size = stats.size;
    const start = Math.max(0, size - maxBytes);
    const length = size - start;
    const buffer = Buffer.alloc(length);
    const fd = fs.openSync(targetPath, "r");
    fs.readSync(fd, buffer, 0, length, start);
    fs.closeSync(fd);
    return buffer.toString("utf-8");
  } catch (error) {
    return null;
  }
};

export const listFilesByMtime = (targetPath) => {
  const files = safeListDir(targetPath)
    .map((name) => ({
      name,
      fullPath: path.join(targetPath, name)
    }))
    .map((entry) => ({
      ...entry,
      stat: safeStat(entry.fullPath)
    }))
    .filter((entry) => entry.stat && entry.stat.isFile());

  return files.sort((a, b) => (b.stat.mtimeMs || 0) - (a.stat.mtimeMs || 0));
};

export const countFiles = (targetPath) => {
  try {
    return fs.readdirSync(targetPath).length;
  } catch (error) {
    return 0;
  }
};
