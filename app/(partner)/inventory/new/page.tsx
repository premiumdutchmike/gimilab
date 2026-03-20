import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import BlockForm from '@/components/block-form'

export const metadata = { title: 'Add Block — OneGolf' }

export default async function NewBlockPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  return (
    <div className="px-8 py-8">
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
          Inventory
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
          Set up availability
        </h1>
      </div>
      <BlockForm mode="create" />
    </div>
  )
}
