import { Pool } from 'pg';

/**
 * One pool per process, reused across hot reloads.
 *
 * Next recreates modules on every edit in development; without this the pools
 * accumulate until Postgres refuses new connections and the app appears to
 * hang for no reason.
 */
declare global {
  var __slipPool: Pool | undefined;
}

export const pool =
  global.__slipPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ?? 'postgres://localhost:5432/slip',
    max: 5,
  });

if (process.env.NODE_ENV !== 'production') global.__slipPool = pool;

export async function query<T>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, values);
  return result.rows as T[];
}
