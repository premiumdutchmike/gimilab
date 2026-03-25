import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses, users } from '@/lib/db/schema'
import { eq, and, gte, lt, sql } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import TeeTimeReminder from '@/emails/tee-time-reminder'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find bookings for tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStart = tomorrow.toISOString().split('T')[0]
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)
  const dayAfterStart = dayAfter.toISOString().split('T')[0]

  try {
    const tomorrowBookings = await db
      .select({
        bookingId: bookings.id,
        userId: bookings.userId,
        slotId: bookings.slotId,
        creditCost: bookings.creditCost,
        slotDate: teeTimeSlots.date,
        slotTime: teeTimeSlots.startTime,
        courseName: courses.name,
        courseAddress: courses.address,
        userEmail: users.email,
        userName: users.fullName,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.status, 'CONFIRMED'),
          gte(teeTimeSlots.date, tomorrowStart),
          lt(teeTimeSlots.date, dayAfterStart),
        )
      )

    let sent = 0
    for (const booking of tomorrowBookings) {
      if (!booking.userEmail) continue

      await sendEmail({
        to: booking.userEmail,
        subject: `Tee time tomorrow at ${booking.courseName} — ${booking.slotTime}`,
        react: TeeTimeReminder({
          memberName: booking.userName ?? booking.userEmail,
          courseName: booking.courseName ?? '',
          courseAddress: booking.courseAddress ?? '',
          date: booking.slotDate ?? tomorrowStart,
          time: booking.slotTime ?? '',
          players: 1,
          creditCost: booking.creditCost ?? 0,
        }),
      })
      sent++
    }

    return NextResponse.json({ sent, total: tomorrowBookings.length })
  } catch (err) {
    console.error('[cron/send-reminders] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
