module.exports = {
  apps: [
    {
      name: "hktech-ai",
      script: "./ai-gateway.js",
      cwd: "/root/hktech-ai-gateway",
      env_file: ".env",
      autorestart: true,
      max_memory_restart: "300M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/root/hktech-ai-gateway/logs/pm2-error.log",
      out_file: "/root/hktech-ai-gateway/logs/pm2-out.log",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "hk-infra-watcher",
      script: "./infra-watcher.js",
      cwd: "/root/hktech-ai-gateway",
      autorestart: true,
      max_memory_restart: "100M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
