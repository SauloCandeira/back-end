const defaultOrigins = ["https://hktech.com.br"];
const envOrigins = process.env.ADMIN_ORIGINS
  ? process.env.ADMIN_ORIGINS.split(",").map((entry) => entry.trim()).filter(Boolean)
  : [];

export const serverConfig = {
  port: Number(process.env.PORT || 3001),
  bind: process.env.BIND_ADDRESS || "0.0.0.0",
  allowedOrigins: envOrigins.length ? envOrigins : defaultOrigins
};
