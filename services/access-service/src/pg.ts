import { Pool } from "pg";

import type { PostgresConfig } from "./config.ts";

const POSTGRES_READINESS_TIMEOUT_MILLISECONDS = 1_000;

interface PostgresAdapter {
  checkReadiness(): Promise<void>;
  close(): Promise<void>;
}

export function createPostgresAdapter({
  connectionString,
}: PostgresConfig): PostgresAdapter {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: POSTGRES_READINESS_TIMEOUT_MILLISECONDS,
    query_timeout: POSTGRES_READINESS_TIMEOUT_MILLISECONDS,
    statement_timeout: POSTGRES_READINESS_TIMEOUT_MILLISECONDS,
  });

  const checkReadiness = async (): Promise<void> => {
    await pool.query("SELECT 1");
  };

  const close = async (): Promise<void> => {
    await pool.end();
  };

  return { checkReadiness, close };
}
