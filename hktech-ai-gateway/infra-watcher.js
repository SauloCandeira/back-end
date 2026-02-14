// infra-watcher.js
// Autonomous watcher for production infra self-healing

const chokidar = require('chokidar');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const GATEWAY_DIR = '/root/hktech-ai-gateway';
const LOCK_FILE = '/root/runtime/infra.lock';
const LOG_FILE = '/root/logs/infra-sync.log';
const SYNC_SCRIPT = path.join(GATEWAY_DIR, 'scripts/infra-auto-sync.sh');
const DEBOUNCE_MS = 10000;
const MIN_INTERVAL_MS = 60000;

let lastSync = 0;
let debounceTimer = null;

function log(msg) {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${ts}] [INFRA-WATCHER] ${msg}\n`);
}

function canRunSync() {
  if (fs.existsSync(LOCK_FILE)) {
    log('infra-auto-sync is already running. Skipping.');
    return false;
  }
  const now = Date.now();
  if (now - lastSync < MIN_INTERVAL_MS) {
    log('Last sync < 60s ago. Skipping.');
    return false;
  }
  return true;
}

function runSync(reason, files) {
  if (!canRunSync()) return;
  fs.writeFileSync(LOCK_FILE, String(Date.now()));
  log(`Triggering infra-auto-sync.sh due to: ${reason}. Files: ${files.join(', ')}`);
  exec(`bash ${SYNC_SCRIPT}`, (err, stdout, stderr) => {
    if (err) log(`infra-auto-sync.sh error: ${err.message}`);
    if (stdout) log(`infra-auto-sync.sh output: ${stdout.trim()}`);
    if (stderr) log(`infra-auto-sync.sh stderr: ${stderr.trim()}`);
    fs.unlinkSync(LOCK_FILE);
    lastSync = Date.now();
  });
}

const watcher = chokidar.watch([
  path.join(GATEWAY_DIR, 'ai-gateway.js'),
  path.join(GATEWAY_DIR, 'ecosystem.config.js'),
  path.join(GATEWAY_DIR, 'package.json'),
  path.join(GATEWAY_DIR, '.env'),
  path.join(GATEWAY_DIR, 'core', 'middleware'),
  path.join(GATEWAY_DIR, 'core', 'config')
], {
  persistent: true,
  ignoreInitial: true,
  depth: 2
});

let changedFiles = [];

watcher.on('all', (event, filePath) => {
  changedFiles.push(filePath);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSync(`File change detected (${event})`, Array.from(new Set(changedFiles)));
    changedFiles = [];
  }, DEBOUNCE_MS);
});

log('infra-watcher started. Autonomous infra healing active.');
