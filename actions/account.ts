'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function updateFullName(formData: FormData) {
  const fullName = (formData.get('fullName') as string | null)?.trim()
  if (!fullName || fullName.length < 2) return { error: 'Name must be at least 2 characters.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  await db.update(users).set({ fullName, updatedAt: new Date() }).where(eq(users.id, user.id))
  await supabase.auth.updateUser({ data: { full_name: fullName } })

  return { success: true }
}

export async function sendPasswordReset() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated.' }

  await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
  })

  return { success: true }
}

export async function openStripePortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await db.select({ stripeCustomerId: users.stripeCustomerId })
    .from(users).where(eq(users.id, user.id)).then(r => r[0])

  if (!dbUser?.stripeCustomerId) return { error: 'No billing account found.' }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  })

  redirect(session.url)
}
