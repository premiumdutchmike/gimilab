import { redirect } from 'next/navigation'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users, bookings, teeTimeSlots } from '@/lib/db/schema'
import { and, eq, gt, count, sql } from 'drizzle-orm'
import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — OneGolf' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Count upcoming confirmed bookings (slot date in the future)
  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  const [dbUser, balance, upcomingResult] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).then(rows => rows[0]),
    getCreditBalance(user.id),
    db
      .select({ count: count() })
      .from(bookings)
      .innerJoin(teeTimeSlots, eq(bookings.slotId, teeTimeSlots.id))
      .where(
        and(
          eq(bookings.userId, user.id),
          sql`${bookings.status} IN ('CONFIRMED', 'BOOKED')`,
          gt(teeTimeSlots.date, today)
        )
      )
      .then(rows => rows[0]),
  ])
  const upcomingCount = upcomingResult?.count ?? 0

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: '#090f1a' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          Hey, {dbUser?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Credit Balance</p>
            <p className="text-5xl font-bold text-green-400">{balance}</p>
            <p className="text-white/40 text-sm mt-1 capitalize">
              {dbUser?.subscriptionTier ?? '—'} plan
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Upcoming Rounds</p>
            <p className="text-5xl font-bold text-white">{upcomingCount}</p>
            <p className="text-white/40 text-sm mt-1">confirmed bookings</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/book"
            className="rounded-xl border border-green-400/30 bg-green-400/5 p-4 text-center hover:bg-green-400/10 transition-colors"
          >
            <p className="text-green-400 font-semibold text-sm">Book a Tee Time</p>
            <p className="text-white/40 text-xs mt-0.5">Find available slots</p>
          </Link>
          <Link
            href="/courses"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-semibold text-sm">Browse Courses</p>
            <p className="text-white/40 text-xs mt-0.5">Explore partner courses</p>
          </Link>
          <Link
            href="/rounds"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-semibold text-sm">My Rounds</p>
            <p className="text-white/40 text-xs mt-0.5">Booking history</p>
          </Link>
          <Link
            href="/credits"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 transition-colors"
          >
            <p className="text-white font-semibold text-sm">Credits</p>
            <p className="text-white/40 text-xs mt-0.5">Balance &amp; top-ups</p>
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Find a Tee Time</p>
          <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white/30 text-sm">
            AI booking search coming soon…
          </div>
        </div>

        <form action={signOut}>
          <button type="submit" className="text-white/30 text-sm hover:text-white/50 underline">
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
