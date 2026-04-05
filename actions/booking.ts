'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { bookTeeTime, cancelBooking, type GuestInput } from '@/lib/booking/book-tee-time'
import { db } from '@/lib/db'
import { teeTimeSlots, courses, bookings, bookingGuests, partners, users } from '@/lib/db/schema'
import { eq, and, gte, lt, count, inArray } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import BookingConfirmation from '@/emails/booking-confirmation'
import BookingCancellation from '@/emails/booking-cancellation'
import PartnerBookingNotification from '@/emails/partner-booking-notification'
import GuestWelcome from '@/emails/guest-welcome'

const guestSchema = z.object({
  firstName: z.string().trim().min(1, 'First name required').max(60),
  lastName:  z.string().trim().min(1, 'Last name required').max(60),
  email:     z.string().trim().toLowerCase().email('Valid email required').max(255),
})
const confirmSchema = z.object({
  slotId: z.string().uuid(),
  guests: z.array(guestSchema).max(3).default([]),
})

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
  guestsInput: GuestInput[] = [],
): Promise<{ error?: string; success?: boolean; fieldErrors?: Record<string, string> }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  // Validate with Zod — this also normalizes emails to lowercase
  const parsed = confirmSchema.safeParse({ slotId, guests: guestsInput })
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: first?.message ?? 'Invalid input.' }
  }
  const guests = parsed.data.guests
  const players = 1 + guests.length

  // Reject if any guest email matches the booking member's own email
  if (user.email && guests.some((g) => g.email === user.email!.toLowerCase())) {
    return { error: "You're already player 1 — don't add your own email as a guest." }
  }
  // Reject duplicate guest emails within the same booking
  const guestEmails = guests.map((g) => g.email)
  if (new Set(guestEmails).size !== guestEmails.length) {
    return { error: 'Each guest needs a unique email address.' }
  }

  let result: Awaited<ReturnType<typeof bookTeeTime>>
  try {
    result = await bookTeeTime(user.id, slotId, guests)
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
        guests,
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
          guests: guests.map(({ firstName, lastName }) => ({ firstName, lastName })),
        }),
      })
    } catch (err) {
      console.error('[booking] partner notification failed:', err)
    }
  })

  // Send guest welcome emails — one per guest, once per booking
  if (guests.length > 0 && result.guestIds.length > 0) {
    getSlotAndCourse(slotId).then(async (slot) => {
      if (!slot) return
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gimmelab.com'
      const signupUrl = `${appUrl}/signup?ref=guest`
      const sentIds: string[] = []

      await Promise.all(
        guests.map(async (g, idx) => {
          const guestRowId = result.guestIds[idx]
          try {
            await sendEmail({
              to: g.email,
              subject: `${memberName} booked you a round at ${slot.courseName}`,
              react: GuestWelcome({
                guestFirstName: g.firstName,
                hostName: memberName,
                courseName: slot.courseName,
                courseAddress: slot.courseAddress ?? '',
                date: formatDate(slot.date),
                time: formatTime(slot.startTime),
                signupUrl,
              }),
            })
            sentIds.push(guestRowId)
          } catch (err) {
            console.error('[booking] guest welcome email failed:', g.email, err)
          }
        })
      )

      // Stamp welcomeEmailSentAt so we don't accidentally resend on retry
      if (sentIds.length > 0) {
        try {
          await db
            .update(bookingGuests)
            .set({ welcomeEmailSentAt: new Date() })
            .where(inArray(bookingGuests.id, sentIds))
        } catch (err) {
          console.error('[booking] failed to stamp welcomeEmailSentAt:', err)
        }
      }
    })
  }

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
