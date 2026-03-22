import { cache } from 'react'
import { db } from '@/lib/db'
import { users, partners, courses, bookings, creditLedger, payoutTransfers } from '@/lib/db/schema'
import { eq, desc, sql, and, isNull, or, gt, inArray } from 'drizzle-orm'

export const getAdminStats = cache(async function getAdminStats() {
  const [memberCount, pendingCourseCount, activeSubCount, totalRevenueCents] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(users)
      .then(r => Number(r[0]?.count ?? 0)),

    db.select({ count: sql<number>`COUNT(*)` }).from(courses)
      .where(eq(courses.status, 'pending'))
      .then(r => Number(r[0]?.count ?? 0)),

    db.select({ count: sql<number>`COUNT(*)` }).from(users)
      .where(eq(users.subscriptionStatus, 'active'))
      .then(r => Number(r[0]?.count ?? 0)),

    db.select({ total: sql<number>`COALESCE(SUM(payout_amount_cents), 0)` }).from(bookings)
      .where(eq(bookings.payoutStatus, 'PROCESSED'))
      .then(r => Number(r[0]?.total ?? 0)),
  ])

  return { memberCount, pendingCourseCount, activeSubCount, totalRevenueCents }
})

export const getAdminMembers = cache(async function getAdminMembers(limit = 100) {
  return db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
})

export const getPendingCourses = cache(async function getPendingCourses() {
  return db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      address: courses.address,
      holes: courses.holes,
      baseCreditCost: courses.baseCreditCost,
      courseStatus: courses.status,
      createdAt: courses.createdAt,
      businessName: partners.businessName,
      partnerStatus: partners.status,
      partnerId: partners.id,
    })
    .from(courses)
    .innerJoin(partners, eq(courses.partnerId, partners.id))
    .where(eq(courses.status, 'pending'))
    .orderBy(desc(courses.createdAt))
})

export const getAdminMembersWithCredits = cache(async function getAdminMembersWithCredits(limit = 100) {
  return db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      subscriptionTier: users.subscriptionTier,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
      balance: sql<number>`COALESCE(SUM(CASE WHEN (${creditLedger.expiresAt} IS NULL OR ${creditLedger.expiresAt} > NOW()) THEN ${creditLedger.amount} ELSE 0 END), 0)`,
    })
    .from(users)
    .leftJoin(creditLedger, eq(creditLedger.userId, users.id))
    .groupBy(users.id, users.email, users.fullName, users.subscriptionTier, users.subscriptionStatus, users.createdAt)
    .orderBy(desc(users.createdAt))
    .limit(limit)
})

export const getAdminRevenueStats = cache(async function getAdminRevenueStats() {
  const COMPLETED_STATUSES = ['CONFIRMED', 'COMPLETED'] as const

  const [allTimeRows, monthly] = await Promise.all([
    db.select({
      totalBookings: sql<number>`COUNT(*)`,
      totalCreditsUsed: sql<number>`COALESCE(SUM(${bookings.creditCost}), 0)`,
      totalPayoutCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`,
      grossCents: sql<number>`COALESCE(SUM(${bookings.creditCost} * 100), 0)`,
    })
      .from(bookings)
      .where(inArray(bookings.status, [...COMPLETED_STATUSES])),

    db.select({
      month: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`,
      bookingCount: sql<number>`COUNT(*)`,
      creditsUsed: sql<number>`COALESCE(SUM(${bookings.creditCost}), 0)`,
      payoutCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`,
      grossCents: sql<number>`COALESCE(SUM(${bookings.creditCost} * 100), 0)`,
    })
      .from(bookings)
      .where(and(
        inArray(bookings.status, [...COMPLETED_STATUSES]),
        sql`${bookings.createdAt} >= NOW() - INTERVAL '12 months'`,
      ))
      .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM') DESC`),
  ])

  const allTime = allTimeRows[0]
  return {
    allTime: {
      totalBookings: Number(allTime?.totalBookings ?? 0),
      totalCreditsUsed: Number(allTime?.totalCreditsUsed ?? 0),
      totalPayoutCents: Number(allTime?.totalPayoutCents ?? 0),
      grossCents: Number(allTime?.grossCents ?? 0),
      revenueCents: Number(allTime?.grossCents ?? 0) - Number(allTime?.totalPayoutCents ?? 0),
    },
    monthly: monthly.map(r => ({
      month: r.month,
      bookingCount: Number(r.bookingCount),
      creditsUsed: Number(r.creditsUsed),
      payoutCents: Number(r.payoutCents),
      grossCents: Number(r.grossCents),
      revenueCents: Number(r.grossCents) - Number(r.payoutCents),
    })),
  }
})

export const getAdminPayoutsData = cache(async function getAdminPayoutsData() {
  const [pendingByPartner, recentTransfers] = await Promise.all([
    db.select({
      partnerId: partners.id,
      businessName: partners.businessName,
      stripeConnectId: partners.stripeConnectId,
      stripeConnectStatus: partners.stripeConnectStatus,
      pendingCount: sql<number>`COUNT(${bookings.id})`,
      pendingCents: sql<number>`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`,
    })
      .from(partners)
      .innerJoin(courses, eq(courses.partnerId, partners.id))
      .leftJoin(bookings, and(
        eq(bookings.courseId, courses.id),
        eq(bookings.payoutStatus, 'PENDING'),
        inArray(bookings.status, ['CONFIRMED', 'COMPLETED']),
      ))
      .where(eq(partners.status, 'approved'))
      .groupBy(
        partners.id, partners.businessName,
        partners.stripeConnectId, partners.stripeConnectStatus,
      )
      .orderBy(desc(sql`COALESCE(SUM(${bookings.payoutAmountCents}), 0)`)),

    db.select({
      id: payoutTransfers.id,
      partnerId: payoutTransfers.partnerId,
      businessName: partners.businessName,
      amountCents: payoutTransfers.amountCents,
      bookingCount: payoutTransfers.bookingCount,
      status: payoutTransfers.status,
      stripeTransferId: payoutTransfers.stripeTransferId,
      failedReason: payoutTransfers.failedReason,
      completedAt: payoutTransfers.completedAt,
      createdAt: payoutTransfers.createdAt,
    })
      .from(payoutTransfers)
      .innerJoin(partners, eq(payoutTransfers.partnerId, partners.id))
      .orderBy(desc(payoutTransfers.createdAt))
      .limit(50),
  ])

  return { pendingByPartner, recentTransfers }
})

export const getAllCourses = cache(async function getAllCourses() {
  return db
    .select({
      courseId: courses.id,
      courseName: courses.name,
      address: courses.address,
      holes: courses.holes,
      baseCreditCost: courses.baseCreditCost,
      courseStatus: courses.status,
      createdAt: courses.createdAt,
      payoutRate: courses.payoutRate,
      businessName: partners.businessName,
      partnerId: partners.id,
    })
    .from(courses)
    .innerJoin(partners, eq(courses.partnerId, partners.id))
    .orderBy(desc(courses.createdAt))
})
