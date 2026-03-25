import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses, users, ratings } from '@/lib/db/schema'
import { eq, and, gte, lt, sql } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import ReviewRequest from '@/emails/review-request'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find bookings from yesterday (completed rounds)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStart = yesterday.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  try {
    const completedBookings = await db
      .select({
        bookingId: bookings.id,
        userId: bookings.userId,
        courseId: teeTimeSlots.courseId,
        slotDate: teeTimeSlots.date,
        courseName: courses.name,
        courseSlug: courses.slug,
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
          gte(teeTimeSlots.date, yesterdayStart),
          lt(teeTimeSlots.date, today),
        )
      )

    let sent = 0
    for (const booking of completedBookings) {
      if (!booking.userEmail) continue

      // Skip if already reviewed
      const existingReview = await db
        .select({ id: ratings.id })
        .from(ratings)
        .where(
          and(
            eq(ratings.userId, booking.userId),
            eq(ratings.courseId, booking.courseId),
            eq(ratings.bookingId, booking.bookingId),
          )
        )
        .limit(1)

      if (existingReview.length > 0) continue

      await sendEmail({
        to: booking.userEmail,
        subject: `How was your round at ${booking.courseName}?`,
        react: ReviewRequest({
          memberName: booking.userName ?? booking.userEmail,
          courseName: booking.courseName ?? '',
          date: booking.slotDate ?? yesterdayStart,
          courseSlug: booking.courseSlug ?? '',
        }),
      })
      sent++
    }

    return NextResponse.json({ sent, total: completedBookings.length })
  } catch (err) {
    console.error('[cron/send-reviews] error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
