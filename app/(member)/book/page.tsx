import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { teeTimeSlots, courses } from '@/lib/db/schema'
import { eq, and, gte, lt, asc, sql } from 'drizzle-orm'
import { getCreditBalance } from '@/lib/credits/ledger'
import { BookFilters } from '@/components/book-filters'
import { SlotCard } from '@/components/slot-card'
import type { SlotSummary } from '@/lib/types/slot'

export const metadata = { title: 'Book a Tee Time — OneGolf' }

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    courseId?: string
    date?: string
    timeOfDay?: string
    players?: string
  }>
}) {
  // 1. Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Await searchParams (Next.js 16)
  const params = await searchParams

  // 3. Fetch credits, courses, and slots in parallel
  const [userCredits, activeCourses] = await Promise.all([
    getCreditBalance(user.id),
    db.select().from(courses).where(eq(courses.status, 'active')).orderBy(asc(courses.name)),
  ])

  // Build slot query conditions
  const conditions = [eq(teeTimeSlots.status, 'AVAILABLE')]

  if (params.courseId) {
    conditions.push(eq(teeTimeSlots.courseId, params.courseId))
  }

  if (params.date) {
    conditions.push(eq(teeTimeSlots.date, params.date))
  }

  if (params.timeOfDay && params.timeOfDay !== 'any') {
    const hourExpr = sql`EXTRACT(HOUR FROM ${teeTimeSlots.startTime}::time)`
    if (params.timeOfDay === 'morning') {
      conditions.push(and(gte(hourExpr, sql`5`), lt(hourExpr, sql`12`))!)
    } else if (params.timeOfDay === 'afternoon') {
      conditions.push(and(gte(hourExpr, sql`12`), lt(hourExpr, sql`17`))!)
    } else if (params.timeOfDay === 'evening') {
      conditions.push(and(gte(hourExpr, sql`17`), lt(hourExpr, sql`22`))!)
    }
  }

  // Fetch slots with course name joined
  const rawSlots = await db
    .select({
      id: teeTimeSlots.id,
      date: teeTimeSlots.date,
      startTime: teeTimeSlots.startTime,
      creditCost: teeTimeSlots.creditCost,
      courseName: courses.name,
    })
    .from(teeTimeSlots)
    .innerJoin(courses, eq(teeTimeSlots.courseId, courses.id))
    .where(and(...conditions))
    .orderBy(asc(teeTimeSlots.date), asc(teeTimeSlots.startTime))
    .limit(50)

  // Map to SlotSummary — combine date + startTime into ISO-like string
  const slots: SlotSummary[] = rawSlots.map((row) => ({
    id: row.id,
    // Combine date (YYYY-MM-DD) + startTime (HH:MM:SS) into a single string
    teeTime: `${row.date}T${row.startTime}`,
    creditCost: row.creditCost,
    availableSpots: 1, // one slot per row in tee_time_slots
    courseName: row.courseName,
  }))

  return (
    <main className="min-h-screen px-4 py-12 bg-[#090f1a]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">Book a Tee Time</h1>
          <div className="flex items-center gap-2 rounded-lg bg-[#0f1923] border border-white/10 px-4 py-2">
            <span className="text-white/60 text-sm">Credits</span>
            <span className="text-[#4ade80] font-semibold font-mono tabular-nums">
              {userCredits}
            </span>
          </div>
        </div>

        {/* Filters — BookFilters uses useSearchParams so it needs a Suspense boundary */}
        <Suspense
          fallback={
            <div className="h-24 bg-[#0f1923] rounded-xl border border-white/10 animate-pulse" />
          }
        >
          <BookFilters
            courses={activeCourses.map((c) => ({ id: c.id, name: c.name }))}
            initialCourseId={params.courseId}
          />
        </Suspense>

        {/* Results */}
        {slots.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0f1923] p-10 text-center">
            <p className="text-white/40 text-sm">
              No tee times available for these filters. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} userCredits={userCredits} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
