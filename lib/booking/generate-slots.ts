import { db } from '@/lib/db'
import { teeTimeBlocks, teeTimeSlots, courses } from '@/lib/db/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { calculateCreditCost } from '@/lib/pricing/calculate-credit-cost'

const SLOT_INTERVAL_MINUTES = 10

// Materializes individual tee time slots from partner-defined blocks
// for the next N days. Run by /api/cron/generate-slots at 2am UTC daily.
export async function generateSlotsForDays(days = 14): Promise<{ created: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let created = 0

  // Get all active blocks with their course payout rules
  const blocks = await db
    .select({
      block: teeTimeBlocks,
      course: {
        id: courses.id,
        baseCreditCost: courses.baseCreditCost,
        creditFloor: courses.creditFloor,
        creditCeiling: courses.creditCeiling,
      },
    })
    .from(teeTimeBlocks)
    .innerJoin(courses, eq(teeTimeBlocks.courseId, courses.id))
    .where(
      and(
        eq(teeTimeBlocks.isActive, true),
        eq(courses.status, 'active')
      )
    )

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    const dayOfWeek = date.getDay()
    const dateStr = date.toISOString().split('T')[0]

    for (const { block, course } of blocks) {
      // Check if this block applies to this day of week
      if (!block.dayOfWeek.includes(dayOfWeek)) continue

      // Check date is within block validity range
      if (block.validFrom > dateStr) continue
      if (block.validUntil && block.validUntil < dateStr) continue

      // Generate slots for each 10-minute interval in the time window
      const [startH, startM] = block.startTime.split(':').map(Number)
      const [endH, endM] = block.endTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      for (
        let minutes = startMinutes;
        minutes < endMinutes;
        minutes += SLOT_INTERVAL_MINUTES
      ) {
        const slotHour = Math.floor(minutes / 60)
        const slotMin = minutes % 60
        const startTime = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}:00`

        // releaseAt = 48 hours before slot
        const slotDateTime = new Date(`${dateStr}T${startTime}`)
        const releaseAt = new Date(slotDateTime.getTime() - 48 * 60 * 60 * 1000)

        // Calculate credit cost
        const baseCost = block.creditOverride ?? course.baseCreditCost
        const creditCost = calculateCreditCost(
          baseCost,
          { startTime, date: dateStr },
          0, // demand factor calculated fresh — slots at rest use base pricing
          {
            globalMultiplier: 1.0,
            floor: course.creditFloor ?? 10,
            ceiling: course.creditCeiling ?? 999,
          }
        )

        // Create one slot per slotsPerInterval (usually 1 group per tee time)
        for (let i = 0; i < (block.slotsPerInterval ?? 1); i++) {
          // Skip if slot already exists (idempotent)
          const existing = await db
            .select({ id: teeTimeSlots.id })
            .from(teeTimeSlots)
            .where(
              and(
                eq(teeTimeSlots.blockId, block.id),
                eq(teeTimeSlots.date, dateStr),
                eq(teeTimeSlots.startTime, startTime)
              )
            )
            .limit(1)

          if (existing.length > 0) continue

          await db.insert(teeTimeSlots).values({
            blockId: block.id,
            courseId: block.courseId,
            date: dateStr,
            startTime,
            status: 'AVAILABLE',
            creditCost,
            releaseAt,
          })

          created++
        }
      }
    }
  }

  return { created }
}
