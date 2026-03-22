import { cache } from 'react'
import { db } from '@/lib/db'
import { partners, courses, teeTimeBlocks, teeTimeSlots, bookings, users, payoutTransfers } from '@/lib/db/schema'
import { eq, desc, asc, and, gte, lt, or, inArray, sum, count, isNull, sql } from 'drizzle-orm'

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

export const getPartnerBookings = cache(async function getPartnerBookings(
  courseId: string,
  filter: 'upcoming' | 'past' = 'upcoming',
) {
  const today = new Date().toISOString().split('T')[0]

  const conditions = [eq(bookings.courseId, courseId)]

  if (filter === 'upcoming') {
    conditions.push(gte(teeTimeSlots.date, today))
    conditions.push(eq(bookings.status, 'CONFIRMED'))
  } else {
    conditions.push(
      or(
        lt(teeTimeSlots.date, today),
        inArray(bookings.status, ['COMPLETED', 'CANCELLED', 'NO_SHOW']),
      )!
    )
  }

  const rows = await db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      creditCost: bookings.creditCost,
      payoutStatus: bookings.payoutStatus,
      createdAt: bookings.createdAt,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      memberName: users.fullName,
      memberEmail: users.email,
    })
    .from(bookings)
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(...conditions))
    .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))

  return rows
})

export const getPartnerPayoutSummary = cache(async function getPartnerPayoutSummary(partnerId: string) {
  const course = await getPartnerCourse(partnerId)
  if (!course) return { pendingCents: 0, pendingCount: 0, totalPaidCents: 0 }

  const [pending] = await db
    .select({ total: sum(bookings.payoutAmountCents), cnt: count() })
    .from(bookings)
    .where(and(eq(bookings.courseId, course.id), eq(bookings.payoutStatus, 'PENDING')))

  const [paid] = await db
    .select({ total: sum(bookings.payoutAmountCents) })
    .from(bookings)
    .where(and(eq(bookings.courseId, course.id), eq(bookings.payoutStatus, 'PROCESSED')))

  return {
    pendingCents: Number(pending?.total ?? 0),
    pendingCount: Number(pending?.cnt ?? 0),
    totalPaidCents: Number(paid?.total ?? 0),
  }
})

export const getPartnerPayoutTransfers = cache(async function getPartnerPayoutTransfers(partnerId: string) {
  return db
    .select()
    .from(payoutTransfers)
    .where(eq(payoutTransfers.partnerId, partnerId))
    .orderBy(desc(payoutTransfers.createdAt))
})

export const getPartnerAnalytics = cache(async function getPartnerAnalytics(partnerId: string) {
  const course = await getPartnerCourse(partnerId)
  if (!course) return { monthly: [], totals: { bookingCount: 0, totalCredits: 0, revenueCents: 0 } }

  const [monthly, totalsRows] = await Promise.all([
    db
      .select({
        month: sql<string>`TO_CHAR(${bookings.createdAt}, 'Mon YYYY')`,
        monthKey: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`,
        bookingCount: sql<number>`COUNT(*)`,
        totalCredits: sql<number>`COALESCE(SUM(${bookings.creditCost}), 0)`,
        revenueCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`,
      })
      .from(bookings)
      .where(eq(bookings.courseId, course.id))
      .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'Mon YYYY')`, sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM') DESC`)
      .limit(12),

    db
      .select({
        bookingCount: sql<number>`COUNT(*)`,
        totalCredits: sql<number>`COALESCE(SUM(${bookings.creditCost}), 0)`,
        revenueCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`,
      })
      .from(bookings)
      .where(eq(bookings.courseId, course.id)),
  ])

  return { monthly, totals: totalsRows[0] ?? { bookingCount: 0, totalCredits: 0, revenueCents: 0 } }
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
