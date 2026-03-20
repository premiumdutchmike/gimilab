import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { bookings, teeTimeSlots, courses } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { RoundCard } from '@/components/round-card'
import type { BookingSummary, BookingStatus } from '@/lib/types/slot'

export const metadata = { title: 'My Rounds — OneGolf' }

/** Map DB booking status → BookingSummary status */
function toDisplayStatus(dbStatus: string): BookingStatus {
  if (dbStatus === 'CONFIRMED') return 'BOOKED'
  if (dbStatus === 'COMPLETED') return 'COMPLETED'
  // CANCELLED and NO_SHOW both render as CANCELLED
  return 'CANCELLED'
}

export default async function RoundsPage() {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Query bookings joined with tee_time_slots and courses
  const rows = await db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      creditCost: bookings.creditCost,
      courseName: courses.name,
      slotDate: teeTimeSlots.date,
      slotStartTime: teeTimeSlots.startTime,
    })
    .from(bookings)
    .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
    .innerJoin(courses, eq(bookings.courseId, courses.id))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(teeTimeSlots.date), desc(teeTimeSlots.startTime))

  // 3. Map to BookingSummary[]
  const allBookings: BookingSummary[] = rows.map((row) => ({
    id: row.bookingId,
    courseName: row.courseName,
    teeTime: `${row.slotDate}T${row.slotStartTime}`,
    creditCost: row.creditCost,
    status: toDisplayStatus(row.bookingStatus),
  }))

  // 4. Split into upcoming vs past
  const now = new Date()

  const upcoming = allBookings.filter(
    (b) => b.status === 'BOOKED' && new Date(b.teeTime) > now,
  )

  const past = allBookings.filter(
    (b) => b.status !== 'BOOKED' || new Date(b.teeTime) <= now,
  )

  // 5. Render
  return (
    <main className="min-h-screen px-4 py-12 bg-[#090f1a]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-10">My Rounds</h1>

        {allBookings.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-white/50 text-sm mb-4">
              You haven&apos;t booked any rounds yet.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center rounded-lg bg-[#4ade80] px-4 py-2 text-sm font-medium text-[#090f1a] hover:bg-[#4ade80]/90 transition-colors"
            >
              Book a Round
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Upcoming Rounds */}
            <section>
              <h2 className="text-base font-semibold text-white/70 uppercase tracking-wider mb-4">
                Upcoming Rounds
                {upcoming.length > 0 && (
                  <span className="ml-2 text-[#4ade80]">({upcoming.length})</span>
                )}
              </h2>

              {upcoming.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-white/40 text-sm mb-3">No upcoming rounds.</p>
                  <Link
                    href="/book"
                    className="text-[#4ade80] text-sm hover:underline"
                  >
                    Book a round →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcoming.map((booking) => (
                    <RoundCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </section>

            {/* Past Rounds */}
            <section>
              <h2 className="text-base font-semibold text-white/70 uppercase tracking-wider mb-4">
                Past Rounds
                {past.length > 0 && (
                  <span className="ml-2 text-white/40">({past.length})</span>
                )}
              </h2>

              {past.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-white/40 text-sm">No past rounds yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {past.map((booking) => (
                    <RoundCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
