import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Singleton pool — reused across hot-reload in dev
const globalForDb = globalThis as unknown as { pool: Pool | undefined }

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    max: process.env.NODE_ENV === 'production' ? 2 : 10,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
