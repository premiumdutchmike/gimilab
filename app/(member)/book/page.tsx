import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { BookingClient } from '../dashboard/booking-client'

export const metadata = { title: 'Book a Tee Time — gimmelab' }
export const dynamic = 'force-dynamic'

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; date?: string; slot?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/book')

  const { course, date, slot } = await searchParams

  const [courseList, balance] = await Promise.all([
    db
      .select({ id: courses.id, name: courses.name })
      .from(courses)
      .where(eq(courses.status, 'active'))
      .orderBy(asc(courses.name)),
    getCreditBalance(user.id),
  ])

  return (
    <BookingClient
      courseOptions={courseList}
      balance={balance}
      preselectedCourseId={course}
      preselectedDate={date}
      preselectedSlotId={slot}
    />
  )
}
