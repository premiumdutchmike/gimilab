import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import MemberSidebar from '@/components/member-sidebar'

function getCreditResetLabel(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `resets ${nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

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
  let dbUser = null as { fullName: string | null; email: string; subscriptionTier: string | null } | null

  try {
    const [bal, row] = await Promise.all([
      getCreditBalance(user.id),
      db.select({
        fullName: users.fullName,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
      }).from(users).where(eq(users.id, user.id)).then(r => r[0] ?? null),
    ])
    balance = bal
    dbUser = row
  } catch (err) {
    console.error('[member-layout]', err)
  }

  const fullName =
    dbUser?.fullName ??
    user.user_metadata?.full_name ??
    user.email?.split('@')[0] ??
    'Member'

  const email = dbUser?.email ?? user.email ?? ''
  const tier = dbUser?.subscriptionTier ?? null
  const creditResetLabel = getCreditResetLabel()

  return (
    <div style={{ minHeight: '100vh', background: '#FDFAF6', display: 'flex' }}>
      <MemberSidebar
        fullName={fullName}
        email={email}
        tier={tier}
        credits={balance}
        creditResetLabel={creditResetLabel}
      />
      <main style={{ marginLeft: 228, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
