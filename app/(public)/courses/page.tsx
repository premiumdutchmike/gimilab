import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import CoursesBrowser from '@/components/courses-browser'
import { FALLBACK_COURSES, type CourseItem } from './fallback-courses'

export const metadata = {
  title: 'Member Courses — gimmelab',
  description: 'Browse every partner course. Book with monthly credits — no fees, no phone calls.',
}

export type { CourseItem } from './fallback-courses'

export default async function PublicCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const [activeCourses, balance] = await Promise.all([
    db.select().from(courses).where(eq(courses.status, 'active')).orderBy(asc(courses.name)),
    user ? getCreditBalance(user.id) : Promise.resolve(undefined),
  ])

  const displayCourses: CourseItem[] = activeCourses.length > 0
    ? activeCourses.map(c => ({
        id: c.id,
        name: c.name,
        address: c.address,
        holes: c.holes ?? 18,
        baseCreditCost: c.baseCreditCost,
        photos: (c.photos as string[]) ?? [],
        slug: c.slug,
        type: 'Public',
        tags: [`${c.holes ?? 18} Holes`],
      }))
    : FALLBACK_COURSES

  return <CoursesBrowser courses={displayCourses} isLoggedIn={isLoggedIn} balance={balance} />
}
