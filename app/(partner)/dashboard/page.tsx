import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'

export const metadata = { title: 'Partner Dashboard — OneGolf' }

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const stats = [
    { label: 'Total bookings', value: '0' },
    { label: 'This week', value: '0' },
    { label: 'Active slots', value: '0' },
    { label: 'Revenue', value: '$0' },
  ]

  return (
    <div className="p-8">
      {course.status === 'pending' && (
        <div className="mb-6 px-4 py-3 border border-yellow-400/30 bg-yellow-400/5 text-yellow-400 text-sm">
          Your course is pending approval. We'll notify you when it goes live.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">{course.name}</h1>
        <p className="text-white/40 text-sm mt-1 uppercase tracking-widest text-xs">Partner Dashboard</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1a1a1a]">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#090f1a] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
