import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { partners, courses, bookings, teeTimeSlots, users } from '@/lib/db/schema'
import { eq, and, gte, lt, sql, sum, count } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import PartnerPayoutSummary from '@/emails/partner-payout-summary'

export const runtime = 'nodejs'

// Runs on the 1st of each month — sends previous month's payout summary
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Calculate previous month range
    const now = new Date()
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1) // 1st of prev month

    const periodStartStr = periodStart.toISOString().split('T')[0]
    const periodEndStr = new Date(periodEnd.getTime() + 86400000).toISOString().split('T')[0] // day after end

    const periodStartLabel = periodStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    const periodEndLabel = periodEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    // Get all active partners
    const allPartners = await db
      .select({
        partnerId: partners.id,
        userId: partners.userId,
        businessName: partners.businessName,
        stripeConnectAccountId: partners.stripeConnectAccountId,
      })
      .from(partners)
      .where(eq(partners.onboardingComplete, true))

    let sent = 0

    for (const partner of allPartners) {
      // Get partner's course
      const course = await db.query.courses.findFirst({
        where: eq(courses.partnerId, partner.partnerId),
      })
      if (!course) continue

      // Get partner's email
      const [partnerUser] = await db.select().from(users).where(eq(users.id, partner.userId))
      if (!partnerUser?.email) continue

      // Aggregate bookings for previous month
      const [stats] = await db
        .select({
          totalBookings: count(),
          totalCredits: sum(bookings.creditCost),
          totalEarnings: sum(bookings.partnerEarningsCents),
        })
        .from(bookings)
        .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
        .where(
          and(
            eq(teeTimeSlots.courseId, course.id),
            eq(bookings.status, 'COMPLETED'),
            gte(teeTimeSlots.date, periodStartStr),
            lt(teeTimeSlots.date, periodEndStr),
          )
        )

      const totalBookings = Number(stats?.totalBookings ?? 0)
      if (totalBookings === 0) continue // No bookings last month — skip

      const totalCredits = Number(stats?.totalCredits ?? 0)
      const totalRevenueCents = totalCredits * 100 // 1 credit = $1
      const payoutRate = parseFloat(course.payoutRate ?? '0.85')
      const commissionRate = Math.round((1 - payoutRate) * 100)
      const earningsCents = Math.round(totalRevenueCents * payoutRate)
      const commissionCents = totalRevenueCents - earningsCents

      const payoutDate = new Date(now.getFullYear(), now.getMonth(), 15)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

      await sendEmail({
        to: partnerUser.email,
        subject: `Your ${periodStartLabel} – ${periodEndLabel} payout: $${(earningsCents / 100).toFixed(2)}`,
        react: PartnerPayoutSummary({
          partnerName: partner.businessName ?? '',
          courseName: course.name ?? '',
          periodStart: periodStartLabel,
          periodEnd: periodEndLabel,
          totalBookings,
          totalRevenue: `$${(totalRevenueCents / 100).toFixed(2)}`,
          commissionRate: `${commissionRate}%`,
          commissionAmount: `$${(commissionCents / 100).toFixed(2)}`,
          payoutAmount: `$${(earningsCents / 100).toFixed(2)}`,
          payoutDate,
          stripeConnected: !!partner.stripeConnectAccountId,
        }),
      })
      sent++
    }

    return NextResponse.json({ sent, total: allPartners.length })
  } catch (err) {
    console.error('[cron/send-payout-summaries] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
