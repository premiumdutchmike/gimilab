'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses, teeTimeSlots } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import PartnerLive from '@/emails/partner-live'

/**
 * Marks a partner's onboarding as complete and fires the "you're live" email
 * exactly once. Idempotent — calling this a second time is a no-op.
 *
 * Call this from a Server Action (e.g. the last wizard step's submit handler),
 * NOT from a Server Component render. Server Components must be idempotent;
 * a side-effect like this belongs behind an explicit action boundary.
 */
export async function setPartnerLive(): Promise<{ alreadyLive: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { alreadyLive: false }

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) return { alreadyLive: false }

  // Idempotency guard — if the partner is already live, don't re-run the
  // write and don't re-send the email. Protects against duplicate calls
  // (page refreshes, retries, double-submit, etc).
  if (partner.onboardingComplete) return { alreadyLive: true }

  await db.update(partners)
    .set({ onboardingComplete: true })
    .where(eq(partners.userId, user.id))

  // Fire-and-forget go-live email. Wrapped in try/catch so a Resend
  // outage does not crash the caller.
  try {
    const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
    if (course && user.email) {
      const [result] = await db.select({ count: count() }).from(teeTimeSlots).where(eq(teeTimeSlots.courseId, course.id))
      await sendEmail({
        to: user.email,
        subject: `${course.name} is now live on Gimmelab`,
        react: PartnerLive({
          partnerName: partner.businessName ?? '',
          courseName: course.name ?? '',
          courseType: '',
          holes: course.holes ?? 18,
          location: course.address ?? '',
          gimmelabRate: course.gimmelabRateCents ? Math.round(course.gimmelabRateCents / 100) : 0,
          slotsAdded: result?.count ?? 0,
          slug: course.slug,
        }),
      })
    }
  } catch (err) {
    console.error('[set-live] failed to send go-live email:', err)
  }

  return { alreadyLive: false }
}
