import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses } from '@/lib/db/schema'
import { and, eq, desc, sql } from 'drizzle-orm'
import { RoundsClient } from './rounds-client'

export const metadata = { title: 'My Rounds — gimilab' }

export default async function RoundsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [rows, balance] = await Promise.all([
    db
      .select({
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        creditCost: bookings.creditCost,
        courseName: courses.name,
        courseAddress: courses.address,
        slotDate: teeTimeSlots.date,
        slotStartTime: teeTimeSlots.startTime,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(teeTimeSlots.date), desc(teeTimeSlots.startTime)),
    getCreditBalance(user.id),
  ])

  const upcoming = rows
    .filter(r =>
      (r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'BOOKED') &&
      r.slotDate > today
    )
    .map(r => ({
      id: r.bookingId,
      courseName: r.courseName,
      courseAddress: r.courseAddress,
      date: r.slotDate,
      startTime: r.slotStartTime,
      playerCount: null as number | null,
      creditCost: r.creditCost,
      status: r.bookingStatus,
    }))
    .sort((a, b) => a.date < b.date ? -1 : 1)

  const past = rows
    .filter(r =>
      r.bookingStatus === 'COMPLETED' ||
      r.bookingStatus === 'CANCELLED' ||
      r.slotDate <= today
    )
    .map(r => ({
      id: r.bookingId,
      courseName: r.courseName,
      date: r.slotDate,
      startTime: r.slotStartTime,
      playerCount: null as number | null,
      creditCost: r.creditCost,
    }))

  return (
    <RoundsClient
      upcoming={upcoming}
      past={past}
      balance={balance}
    />
  )
}
