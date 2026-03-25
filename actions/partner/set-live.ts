'use server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses, teeTimeSlots } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import PartnerLive from '@/emails/partner-live'

export async function setPartnerLive() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) return

  await db.update(partners)
    .set({ onboardingComplete: true })
    .where(eq(partners.userId, user.id))

  // Fire-and-forget go-live email
  const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
  if (course && user.email) {
    const [result] = await db.select({ count: count() }).from(teeTimeSlots).where(eq(teeTimeSlots.courseId, course.id))
    const slug = (course.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    sendEmail({
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
        slug,
      }),
    })
  }
}
