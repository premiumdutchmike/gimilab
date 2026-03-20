import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import MemberNav from '@/components/member-nav'

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let balance = 0
  try {
    balance = await getCreditBalance(user.id)
  } catch (err) {
    console.error('[member-layout] getCreditBalance failed', err)
  }

  const firstName =
    user.user_metadata?.full_name?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'You'

  return (
    <div className="min-h-screen bg-[#090f1a] flex flex-col">
      <MemberNav credits={balance} firstName={firstName} />
      <main className="flex-1">{children}</main>
    </div>
  )
}
