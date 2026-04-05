import { db } from '@/lib/db'
import { courses, users } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import CoursesBrowser from '@/components/courses-browser'
import { FALLBACK_COURSES, type CourseItem } from './fallback-courses'
import type { PlanKey } from '@/lib/credits/pricing'

export const metadata = {
  title: 'Member Courses — gimmelab',
  description: 'Browse every partner course. Book with monthly credits — no fees, no phone calls.',
}

export type { CourseItem } from './fallback-courses'

const ALLOWED_TIERS: readonly PlanKey[] = ['casual', 'core', 'heavy']

export default async function PublicCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const [activeCourses, balance, dbUser] = await Promise.all([
    db.select().from(courses).where(eq(courses.status, 'active')).orderBy(asc(courses.name)),
    user ? getCreditBalance(user.id) : Promise.resolve(undefined),
    user
      ? db
          .select({
            subscriptionTier: users.subscriptionTier,
            homeZip: users.homeZip,
          })
          .from(users)
          .where(eq(users.id, user.id))
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
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
        lat: c.lat != null ? parseFloat(c.lat as unknown as string) : null,
        lng: c.lng != null ? parseFloat(c.lng as unknown as string) : null,
      }))
    : FALLBACK_COURSES

  const userTier: PlanKey | undefined =
    dbUser?.subscriptionTier && (ALLOWED_TIERS as readonly string[]).includes(dbUser.subscriptionTier)
      ? (dbUser.subscriptionTier as PlanKey)
      : undefined

  return (
    <CoursesBrowser
      courses={displayCourses}
      isLoggedIn={isLoggedIn}
      balance={balance}
      userTier={userTier}
      userHomeZip={dbUser?.homeZip ?? null}
    />
  )
}
