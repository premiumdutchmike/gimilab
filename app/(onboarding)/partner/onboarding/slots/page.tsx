import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners, courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { OnboardingStepper } from '@/components/partner/onboarding-stepper'
import { SlotsForm } from './slots-form'

export default async function SlotsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const partner = await db.query.partners.findFirst({ where: eq(partners.userId, user.id) })
  if (!partner) redirect('/partner/apply/signup')

  const course = await db.query.courses.findFirst({ where: eq(courses.partnerId, partner.id) })
  if (!course) redirect('/partner/onboarding/course')

  return (
    <>
      <OnboardingStepper currentStep={4} />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{
          background: '#1E1D1B',
          border: '1px solid rgba(229,221,211,0.1)',
          borderRadius: 2,
          padding: 40,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 10,
          }}>
            Step 4 of 5
          </p>
          <h2 style={{
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em',
            color: '#F4EEE3', marginBottom: 8,
          }}>
            Add your first tee times
          </h2>
          <p style={{ fontSize: 14, color: '#847C72', marginBottom: 24, lineHeight: 1.5 }}>
            Give members something to book. You can add more anytime from your dashboard.
          </p>
          <div style={{ borderTop: '1px solid rgba(229,221,211,0.1)', marginBottom: 32 }} />
          <SlotsForm courseId={course.id} />
        </div>
      </div>
    </>
  )
}
