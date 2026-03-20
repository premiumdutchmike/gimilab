import { cache } from 'react'
import { db } from '@/lib/db'
import { partners, courses, teeTimeBlocks, teeTimeSlots } from '@/lib/db/schema'
import { eq, desc, asc, and, gte, lt } from 'drizzle-orm'

export const getPartnerByUserId = cache(async function getPartnerByUserId(userId: string) {
  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, userId))
    .limit(1)
  return rows[0] ?? null
})

export const getPartnerCourse = cache(async function getPartnerCourse(partnerId: string) {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.partnerId, partnerId))
    .limit(1)
  return rows[0] ?? null
})

export const getPartnerBlocks = cache(async function getPartnerBlocks(partnerId: string) {
  const rows = await db
    .select({ block: teeTimeBlocks })
    .from(teeTimeBlocks)
    .innerJoin(courses, eq(teeTimeBlocks.courseId, courses.id))
    .where(eq(courses.partnerId, partnerId))
    .orderBy(desc(teeTimeBlocks.createdAt))
  return rows.map((r) => r.block)
})

export const getUpcomingSlots = cache(async function getUpcomingSlots(courseId: string, days = 14) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const until = new Date(today)
  until.setDate(until.getDate() + days)

  return await db
    .select({
      id: teeTimeSlots.id,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      creditCost: teeTimeSlots.creditCost,
      status: teeTimeSlots.status,
    })
    .from(teeTimeSlots)
    .where(
      and(
        eq(teeTimeSlots.courseId, courseId),
        gte(teeTimeSlots.date, today.toISOString().split('T')[0]),
        lt(teeTimeSlots.date, until.toISOString().split('T')[0])
      )
    )
    .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))
})
