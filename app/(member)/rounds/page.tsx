import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses, ratings, bookingGuests } from '@/lib/db/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { RoundsClient } from './rounds-client'

export const metadata = { title: 'My Rounds — gimmelab' }

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
        qrCode: bookings.qrCode,
        ratingScore: ratings.score,
        ratingId: ratings.id,
      })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .innerJoin(courses, eq(bookings.courseId, courses.id))
      .leftJoin(ratings, eq(ratings.bookingId, bookings.id))
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(teeTimeSlots.date), desc(teeTimeSlots.startTime)),
    getCreditBalance(user.id),
  ])

  // Fetch guests for all bookings in one query
  const bookingIds = rows.map(r => r.bookingId)
  const allGuests = bookingIds.length > 0
    ? await db
        .select({
          bookingId: bookingGuests.bookingId,
          firstName: bookingGuests.firstName,
          lastName: bookingGuests.lastName,
          email: bookingGuests.email,
        })
        .from(bookingGuests)
        .where(inArray(bookingGuests.bookingId, bookingIds))
    : []

  const guestsByBooking = new Map<string, typeof allGuests>()
  for (const g of allGuests) {
    const list = guestsByBooking.get(g.bookingId) ?? []
    list.push(g)
    guestsByBooking.set(g.bookingId, list)
  }

  const upcoming = rows
    .filter(r =>
      (r.bookingStatus === 'CONFIRMED' || r.bookingStatus === 'BOOKED') &&
      r.slotDate > today
    )
    .map(r => {
      const guests = guestsByBooking.get(r.bookingId) ?? []
      return {
        id: r.bookingId,
        courseName: r.courseName,
        courseAddress: r.courseAddress,
        date: r.slotDate,
        startTime: r.slotStartTime,
        playerCount: 1 + guests.length,
        creditCost: r.creditCost,
        status: r.bookingStatus,
        qrCode: r.qrCode,
        guests: guests.map(g => ({ firstName: g.firstName, lastName: g.lastName, email: g.email })),
      }
    })
    .sort((a, b) => a.date < b.date ? -1 : 1)

  const past = rows
    .filter(r =>
      r.bookingStatus === 'COMPLETED' ||
      r.bookingStatus === 'CANCELLED' ||
      r.slotDate <= today
    )
    .map(r => {
      const guests = guestsByBooking.get(r.bookingId) ?? []
      return {
        id: r.bookingId,
        courseName: r.courseName,
        date: r.slotDate,
        startTime: r.slotStartTime,
        playerCount: 1 + guests.length,
        creditCost: r.creditCost,
        ratingScore: r.ratingScore ?? null,
        ratingId: r.ratingId ?? null,
        bookingStatus: r.bookingStatus,
      }
    })

  return (
    <RoundsClient
      upcoming={upcoming}
      past={past}
      balance={balance}
    />
  )
}
