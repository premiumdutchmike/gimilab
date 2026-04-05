import { db } from '@/lib/db'
import { bookings, bookingGuests, teeTimeSlots, creditLedger, courses, users } from '@/lib/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { debitCredits } from '@/lib/credits/ledger'
import { CREDIT_VALUE_CENTS } from '@/lib/stripe/client'
import { randomUUID } from 'crypto'
import type { Booking } from '@/lib/db/schema'

export interface GuestInput {
  firstName: string
  lastName: string
  email: string
}

export interface BookingResult {
  booking: Booking
  guestIds: string[]
}

// Atomic booking — credit debit + slot status update + guest inserts in a
// single transaction. Uses SELECT FOR UPDATE to prevent race conditions.
//
// The booking owner (userId) is always player 1. `guests` contains additional
// players 2-4. Party size = 1 + guests.length, and credit cost is multiplied
// accordingly.
export async function bookTeeTime(
  userId: string,
  slotId: string,
  guests: GuestInput[] = []
): Promise<BookingResult> {
  const players = 1 + guests.length
  if (players < 1 || players > 4) throw new Error('INVALID_PLAYERS')

  return db.transaction(async (tx) => {
    // 1. Lock the slot row — prevents concurrent bookings of the same slot
    const slotResult = await tx.execute(
      sql`SELECT * FROM tee_time_slots WHERE id = ${slotId} FOR UPDATE`
    )
    const slot = (Array.isArray(slotResult) ? slotResult[0] : (slotResult as { rows?: unknown[] }).rows?.[0]) as {
      id: string
      course_id: string
      credit_cost: number
      status: string
    } | undefined

    if (!slot || slot.status !== 'AVAILABLE') {
      throw new Error('SLOT_NOT_AVAILABLE')
    }

    const totalCreditCost = slot.credit_cost * players

    // 2. Fetch course payout rate
    const [course] = await tx
      .select({ payoutRate: courses.payoutRate })
      .from(courses)
      .where(eq(courses.id, slot.course_id))
    const payoutRate = Number(course?.payoutRate ?? '0.70')
    const payoutAmountCents = Math.floor(totalCreditCost * CREDIT_VALUE_CENTS * payoutRate)

    // 3. Generate IDs before debit so referenceId is set correctly
    const qrCode = randomUUID()
    const bookingId = randomUUID()

    // 4. Debit credits — balance check + insert run in the same transaction snapshot
    await debitCredits(userId, totalCreditCost, bookingId, tx)

    // 5. Create booking record
    const [booking] = await tx
      .insert(bookings)
      .values({
        id: bookingId,
        userId,
        slotId,
        courseId: slot.course_id,
        creditCost: totalCreditCost,
        status: 'CONFIRMED',
        qrCode,
        payoutStatus: 'PENDING',
        payoutAmountCents,
      })
      .returning()

    // 6. Insert guests (if any) — silent attribution match against users.email
    const guestIds: string[] = []
    if (guests.length > 0) {
      const normalizedEmails = guests.map((g) => g.email.trim().toLowerCase())
      const existingUsers = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.email, normalizedEmails))
      const emailToUserId = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]))

      const guestRows = guests.map((g) => ({
        bookingId: booking.id,
        firstName: g.firstName.trim(),
        lastName: g.lastName.trim(),
        email: g.email.trim().toLowerCase(),
        matchedUserId: emailToUserId.get(g.email.trim().toLowerCase()) ?? null,
      }))

      const inserted = await tx.insert(bookingGuests).values(guestRows).returning({ id: bookingGuests.id })
      guestIds.push(...inserted.map((r) => r.id))
    }

    // 7. Mark slot as booked
    await tx
      .update(teeTimeSlots)
      .set({ status: 'BOOKED', bookingId: booking.id, updatedAt: new Date() })
      .where(eq(teeTimeSlots.id, slotId))

    return { booking, guestIds }
  })
}

// Cancel a booking — refunds credits if within cancellation window (24 hours)
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason?: string
): Promise<{ refunded: number }> {
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))

    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (booking.userId !== userId) throw new Error('UNAUTHORIZED')
    if (booking.status !== 'CONFIRMED') throw new Error('BOOKING_NOT_CANCELLABLE')

    // Get the slot to check tee time
    const [slot] = await tx
      .select()
      .from(teeTimeSlots)
      .where(eq(teeTimeSlots.id, booking.slotId))

    const teeDateTime = new Date(`${slot.date}T${slot.startTime}`)
    const now = new Date()
    const hoursUntilTeeTime = (teeDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Refund if more than 24 hours until tee time
    const refundAmount = hoursUntilTeeTime > 24 ? booking.creditCost : 0

    const now2 = new Date()

    // Update booking status
    await tx
      .update(bookings)
      .set({
        status: 'CANCELLED',
        cancelledAt: now2,
        cancellationReason: reason ?? null,
        refundAmount,
        updatedAt: now2,
      })
      .where(eq(bookings.id, bookingId))

    // Release slot back to available
    await tx
      .update(teeTimeSlots)
      .set({ status: 'AVAILABLE', bookingId: null, updatedAt: now2 })
      .where(eq(teeTimeSlots.id, booking.slotId))

    // Issue refund credits if applicable
    if (refundAmount > 0) {
      await tx.insert(creditLedger).values({
        userId,
        amount: refundAmount,
        type: 'BOOKING_REFUND',
        referenceId: bookingId,
        notes: `Refund for cancelled booking ${bookingId}`,
        expiresAt: null,
      })
    }

    return { refunded: refundAmount }
  })
}
