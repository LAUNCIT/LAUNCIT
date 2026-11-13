import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    global._postgresPool.on('error', (err: any) => {
      // In node-postgres, idle clients in the pool can be disconnected by the server or proxy.
      // The pool automatically evicts the disconnected client and creates a new one when needed.
      // Log routine idle connection terminations as a notice rather than console.error to avoid flagging as fatal errors.
      const isIdleDisconnect =
        err?.message?.includes('Connection terminated unexpectedly') ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('socket closed') ||
        err?.code === '57P01';

      if (isIdleDisconnect) {
        console.warn('Notice: Idle PostgreSQL connection closed by remote peer and evicted from pool.');
      } else {
        console.error('Unexpected error on SQL pool client:', err);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
