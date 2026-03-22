import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// In production, use explicit params so special chars in the password are correctly decoded.
// decodeURIComponent handles any %-encoding in the URL (e.g. %21 → !, %40 → @).
function makeClient() {
  const isProd = process.env.NODE_ENV === 'production'
  const connStr = process.env.SUPABASE_DATABASE_URL!

  if (isProd) {
    const url = new URL(connStr)
    return postgres({
      host: url.hostname,
      port: Number(url.port) || 5432,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
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
