import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.SUPABASE_DATABASE_URL!

// For serverless: use transaction pooler URL (port 6543) in production
// postgres.js handles SSL and connection lifecycle correctly for Vercel
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  prepare: false, // required for transaction pooler (PgBouncer)
})

export const db = drizzle(client, { schema })

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
