import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import CourseForm from '@/components/course-form'

export const metadata = { title: 'Edit course — Gimmelab' }

export default async function EditCoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#F4EEE3] tracking-tight">{course.name}</h1>
        <p className="text-[#847C72] text-sm mt-1">
          Status: <span className={course.status === 'active' ? 'text-[#5FB380]' : 'text-[#BF7B2E]'}>{course.status}</span>
        </p>
      </div>
      <CourseForm
        mode="edit"
        courseId={course.id}
        initialValues={{
          name: course.name,
          description: course.description,
          address: course.address,
          holes: course.holes as 9 | 18,
          baseCreditCost: course.baseCreditCost,
          amenities: course.amenities,
          photos: course.photos,
        }}
      />
    </div>
  )
}
