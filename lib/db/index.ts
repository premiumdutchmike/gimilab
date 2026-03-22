import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function makeClient() {
  const isProd = process.env.NODE_ENV === 'production'
  const connStr = process.env.SUPABASE_DATABASE_URL!

  if (isProd) {
    // Let postgres.js parse the URL natively — avoids any double-decode issues.
    return postgres(connStr, {
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
