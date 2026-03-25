'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bookTeeTime, cancelBooking } from '@/lib/booking/book-tee-time'
import { db } from '@/lib/db'
import { teeTimeSlots, courses, bookings, partners, users } from '@/lib/db/schema'
import { eq, and, gte, lt, count } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import BookingConfirmation from '@/emails/booking-confirmation'
import BookingCancellation from '@/emails/booking-cancellation'
import PartnerBookingNotification from '@/emails/partner-booking-notification'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

async function getSlotAndCourse(slotId: string) {
  const rows = await db
    .select({
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      courseName: courses.name,
      courseAddress: courses.address,
      courseId: courses.id,
    })
    .from(teeTimeSlots)
    .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
    .where(eq(teeTimeSlots.id, slotId))
    .limit(1)
  return rows[0] ?? null
}

async function getBookingWithSlotAndCourse(bookingId: string) {
  const rows = await db
    .select({
      creditCost: bookings.creditCost,
      refundAmount: bookings.refundAmount,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      courseName: courses.name,
    })
    .from(bookings)
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .innerJoin(courses, eq(bookings.courseId, courses.id))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  return rows[0] ?? null
}

export async function bookSlot(slotId: string): Promise<{ error: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  try {
    await bookTeeTime(user.id, slotId)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'SLOT_NOT_AVAILABLE') {
      return { error: 'This slot was just booked. Please choose another.' }
    }
    if (message === 'INSUFFICIENT_CREDITS') {
      return { error: 'Not enough credits to book this slot.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  redirect('/rounds')
}

export async function confirmBooking(
  slotId: string,
  players = 1,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  let result: Awaited<ReturnType<typeof bookTeeTime>>
  try {
    result = await bookTeeTime(user.id, slotId, players)
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'SLOT_NOT_AVAILABLE') {
      return { error: 'This slot was just booked. Please choose another.' }
    }
    if (message === 'INSUFFICIENT_CREDITS') {
      return { error: 'Not enough credits to book this slot.' }
    }
    if (message === 'INVALID_PLAYERS') {
      return { error: 'Invalid number of players.' }
    }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/rounds')
  revalidatePath('/credits')

  // Send confirmation email — fire and forget
  const memberName = user.user_metadata?.full_name ?? user.email ?? ''
  getSlotAndCourse(slotId).then(slot => {
    if (!slot || !user.email) return
    sendEmail({
      to: user.email,
      subject: `Confirmed: ${slot.courseName} on ${formatDate(slot.date)}`,
      react: BookingConfirmation({
        memberName,
        courseName: slot.courseName,
        courseAddress: slot.courseAddress ?? '',
        date: formatDate(slot.date),
        time: formatTime(slot.startTime),
        players,
        creditCost: result.booking.creditCost,
        qrCode: result.booking.qrCode ?? result.booking.id.slice(0, 8).toUpperCase(),
      }),
    })
  })

  // Notify partner — fire and forget
  getSlotAndCourse(slotId).then(async (slot) => {
    if (!slot) return
    try {
      const [course] = await db.select().from(courses).where(eq(courses.id, slot.courseId))
      if (!course) return
      const [partner] = await db.select().from(partners).where(eq(partners.id, course.partnerId))
      if (!partner) return
      const [partnerUser] = await db.select().from(users).where(eq(users.id, partner.userId))
      if (!partnerUser?.email) return

      const payoutRate = parseFloat(course.payoutRate ?? '0.85')
      const earnings = (result.booking.creditCost * payoutRate).toFixed(2)

      // Count today's bookings for this course
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const [todayCount] = await db
        .select({ count: count() })
        .from(bookings)
        .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
        .where(and(
          eq(teeTimeSlots.courseId, course.id),
          eq(bookings.status, 'CONFIRMED'),
          gte(teeTimeSlots.date, today),
          lt(teeTimeSlots.date, tomorrow),
        ))

      sendEmail({
        to: partnerUser.email,
        subject: `New booking at ${course.name} — ${formatDate(slot.date)} at ${formatTime(slot.startTime)}`,
        react: PartnerBookingNotification({
          partnerName: partner.businessName ?? '',
          memberName: user.user_metadata?.full_name ?? 'A member',
          courseName: course.name ?? '',
          date: formatDate(slot.date),
          time: formatTime(slot.startTime),
          players,
          creditCost: result.booking.creditCost,
          partnerEarnings: `$${earnings}`,
          totalBookingsToday: todayCount?.count ?? 1,
        }),
      })
    } catch (err) {
      console.error('[booking] partner notification failed:', err)
    }
  })

  return { success: true }
}

export async function cancelSlot(
  bookingId: string,
  reason?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  let refunded = 0
  try {
    const result = await cancelBooking(bookingId, user.id, reason)
    refunded = result.refunded
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message === 'BOOKING_NOT_FOUND') return { error: 'Booking not found.' }
    if (message === 'UNAUTHORIZED') return { error: 'Not authorized.' }
    if (message === 'BOOKING_NOT_CANCELLABLE') return { error: 'This booking cannot be cancelled.' }
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/rounds')

  // Send cancellation email — fire and forget
  const memberName = user.user_metadata?.full_name ?? user.email ?? ''
  getBookingWithSlotAndCourse(bookingId).then(details => {
    if (!details || !user.email) return
    sendEmail({
      to: user.email,
      subject: `Booking cancelled — ${details.courseName} on ${formatDate(details.date)}`,
      react: BookingCancellation({
        memberName,
        courseName: details.courseName,
        date: formatDate(details.date),
        time: formatTime(details.startTime),
        creditsRefunded: refunded,
      }),
    })
  })

  return {}
}
