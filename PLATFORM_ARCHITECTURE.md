# HK Tech AI Platform Architecture

## Overview
This document maps the cross-repository integration for the HK Tech AI ecosystem and defines a shared observability contract for the Admin LLM dashboard.

## Repositories and Runtime
- Gateway (VPS): /root/hktech-ai-gateway
- Platform repo (Admin + Functions): /root/hk-repos/como-criar-um-website-v2
- OpenClaw runtime: /root/.openclaw

## Data Flow
1. Admin Frontend (GitHub Pages) calls the Gateway APIs.
2. Gateway aggregates runtime data from OpenClaw folders.
3. Admin Frontend calls Firebase Functions for LLM execution and admin data.
4. Firebase Functions use Cloud SQL and Firebase Storage.

## Gateway API Mapping
- /api/agents -> OpenClaw agents folder + SOUL.md
- /api/contexts -> Repo contexts + OpenClaw runtime contexts
- /api/reports -> OpenClaw workspace reports
- /api/crons -> OpenClaw cron/jobs.json
- /api/skills -> OpenClaw workspace scripts + TOOLS.md preview
- /api/system/status -> Gateway + host metrics
- /api/system/structure -> Path and counts
- /api/metrics/llm -> Gateway logs aggregation (placeholder tokens)

## Firebase Functions (LLM Core)
- functions/src/index.ts
  - /ia/chat -> OpenAI chat completions
  - /ia/memory -> OpenAI embeddings
- functions/src/services/hktechAI.service.ts
  - generatePatch -> OpenAI chat completions

## OpenClaw Runtime Mapping
- Agents: /root/.openclaw/agents
  - SOUL.md
  - sessions/*.jsonl
- Reports: /root/.openclaw/workspace/reports
- Crons: /root/.openclaw/cron/jobs.json
- Skills: /root/.openclaw/workspace/scripts
- Contexts: /root/.openclaw/workspace/contexts

## LLM Telemetry Hook Points
Add telemetry collection around these calls:
- functions/src/index.ts
  - tryEmbedText -> OpenAI embeddings
  - embedText -> OpenAI embeddings
  - /ia/chat -> OpenAI chat completions
- functions/src/services/hktechAI.service.ts
  - generatePatch -> OpenAI chat completions

## Admin Gateway Endpoints Config
The Admin frontend should read config/api.endpoints.json for:
- gateway_url
- metrics_url
- llm_metrics_endpoint
- agents_endpoint
- contexts_endpoint
- system_status_endpoint
- reports_endpoint

## Shared Observability Contract
All responses are JSON and include:
- last_updated: ISO timestamp
- counts and metadata fields

LLM metrics response:
{
  "total_requests": 123,
  "total_operations": 456,
  "tokens_total": 0,
  "tokens_placeholder": true,
  "agents_activity": {
    "jarvis": 10,
    "friday": 7
  },
  "system_health": {
    "status": "ok",
    "logs_collected": 456
  },
  "last_24h_operations": 30,
  "last_executions": [],
  "last_updated": "2026-02-14T00:00:00.000Z"
}

Agent activity response:
{
  "agents": [
    {
      "name": "jarvis",
      "status": "active",
      "soul": "...",
      "soul_preview": "...",
      "last_activity": "2026-02-14T00:00:00.000Z"
    }
  ],
  "total_agents": 4,
  "last_updated": "2026-02-14T00:00:00.000Z"
}

System health response:
{
  "system": "HKTECH AI Core",
  "openclaw": "running",
  "vps": "online",
  "gateway": "active",
  "gateway_version": "1.0.0",
  "uptime": 1234,
  "agent_count": 4,
  "context_count": 3,
  "cron_count": 2,
  "memory_usage": {
    "rss": 12345678,
    "heap_total": 23456789,
    "heap_used": 34567890
  },
  "last_updated": "2026-02-14T00:00:00.000Z"
}

Reports response:
{
  "reports": [
    { "file": "2026-02-14-report.md", "updated_at": "2026-02-14T00:00:00.000Z", "size": 1024 }
  ],
  "total_reports": 1,
  "latest": {
    "file": "2026-02-14-report.md",
    "content": "...",
    "updated_at": "2026-02-14T00:00:00.000Z",
    "size": 1024
  },
  "last_updated": "2026-02-14T00:00:00.000Z"
}

Contexts response:
{
  "contexts": {
    "system": [
      { "id": "system:architecture", "name": "architecture", "type": "system", "source": "repo", "content": "...", "updated_at": "2026-02-14T00:00:00.000Z" }
    ],
    "agents": [],
    "runtime": []
  },
  "total_contexts": 1,
  "last_updated": "2026-02-14T00:00:00.000Z"
}
