import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function makeClient() {
  const isProd = process.env.NODE_ENV === 'production'
  const connStr = process.env.SUPABASE_DATABASE_URL!

  if (isProd) {
    // URL-decode password and user explicitly — postgres.js does not decode
    // percent-encoded chars (e.g. %21→! %24→$) when parsing the URL string.
    const url = new URL(connStr)
    return postgres({
      host: url.hostname,
      port: Number(url.port) || 5432,
      user: decodeURIComponent(url.username),
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
