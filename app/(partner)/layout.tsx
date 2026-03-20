import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId } from '@/lib/partner/queries'
import PartnerNav from '@/components/partner-nav'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let partner
  try {
    partner = await getPartnerByUserId(user.id)
  } catch (err) {
    console.error('[partner-layout] query failed', err)
    redirect('/login')
  }

  if (!partner) redirect('/login')

  return (
    <div className="min-h-screen bg-[#090f1a] flex flex-col">
      <PartnerNav businessName={partner.businessName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
