import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.SUPABASE_DATABASE_URL!)
const db = drizzle(client)

async function main() {
  const rows = await db.execute(/*sql*/`SELECT name, photos, status FROM courses ORDER BY name`)
  for (const r of rows) console.log(r.name, '|', r.photos, '|', r.status)
  await client.end()
}
main()
