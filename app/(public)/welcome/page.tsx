import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users, subscriptionTiers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { WelcomeCredits } from '@/components/welcome-credits'

export const metadata = { title: 'Welcome — OneGolf' }

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // If already welcomed before, redirect to dashboard
  const cookieStore = await cookies()
  const alreadyWelcomed = cookieStore.get('onegolf-welcomed')?.value
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id))

  if (alreadyWelcomed && dbUser?.subscriptionStatus === 'active') {
    redirect('/dashboard')
  }

  const tierName = dbUser?.subscriptionTier
    ? dbUser.subscriptionTier.charAt(0).toUpperCase() + dbUser.subscriptionTier.slice(1)
    : 'Core'

  const firstName = dbUser?.fullName?.split(' ')[0] ?? ''

  // Look up expected credits for their tier
  const [tier] = dbUser?.subscriptionTier
    ? await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, dbUser.subscriptionTier))
    : []

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}
    >
      <WelcomeCredits
        userId={user.id}
        firstName={firstName}
        tierName={tierName}
        expectedCredits={tier?.monthlyCredits ?? 150}
      />
    </main>
  )
}
