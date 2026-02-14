
#!/bin/bash
# scripts/infra-auto-sync.sh
# Hardened automation script for self-healing VPS infrastructure
set -e

GATEWAY_DIR="/root/hktech-ai-gateway"
REPOS_DIR="/root/hk-repos"
LOG_FILE="/root/logs/infra-sync.log"
ECOSYSTEM="$GATEWAY_DIR/ecosystem.config.js"
GATEWAY_NAME="hktech-ai"
GATEWAY_PORT=3001
ENV_FILE="$GATEWAY_DIR/.env"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

log() {
  echo "[$TIMESTAMP] [INFRA-AUTO] $1" | tee -a "$LOG_FILE"
}

mkdir -p /root/logs
log "--- Infra sync started ---"

# Step 1: Explicit path validation
cd "$GATEWAY_DIR"
log "Working directory: $GATEWAY_DIR"

# Step 3: Smart git sync (monorepo safe)
log "Pulling latest changes from gateway repo..."
git pull 2>&1 | tee -a "$LOG_FILE"

if [ -d "$REPOS_DIR" ]; then
  for repo in "$REPOS_DIR"/*; do
    if [ -d "$repo/.git" ]; then
      log "Pulling latest changes from nested repo: $repo"
      cd "$repo"
      git pull 2>&1 | tee -a "$LOG_FILE"
      cd "$GATEWAY_DIR"
    else
      log "Skipping non-git directory: $repo"
    fi
  done
fi

# Step 6: Change detection optimization
cd "$GATEWAY_DIR"
PKG_HASH_BEFORE=$(sha256sum package.json | awk '{print $1}')
LOCK_HASH_BEFORE=$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}')

CHANGED_CORE=false
for f in ai-gateway.js ecosystem.config.js; do
  if [ -f "$GATEWAY_DIR/$f" ]; then
    if git status --porcelain "$f" | grep -q "^ M"; then
      log "Detected change in $f"
      CHANGED_CORE=true
    fi
  fi
done
for f in core/middleware/* core/config/*; do
  if [ -f "$GATEWAY_DIR/$f" ]; then
    if git status --porcelain "$f" | grep -q "^ M"; then
      log "Detected change in $f"
      CHANGED_CORE=true
    fi
  fi
done

# Step 2: Safe PM2 process filtering
PM2_PROCESSES=$(pm2 jlist | grep 'name' | grep -o '"[^"]*"' | tr -d '"')
if echo "$PM2_PROCESSES" | grep -q "$GATEWAY_NAME"; then
  log "Primary gateway process detected: $GATEWAY_NAME"
else
  log "Primary gateway process not found. Starting..."
  pm2 start "$ECOSYSTEM" 2>&1 | tee -a "$LOG_FILE"
fi

# Step 4: Env & dotenv safety
if [ ! -f "$ENV_FILE" ]; then
  log "ERROR: .env file missing. Aborting gateway restart."
  exit 1
fi
REQUIRED_VARS=(INTERNAL_API_KEY DATABASE_URL PORT)
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" "$ENV_FILE"; then
    log "ERROR: Required env var $var missing in .env. Aborting restart."
    exit 1
  fi
done

# Step 6: Only run npm install if package.json or package-lock.json changed
PKG_HASH_AFTER=$(sha256sum package.json | awk '{print $1}')
LOCK_HASH_AFTER=$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}')
if [ "$PKG_HASH_BEFORE" != "$PKG_HASH_AFTER" ] || [ "$LOCK_HASH_BEFORE" != "$LOCK_HASH_AFTER" ]; then
  log "package.json or package-lock.json changed. Running npm install..."
  npm install --silent 2>&1 | tee -a "$LOG_FILE"
else
  log "No dependency changes detected. Skipping npm install."
fi

# Step 2: Only restart gateway if core files changed
if [ "$CHANGED_CORE" = true ]; then
  log "Restarting gateway ($GATEWAY_NAME) due to core file changes..."
  pm2 restart "$GATEWAY_NAME" --update-env 2>&1 | tee -a "$LOG_FILE"
else
  log "No core file changes detected. Skipping gateway restart."
fi

# Step 5: Healthcheck hardening
log "Health check: /api/health"
curl -s "http://127.0.0.1:$GATEWAY_PORT/api/health" | tee -a "$LOG_FILE"
log "Health check: /api/system/status"
curl -s "http://127.0.0.1:$GATEWAY_PORT/api/system/status" | tee -a "$LOG_FILE"
log "Health check: /api/metrics/llm (internal API key)"
INTERNAL_API_KEY=$(grep '^INTERNAL_API_KEY=' "$ENV_FILE" | cut -d= -f2-)
curl -s -H "x-api-key: $INTERNAL_API_KEY" "http://127.0.0.1:$GATEWAY_PORT/api/metrics/llm" | tee -a "$LOG_FILE"

log "--- Infra sync complete ---"
