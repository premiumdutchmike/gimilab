/**
 * Seed script: Insert 20 real Philadelphia-area golf courses
 * Run: npx tsx scripts/seed-courses.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { randomUUID } from 'crypto'
import { sql } from 'drizzle-orm'
import * as schema from '../lib/db/schema'

const client = postgres(process.env.SUPABASE_DATABASE_URL!)
const db = drizzle(client, { schema })

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'
const SYSTEM_PARTNER_ID = '00000000-0000-0000-0000-000000000002'

const photos = [
  '/imagery/course-1.jpeg',
  '/imagery/course-2.png',
  '/imagery/course-3.jpeg',
  '/imagery/course-4.png',
  '/imagery/course-5.png',
  '/imagery/course-6.jpeg',
]

const courses = [
  { name: 'Cobbs Creek Golf Course', address: '7400 Lansdowne Ave, Philadelphia, PA 19151', holes: 18, baseCreditCost: 45, rackRateCents: 7000, gimmelabRateCents: 4500, description: 'Legendary Philadelphia municipal course undergoing a $65M renovation. A.W. Tillinghast design with rich history.' },
  { name: 'Torresdale-Frankford CC', address: '8001 Torresdale Ave, Philadelphia, PA 19136', holes: 18, baseCreditCost: 55, rackRateCents: 8500, gimmelabRateCents: 5500, description: 'Classic Donald Ross-designed course along the Delaware River. Semi-private with stunning views.' },
  { name: 'Jeffersonville Golf Club', address: '2400 W Main St, Norristown, PA 19403', holes: 18, baseCreditCost: 50, rackRateCents: 7500, gimmelabRateCents: 5000, description: 'Premier public course in Montgomery County. Well-maintained fairways and fast greens.' },
  { name: 'Paxon Hollow Golf Club', address: '850 Paxon Hollow Rd, Broomall, PA 19008', holes: 18, baseCreditCost: 42, rackRateCents: 6500, gimmelabRateCents: 4200, description: 'Delaware County gem with rolling hills and mature trees. Great value for the quality of play.' },
  { name: 'RiverWinds Golf & Tennis', address: '270 Eagle Point Rd, West Deptford, NJ 08086', holes: 18, baseCreditCost: 60, rackRateCents: 9500, gimmelabRateCents: 6000, description: 'Links-style course on the Delaware River in New Jersey. Waterfront views and challenging wind.' },
  { name: 'Limekiln Golf Club', address: '1176 Limekiln Pike, Ambler, PA 19002', holes: 18, baseCreditCost: 38, rackRateCents: 5500, gimmelabRateCents: 3800, description: 'Tight, tree-lined Montgomery County course that rewards accurate shot-making. Walking friendly.' },
  { name: 'Bella Vista Golf Course', address: '2901 Fagleysville Rd, Gilbertsville, PA 19525', holes: 18, baseCreditCost: 48, rackRateCents: 7500, gimmelabRateCents: 4800, description: 'Beautiful course with elevation changes and mountain views. Worth the drive from the city.' },
  { name: 'Riverton Country Club', address: '1416 Highland Ave, Cinnaminson, NJ 08077', holes: 18, baseCreditCost: 65, rackRateCents: 10000, gimmelabRateCents: 6500, description: 'One of the oldest clubs in America, founded 1865. Classic layout along the Delaware River.' },
  { name: 'Skippack Golf Course', address: '1409 Stump Hall Rd, Skippack, PA 19474', holes: 18, baseCreditCost: 35, rackRateCents: 5000, gimmelabRateCents: 3500, description: 'Family-friendly course in the heart of Skippack Village. Great for all skill levels.' },
  { name: 'Mainland Golf Course', address: '2420 Rittenhouse Rd, Harleysville, PA 19438', holes: 18, baseCreditCost: 32, rackRateCents: 4800, gimmelabRateCents: 3200, description: 'Affordable public course with well-maintained greens. Quick rounds and friendly staff.' },
  { name: 'Spring Ford Country Club', address: '71 Country Club Rd, Royersford, PA 19468', holes: 18, baseCreditCost: 52, rackRateCents: 8000, gimmelabRateCents: 5200, description: 'Semi-private club with challenging layout and excellent conditioning. Great practice facility.' },
  { name: 'Bensalem Township CC', address: '2000 Brown Ave, Bensalem, PA 19020', holes: 18, baseCreditCost: 36, rackRateCents: 5500, gimmelabRateCents: 3600, description: 'Bucks County public course with tight fairways and well-bunkered greens. Affordable rates.' },
  { name: 'Williamstown Golf Club', address: '3894 S Black Horse Pike, Williamstown, NJ 08094', holes: 18, baseCreditCost: 40, rackRateCents: 6000, gimmelabRateCents: 4000, description: 'Flat, links-style course in South Jersey. Wide fairways and large greens.' },
  { name: 'Turtle Creek Golf Course', address: '303 W Ridge Pike, Limerick, PA 19468', holes: 18, baseCreditCost: 30, rackRateCents: 4200, gimmelabRateCents: 3000, description: 'Executive course perfect for a quick weekday round. Well-maintained and walking-friendly.' },
  { name: 'Makefield Highlands GC', address: '1418 Woodside Rd, Yardley, PA 19067', holes: 18, baseCreditCost: 58, rackRateCents: 8500, gimmelabRateCents: 5800, description: 'Links-style Bucks County course with panoramic views. Host to numerous tournaments.' },
  { name: 'Ramblewood Country Club', address: '200 Country Club Pkwy, Mount Laurel, NJ 08054', holes: 27, baseCreditCost: 55, rackRateCents: 8500, gimmelabRateCents: 5500, description: '27-hole facility with three distinct nines. Excellent conditioning and varied layouts.' },
  { name: 'Downingtown Country Club', address: '85 Country Club Dr, Downingtown, PA 19335', holes: 18, baseCreditCost: 50, rackRateCents: 7800, gimmelabRateCents: 5000, description: 'Chester County classic with rolling terrain and scenic Brandywine Creek views.' },
  { name: 'Scotland Run Golf Club', address: '2626 Fries Mill Rd, Williamstown, NJ 08094', holes: 18, baseCreditCost: 65, rackRateCents: 9500, gimmelabRateCents: 6500, description: 'Award-winning Stephen Kay design cut through pine forests. Ranked top public course in NJ.' },
  { name: 'Middletown Country Club', address: '420 N Bellevue Ave, Langhorne, PA 19047', holes: 18, baseCreditCost: 42, rackRateCents: 6500, gimmelabRateCents: 4200, description: 'Bucks County hidden gem with tight doglegs and elevated greens. Great twilight rates.' },
  { name: 'Woodcrest Country Club', address: '300 E Evesham Rd, Cherry Hill, NJ 08003', holes: 18, baseCreditCost: 70, rackRateCents: 11000, gimmelabRateCents: 7000, description: 'Premier South Jersey private club offering Gimmelab members exclusive weekday access.' },
]

async function seed() {
  console.log('🏌️ Seeding 20 Philadelphia-area golf courses...\n')

  // Create system user + partner if not exists
  await db.execute(sql`
    INSERT INTO users (id, email, full_name)
    VALUES (${SYSTEM_USER_ID}, 'system@gimmelab.com', 'Gimmelab System')
    ON CONFLICT (id) DO NOTHING
  `)

  await db.execute(sql`
    INSERT INTO partners (id, user_id, business_name, onboarding_complete)
    VALUES (${SYSTEM_PARTNER_ID}, ${SYSTEM_USER_ID}, 'Gimmelab Demo Courses', true)
    ON CONFLICT (id) DO NOTHING
  `)

  let inserted = 0
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i]
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const photo = photos[i % photos.length]

    try {
      await db.execute(sql`
        INSERT INTO courses (id, partner_id, name, slug, description, address, holes, base_credit_cost, rack_rate_cents, gimmelab_rate_cents, payout_rate, photos, status)
        VALUES (
          ${randomUUID()},
          ${SYSTEM_PARTNER_ID},
          ${c.name},
          ${slug},
          ${c.description},
          ${c.address},
          ${c.holes},
          ${c.baseCreditCost},
          ${c.rackRateCents},
          ${c.gimmelabRateCents},
          ${'0.85'},
          ${sql`ARRAY[${photo}]::text[]`},
          'active'
        )
        ON CONFLICT DO NOTHING
      `)
      console.log(`  ✓ ${c.name} — ${c.baseCreditCost} credits (${c.address.split(',').pop()?.trim()})`)
      inserted++
    } catch (err: any) {
      console.error(`  ✗ ${c.name}: ${err.message}`)
    }
  }

  console.log(`\n✅ Inserted ${inserted}/${courses.length} courses. Refresh localhost:3000 to see them!`)
  await client.end()
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
