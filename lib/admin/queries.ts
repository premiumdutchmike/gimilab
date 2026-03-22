import { cache } from 'react'
import { db } from '@/lib/db'
import { users, partners, courses, bookings, creditLedger } from '@/lib/db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'

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
      businessName: partners.businessName,
      partnerId: partners.id,
    })
    .from(courses)
    .innerJoin(partners, eq(courses.partnerId, partners.id))
    .orderBy(desc(courses.createdAt))
})
