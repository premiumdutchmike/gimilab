import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AccountClient } from './account-client'

export const metadata = { title: 'My Account — gimilab' }

const TIER_CONFIG: Record<string, { name: string; price: number; credits: number }> = {
  casual: { name: 'Casual', price: 99,  credits: 100 },
  core:   { name: 'Core',   price: 149, credits: 150 },
  heavy:  { name: 'Heavy',  price: 199, credits: 210 },
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .then(r => r[0] ?? null)

  const fullName = dbUser?.fullName ?? (user.user_metadata?.full_name as string | undefined) ?? 'Member'
  const email = dbUser?.email ?? user.email ?? ''
  const tier = dbUser?.subscriptionTier ?? null

  const memberSince = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const now = new Date()
  const nextRenewal = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const renewLabel = nextRenewal.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const tierKey = tier ?? 'core'
  const cfg = TIER_CONFIG[tierKey] ?? TIER_CONFIG.core

  return (
    <AccountClient
      fullName={fullName}
      email={email}
      tier={tier}
      memberSince={memberSince}
      renewLabel={renewLabel}
      tierName={cfg.name}
      tierPrice={cfg.price}
      tierCredits={cfg.credits}
    />
  )
}
