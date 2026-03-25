import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses, teeTimeSlots } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { setPartnerLive } from '@/actions/partner/set-live'
import { LiveScreen } from './live-screen'

export default async function LivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let courseName = ''
  let courseType = ''
  let holes = 18
  let location = ''
  let gimmelabRate = 0
  let slotCount = 0
  let stripeConnected = false

  if (user) {
    const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
    if (partner) {
      stripeConnected = !!partner.stripeConnectAccountId

      // Mark live
      await setPartnerLive()

      const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
      if (course) {
        courseName = course.name ?? ''
        holes = course.holes ?? 18
        gimmelabRate = course.gimmelabRateCents ? Math.round(course.gimmelabRateCents / 100) : 0

        const [addrParts] = (course.address ?? '').split(',').reverse()
        location = course.address ?? ''

        const [result] = await db.select({ count: count() })
          .from(teeTimeSlots)
          .where(eq(teeTimeSlots.courseId, course.id))
        slotCount = result?.count ?? 0
      }
    }
  }

  const slug = courseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <LiveScreen
      courseName={courseName}
      courseType={courseType}
      holes={holes}
      location={location}
      gimmelabRate={gimmelabRate}
      slotCount={slotCount}
      stripeConnected={stripeConnected}
      slug={slug}
    />
  )
}
