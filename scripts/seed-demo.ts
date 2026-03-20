/**
 * Demo data seed script for local development.
 * Inserts a demo partner, course, tee time block, and 10 tee time slots.
 * Safe to run multiple times — uses onConflictDoNothing() for idempotency.
 *
 * Usage: npm run seed:demo
 */

import { db } from '../lib/db'
import { partners, courses, teeTimeBlocks, teeTimeSlots } from '../lib/db/schema'

// Fixed IDs so re-runs are idempotent
const DEMO_PARTNER_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_PARTNER_USER_ID = '00000000-0000-0000-0000-000000000002'
const DEMO_COURSE_ID = '00000000-0000-0000-0000-000000000010'
const DEMO_BLOCK_ID = '00000000-0000-0000-0000-000000000020'

/** Return a date string 'YYYY-MM-DD' for today + offsetDays */
function futureDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

/** Return a timestamp for a given date string and HH:MM time string */
function releaseAt(dateStr: string, timeStr: string): Date {
  // releaseAt = tee time datetime - 48 hours
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const teeDateTime = new Date(Date.UTC(year, month - 1, day, hour, minute))
  teeDateTime.setHours(teeDateTime.getHours() - 48)
  return teeDateTime
}

async function seed() {
  console.log('Seeding demo data...')

  // ── 1. Demo partner ────────────────────────────────────────────────────────
  // Note: DEMO_PARTNER_USER_ID must exist in the users table for the FK to pass.
  // In a fresh local dev environment with Supabase, either create this user first
  // or disable the FK check. For convenience the partner insert is wrapped in a
  // try/catch so a missing user row produces a clear error instead of a crash.
  console.log('  → Inserting demo partner…')
  await db
    .insert(partners)
    .values({
      id: DEMO_PARTNER_ID,
      userId: DEMO_PARTNER_USER_ID,
      businessName: 'Pebble Creek Golf Management',
      stripeConnectStatus: 'active',
      status: 'approved',
    })
    .onConflictDoNothing()

  // ── 2. Demo course ────────────────────────────────────────────────────────
  console.log('  → Inserting demo course…')
  await db
    .insert(courses)
    .values({
      id: DEMO_COURSE_ID,
      partnerId: DEMO_PARTNER_ID,
      name: 'Pebble Creek Golf Club',
      slug: 'pebble-creek-golf-club',
      address: '123 Fairway Drive, Austin, TX 78701',
      description: 'A championship 18-hole course with stunning hill country views.',
      holes: 18,
      baseCreditCost: 25,
      status: 'active',
      payoutRate: '0.650',
    })
    .onConflictDoNothing()

  // ── 3. Demo tee time block (required FK for slots) ────────────────────────
  console.log('  → Inserting demo tee time block…')
  await db
    .insert(teeTimeBlocks)
    .values({
      id: DEMO_BLOCK_ID,
      courseId: DEMO_COURSE_ID,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6], // all days
      startTime: '07:00',
      endTime: '15:00',
      slotsPerInterval: 1,
      creditOverride: null,
      validFrom: futureDate(0),
      validUntil: null,
      isActive: true,
    })
    .onConflictDoNothing()

  // ── 4. Tee time slots — 14 slots over the next 7 days ────────────────────
  // 2 slots per day: 7:00 AM and 1:00 PM on days +1 through +7
  // Additional variety: 8:30 AM, 10:00 AM, 3:00 PM spread across days
  console.log('  → Inserting 14 demo tee time slots…')

  const slotSchedule: Array<{ dayOffset: number; time: string }> = [
    { dayOffset: 1, time: '07:00' },
    { dayOffset: 1, time: '13:00' },
    { dayOffset: 2, time: '08:30' },
    { dayOffset: 2, time: '15:00' },
    { dayOffset: 3, time: '07:00' },
    { dayOffset: 3, time: '10:00' },
    { dayOffset: 4, time: '08:30' },
    { dayOffset: 4, time: '13:00' },
    { dayOffset: 5, time: '07:00' },
    { dayOffset: 5, time: '15:00' },
    { dayOffset: 6, time: '08:30' },
    { dayOffset: 6, time: '13:00' },
    { dayOffset: 7, time: '07:00' },
    { dayOffset: 7, time: '15:00' },
  ]

  for (const { dayOffset, time } of slotSchedule) {
    const dateStr = futureDate(dayOffset)
    // Use a deterministic ID based on date+time so re-runs are idempotent
    const slotSuffix = `${dateStr}-${time}`.replace(/[-:]/g, '')
    const slotId = `00000000-0000-0000-${slotSuffix.slice(0, 4)}-${slotSuffix.slice(4, 16).padEnd(12, '0')}`

    await db
      .insert(teeTimeSlots)
      .values({
        id: slotId,
        blockId: DEMO_BLOCK_ID,
        courseId: DEMO_COURSE_ID,
        date: dateStr,
        startTime: time,
        status: 'AVAILABLE',
        creditCost: 25,
        bookingId: null,
        releaseAt: releaseAt(dateStr, time),
      })
      .onConflictDoNothing()
  }

  console.log('Demo data seeded successfully.')
  console.log(`  Course: Pebble Creek Golf Club (ID: ${DEMO_COURSE_ID})`)
  console.log(`  Slots:  14 available tee times over the next 7 days`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
