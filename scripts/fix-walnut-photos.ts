import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.SUPABASE_DATABASE_URL!)
const db = drizzle(client)

async function main() {
  await db.execute(/*sql*/`
    UPDATE courses
    SET photos = ARRAY['/imagery/course-3.jpeg']::text[]
    WHERE name = 'Walnut Lane Golf Club'
  `)
  console.log('✓ Fixed Walnut Lane photos to local image')
  await client.end()
}
main()
