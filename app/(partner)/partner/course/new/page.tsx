import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import CourseForm from '@/components/course-form'

export const metadata = { title: 'Set up your course — Gimmelab' }

export default async function NewCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const existing = await getPartnerCourse(partner.id)
  if (existing) redirect('/partner/course')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Set up your course</h1>
        <p className="text-white/40 text-sm mt-1">Your course will be reviewed before going live.</p>
      </div>
      <CourseForm mode="create" partnerId={partner.id} />
    </div>
  )
}
