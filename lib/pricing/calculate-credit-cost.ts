import type { TeeTimeSlot } from '@/lib/db/schema'

export interface PricingRules {
  globalMultiplier: number // admin-set global multiplier (1.0 = no change)
  floor: number           // min credits for this course
  ceiling: number         // max credits for this course
}

// Time-of-day multiplier table
// Peak = weekend mornings 7am–10am = 1.3×
// Off-peak = weekday afternoons = 0.8×
function getTimeMultiplier(startTime: string, date: string): number {
  const [hour] = startTime.split(':').map(Number)
  const dayOfWeek = new Date(date).getDay() // 0=Sun, 6=Sat

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isMorning = hour >= 7 && hour < 10
  const isAfternoon = hour >= 13
  const isWeekday = !isWeekend

  if (isWeekend && isMorning) return 1.3   // peak
  if (isWeekend && isAfternoon) return 1.1  // weekend afternoon — still premium
  if (isWeekday && isAfternoon) return 0.8  // off-peak
  return 1.0                                // default
}

export function calculateCreditCost(
  baseCost: number,
  slot: Pick<TeeTimeSlot, 'startTime' | 'date'>,
  demandFactor: number, // 0.0–1.0 — ratio of booked slots to total available
  rules: PricingRules
): number {
  const timeMultiplier = getTimeMultiplier(slot.startTime, slot.date)
  const demandMultiplier = demandFactor > 0.7 ? 1.15 : 1.0

  const raw = Math.round(
    baseCost * timeMultiplier * demandMultiplier * rules.globalMultiplier
  )

  return Math.min(rules.ceiling, Math.max(rules.floor, raw))
}

// Calculate demand factor for a course over the next 7 days
// Returns 0.0–1.0 where 1.0 = all slots booked
export async function getCourseDemandFactor(courseId: string): Promise<number> {
  const { db } = await import('@/lib/db')
  const { teeTimeSlots } = await import('@/lib/db/schema')
  const { eq, and, gte, lte, sql } = await import('drizzle-orm')

  const now = new Date()
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const nowDate = now.toISOString().split('T')[0]
  const futureDate = sevenDaysOut.toISOString().split('T')[0]

  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
      booked: sql<number>`COUNT(*) FILTER (WHERE ${teeTimeSlots.status} = 'BOOKED')`,
    })
    .from(teeTimeSlots)
    .where(
      and(
        eq(teeTimeSlots.courseId, courseId),
        gte(teeTimeSlots.date, nowDate),
        lte(teeTimeSlots.date, futureDate)
      )
    )

  const total = Number(result[0]?.total ?? 0)
  const booked = Number(result[0]?.booked ?? 0)

  return total > 0 ? booked / total : 0
}
