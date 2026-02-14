import { Pool } from "pg";

let pool = null;

const buildPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  const host = process.env.PGHOST;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  if (!host || !user || !database) return null;
  return {
    host,
    user,
    password,
    database,
    port: Number(process.env.PGPORT || 5432)
  };
};

const getPool = () => {
  if (pool) return pool;
  const config = buildPoolConfig();
  if (!config) return null;
  pool = new Pool(config);
  return pool;
};

const asNumber = (value) => Number(value ?? 0) || 0;

export const fetchLlmMetricsFromDb = async () => {
  const targetPool = getPool();
  if (!targetPool) return null;
  const client = await targetPool.connect();
  try {
    const todayResult = await client.query(
      "SELECT COALESCE(SUM(cost_usd), 0)::numeric AS total_cost, COALESCE(SUM(total_tokens), 0)::int AS total_tokens, COUNT(*)::int AS total_requests FROM llm_telemetry WHERE created_at >= date_trunc('day', NOW())"
    );
    const monthResult = await client.query(
      "SELECT COALESCE(SUM(cost_usd), 0)::numeric AS total_cost FROM llm_telemetry WHERE created_at >= date_trunc('month', NOW())"
    );
    const byModel = await client.query(
      "SELECT model, COALESCE(SUM(total_tokens), 0)::int AS tokens, COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd FROM llm_telemetry WHERE created_at >= date_trunc('day', NOW()) GROUP BY model ORDER BY tokens DESC"
    );
    const byAgent = await client.query(
      "SELECT COALESCE(agent, 'unknown') AS agent, COALESCE(SUM(total_tokens), 0)::int AS tokens, COALESCE(SUM(cost_usd), 0)::numeric AS cost_usd FROM llm_telemetry WHERE created_at >= date_trunc('day', NOW()) GROUP BY COALESCE(agent, 'unknown') ORDER BY tokens DESC"
    );
    const recent = await client.query(
      "SELECT model, COALESCE(agent, 'unknown') AS agent, total_tokens AS tokens, cost_usd, endpoint, created_at FROM llm_telemetry ORDER BY created_at DESC LIMIT 20"
    );
    const mostUsedModel = byModel.rows[0]?.model ?? null;

    return {
      total_cost_today: asNumber(todayResult.rows[0]?.total_cost),
      total_cost_month: asNumber(monthResult.rows[0]?.total_cost),
      total_tokens_today: asNumber(todayResult.rows[0]?.total_tokens),
      total_requests_today: asNumber(todayResult.rows[0]?.total_requests),
      most_used_model: mostUsedModel,
      usage_by_model: byModel.rows.map((row) => ({
        model: row.model,
        tokens: asNumber(row.tokens),
        cost_usd: asNumber(row.cost_usd)
      })),
      usage_by_agent: byAgent.rows.map((row) => ({
        agent: row.agent,
        tokens: asNumber(row.tokens),
        cost_usd: asNumber(row.cost_usd)
      })),
      recent_operations: recent.rows.map((row) => ({
        model: row.model,
        agent: row.agent,
        tokens: asNumber(row.tokens),
        cost_usd: asNumber(row.cost_usd),
        endpoint: row.endpoint,
        created_at: row.created_at
      }))
    };
  } catch (error) {
    return null;
  } finally {
    client.release();
  }
};
