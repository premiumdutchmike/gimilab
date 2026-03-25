import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, creditLedger, bookings, teeTimeSlots, courses } from '@/lib/db/schema'
import { eq, and, sql, sum, count, desc } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import CreditsSummary from '@/emails/credits-summary'
import { getCreditBalance } from '@/lib/credits/ledger'
import { TIER_CREDITS } from '@/lib/stripe/client'

export const runtime = 'nodejs'

// Runs bi-weekly (1st and 15th of month)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const activeUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        tier: users.subscriptionTier,
      })
      .from(users)
      .where(eq(users.subscriptionStatus, 'active'))

    let sent = 0

    for (const user of activeUsers) {
      if (!user.email || !user.tier) continue

      const balance = await getCreditBalance(user.id)
      const creditsGranted = TIER_CREDITS[user.tier as keyof typeof TIER_CREDITS] ?? 100

      // Calculate credits used this cycle (negative BOOKING_DEBIT entries in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [usageResult] = await db
        .select({ total: sum(creditLedger.amount) })
        .from(creditLedger)
        .where(
          and(
            eq(creditLedger.userId, user.id),
            eq(creditLedger.type, 'BOOKING_DEBIT'),
            sql`${creditLedger.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
          )
        )

      const creditsUsed = Math.abs(Number(usageResult?.total ?? 0))

      // Count rounds played this cycle
      const [roundsResult] = await db
        .select({ count: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, user.id),
            sql`${bookings.status} IN ('CONFIRMED', 'COMPLETED')`,
            sql`${bookings.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
          )
        )

      const roundsPlayed = Number(roundsResult?.count ?? 0)

      // Find most-played course
      let topCourse: string | undefined
      const [topCourseResult] = await db
        .select({
          courseName: courses.name,
          bookingCount: count(),
        })
        .from(bookings)
        .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
        .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
        .where(
          and(
            eq(bookings.userId, user.id),
            sql`${bookings.status} IN ('CONFIRMED', 'COMPLETED')`,
            sql`${bookings.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
          )
        )
        .groupBy(courses.name)
        .orderBy(desc(count()))
        .limit(1)

      if (topCourseResult?.courseName) {
        topCourse = topCourseResult.courseName
      }

      // Approximate next refresh date (~15 days from now for bi-weekly)
      const nextRefresh = new Date()
      nextRefresh.setDate(nextRefresh.getDate() + 15)
      const nextRefreshDate = nextRefresh.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric',
      })

      const tierLabel = user.tier.charAt(0).toUpperCase() + user.tier.slice(1)

      await sendEmail({
        to: user.email,
        subject: `You have ${balance} credits — your bi-weekly update`,
        react: CreditsSummary({
          memberName: user.fullName ?? user.email,
          currentBalance: balance,
          tier: tierLabel,
          creditsUsedThisCycle: creditsUsed,
          creditsGrantedThisCycle: creditsGranted,
          roundsPlayed,
          nextRefreshDate,
          topCourse,
        }),
      })
      sent++
    }

    return NextResponse.json({ sent, total: activeUsers.length })
  } catch (err) {
    console.error('[cron/send-credit-summaries] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
