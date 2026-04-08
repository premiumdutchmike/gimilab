import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { partners, courses, bookings, payoutTransfers } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { stripe } from '@/lib/stripe/client'

export const runtime = 'nodejs'

// Runs weekly (e.g. every Monday at 6am UTC): 0 6 * * 1
// Processes pending payouts for all active partners with connected Stripe
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all partners with active Stripe Connect
    const activePartners = await db
      .select({
        id: partners.id,
        stripeConnectId: partners.stripeConnectId,
        businessName: partners.businessName,
      })
      .from(partners)
      .where(
        and(
          eq(partners.onboardingComplete, true),
          eq(partners.stripeConnectStatus, 'active'),
        )
      )

    let processed = 0
    let skipped = 0
    const errors: string[] = []

    for (const partner of activePartners) {
      if (!partner.stripeConnectId) { skipped++; continue }

      // Find pending bookings for this partner's courses
      const pendingBookings = await db
        .select({ id: bookings.id, payoutAmountCents: bookings.payoutAmountCents })
        .from(bookings)
        .innerJoin(courses, eq(bookings.courseId, courses.id))
        .where(and(eq(courses.partnerId, partner.id), eq(bookings.payoutStatus, 'PENDING')))

      if (pendingBookings.length === 0) { skipped++; continue }

      const totalCents = pendingBookings.reduce((sum, b) => sum + (b.payoutAmountCents ?? 0), 0)
      if (totalCents < 100) { skipped++; continue } // Below $1 minimum

      // Create transfer record
      const [transfer] = await db
        .insert(payoutTransfers)
        .values({
          partnerId: partner.id,
          amountCents: totalCents,
          bookingCount: pendingBookings.length,
          status: 'PENDING',
        })
        .returning()

      // Execute Stripe transfer
      try {
        const stripeTransfer = await stripe.transfers.create({
          amount: totalCents,
          currency: 'usd',
          destination: partner.stripeConnectId,
          metadata: { payoutTransferId: transfer.id, partnerId: partner.id },
        })

        // Mark completed
        const bookingIds = pendingBookings.map(b => b.id)
        await db
          .update(payoutTransfers)
          .set({ status: 'COMPLETED', stripeTransferId: stripeTransfer.id, completedAt: new Date() })
          .where(eq(payoutTransfers.id, transfer.id))

        await db
          .update(bookings)
          .set({ payoutStatus: 'PROCESSED', payoutTransferId: transfer.id, updatedAt: new Date() })
          .where(inArray(bookings.id, bookingIds))

        processed++
      } catch (stripeErr) {
        await db
          .update(payoutTransfers)
          .set({ status: 'FAILED', failedReason: stripeErr instanceof Error ? stripeErr.message : 'Stripe error' })
          .where(eq(payoutTransfers.id, transfer.id))

        errors.push(`${partner.businessName}: ${stripeErr instanceof Error ? stripeErr.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({ processed, skipped, errors, total: activePartners.length })
  } catch (err) {
    console.error('[cron/process-payouts] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
