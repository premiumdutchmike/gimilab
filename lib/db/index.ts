import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// In production, use explicit params to avoid URL-encoding issues with special chars in password.
// SUPABASE_DB_PASSWORD is the decoded (plain text) password stored as a separate env var.
function makeClient() {
  const isProd = process.env.NODE_ENV === 'production'
  const connStr = process.env.SUPABASE_DATABASE_URL!

  if (isProd && process.env.SUPABASE_DB_PASSWORD) {
    // Parse URL for host/user/db, use plain-text password directly
    const url = new URL(connStr)
    return postgres({
      host: url.hostname,
      port: Number(url.port) || 5432,
      user: url.username,
      password: process.env.SUPABASE_DB_PASSWORD,
      database: url.pathname.replace('/', ''),
      ssl: 'require',
      max: 1,
      prepare: false,
    })
  }

  // Local dev: use connection string as-is
  return postgres(connStr, { max: 10, ssl: false, prepare: false })
}

const client = makeClient()

export const db = drizzle(client, { schema })

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
