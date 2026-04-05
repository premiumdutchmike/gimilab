import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses, teeTimeSlots } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { LiveScreen } from './live-screen'

// This page is the wizard's celebration screen. It is READ-ONLY — the write
// that flips `partners.onboardingComplete` happens inside
// `actions/partner/create-slots.ts :: createInitialSlots / skipSlots` which
// is the real last step. Server Components must be idempotent.
//
// We still guard the happy-path prerequisites here so a partner who manually
// navigates here (without completing the wizard) gets bounced back to the
// step they need to finish.
export default async function LivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) redirect('/partner/apply/signup')

  const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
  if (!course) redirect('/partner/onboarding/course')
  if (!course.gimmelabRateCents) redirect('/partner/onboarding/pricing')

  const [slotCountResult] = await db
    .select({ count: count() })
    .from(teeTimeSlots)
    .where(eq(teeTimeSlots.courseId, course.id))
  const slotCount = slotCountResult?.count ?? 0

  // If onboarding is not marked complete yet, the user shouldn't be here —
  // they need to actually submit the slots form (or skip) via the wizard
  // action, which is what flips the flag. Bounce them to the slots step.
  if (!partner.onboardingComplete) redirect('/partner/onboarding/slots')

  return (
    <LiveScreen
      courseName={course.name ?? ''}
      courseType=""
      holes={course.holes ?? 18}
      location={course.address ?? ''}
      gimmelabRate={course.gimmelabRateCents ? Math.round(course.gimmelabRateCents / 100) : 0}
      slotCount={slotCount}
      stripeConnected={!!partner.stripeConnectAccountId}
      slug={course.slug}
    />
  )
}
