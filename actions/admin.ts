'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { courses, creditLedger, bookings, payoutTransfers, partners } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { stripe } from '@/lib/stripe/client'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('NOT_AUTHENTICATED')
  if (user.user_metadata?.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

export async function approveCourse(courseId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db
      .update(courses)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to approve course.' }
  }
}

export async function rejectCourse(courseId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await db
      .update(courses)
      .set({ status: 'suspended', updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to reject course.' }
  }
}

export async function processPartnerPayouts(
  partnerId: string,
): Promise<{ transferId?: string; amountCents?: number; error?: string }> {
  try {
    await requireAdmin()

    // Get partner's Stripe Connect ID
    const [partner] = await db
      .select({ stripeConnectId: partners.stripeConnectId, stripeConnectStatus: partners.stripeConnectStatus })
      .from(partners)
      .where(eq(partners.id, partnerId))

    if (!partner) return { error: 'Partner not found.' }
    if (!partner.stripeConnectId) return { error: 'Partner has not connected Stripe.' }
    if (partner.stripeConnectStatus !== 'active') return { error: 'Partner Stripe account is not active.' }

    // Find all pending bookings for this partner's course(s)
    const pendingBookings = await db
      .select({ id: bookings.id, payoutAmountCents: bookings.payoutAmountCents })
      .from(bookings)
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .where(and(eq(courses.partnerId, partnerId), eq(bookings.payoutStatus, 'PENDING')))

    if (pendingBookings.length === 0) return { error: 'No pending payouts.' }

    const totalCents = pendingBookings.reduce((sum, b) => sum + (b.payoutAmountCents ?? 0), 0)
    if (totalCents < 100) return { error: 'Total payout below $1.00 minimum.' }

    // Create the payout transfer record first (PENDING)
    const [transfer] = await db
      .insert(payoutTransfers)
      .values({
        partnerId,
        amountCents: totalCents,
        bookingCount: pendingBookings.length,
        status: 'PENDING',
      })
      .returning()

    // Trigger Stripe Transfer to connected account
    let stripeTransfer: { id: string } | null = null
    try {
      stripeTransfer = await stripe.transfers.create({
        amount: totalCents,
        currency: 'usd',
        destination: partner.stripeConnectId,
        metadata: { payoutTransferId: transfer.id, partnerId },
      })
    } catch (stripeErr) {
      // Mark transfer as failed, leave bookings as PENDING for retry
      await db
        .update(payoutTransfers)
        .set({ status: 'FAILED', failedReason: stripeErr instanceof Error ? stripeErr.message : 'Stripe error' })
        .where(eq(payoutTransfers.id, transfer.id))
      return { error: 'Stripe transfer failed. Bookings remain pending.' }
    }

    // Mark transfer completed and link bookings
    const bookingIds = pendingBookings.map((b) => b.id)
    await db
      .update(payoutTransfers)
      .set({ status: 'COMPLETED', stripeTransferId: stripeTransfer.id, completedAt: new Date() })
      .where(eq(payoutTransfers.id, transfer.id))

    await db
      .update(bookings)
      .set({ payoutStatus: 'PROCESSED', payoutTransferId: transfer.id, updatedAt: new Date() })
      .where(inArray(bookings.id, bookingIds))

    revalidatePath('/admin/payouts')
    revalidatePath('/admin/revenue')
    return { transferId: stripeTransfer.id, amountCents: totalCents }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Payout processing failed.' }
  }
}

export async function updateCoursePayoutRate(
  courseId: string,
  ratePct: number, // e.g. 70 means 70%
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    if (ratePct < 0 || ratePct > 100) return { error: 'Rate must be between 0 and 100.' }
    await db
      .update(courses)
      .set({ payoutRate: String(ratePct / 100), updatedAt: new Date() })
      .where(eq(courses.id, courseId))
    revalidatePath('/admin/courses')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to update payout rate.' }
  }
}

export async function adminGrantCredits(
  userId: string,
  amount: number,
  notes: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    if (!notes.trim()) return { error: 'Notes are required for admin adjustments.' }
    await db.insert(creditLedger).values({
      userId,
      amount,
      type: 'ADMIN_ADJUSTMENT',
      notes,
      expiresAt: null,
    })
    revalidatePath('/admin/members')
    return {}
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'FORBIDDEN') return { error: 'Not authorized.' }
    return { error: 'Failed to adjust credits.' }
  }
}
