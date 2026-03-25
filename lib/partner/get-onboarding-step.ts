import { db } from '@/lib/db'
import { courses, teeTimeSlots } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

/**
 * Determines the next incomplete onboarding step for a partner.
 * Returns null if onboarding is complete.
 *
 * Steps:
 *  1. /partner/onboarding/course   — no course row
 *  2. /partner/onboarding/pricing  — no gimmelab_rate_cents
 *  3. /partner/onboarding/payout   — SKIPPABLE (Stripe can be done later from settings)
 *  4. /partner/onboarding/slots    — no tee_time_slots
 *  5. /partner/onboarding/live     — onboardingComplete = false
 */
export async function getNextOnboardingStep(
  partnerId: string,
  onboardingComplete: boolean,
): Promise<string | null> {
  if (onboardingComplete) return null

  // Step 1: course exists?
  const course = await db.query.courses.findFirst({
    where: eq(courses.partnerId, partnerId),
  })
  if (!course) return '/partner/onboarding/course'

  // Step 2: rate set?
  if (!course.gimmelabRateCents) return '/partner/onboarding/pricing'

  // Step 3: Stripe Connect — NOT mandatory, skip to step 4

  // Step 4: slots exist?
  const [result] = await db
    .select({ count: count() })
    .from(teeTimeSlots)
    .where(eq(teeTimeSlots.courseId, course.id))

  if (!result || result.count === 0) return '/partner/onboarding/slots'

  // Step 5: not yet marked live
  return '/partner/onboarding/live'
}
