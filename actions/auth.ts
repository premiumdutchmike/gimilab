'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import type { SubscriptionTierKey } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { signUpSchema, subscriptionTierSchema } from '@/lib/validations'

export async function signUpWithEmail(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
    plan: formData.get('plan') as string,
  }

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const tier: SubscriptionTierKey = subscriptionTierSchema.safeParse(raw.plan).success
    ? (raw.plan as SubscriptionTierKey)
    : 'core'

  const supabase = await createClient()

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: 'member',
      },
    },
  })

  if (signUpError) {
    if (
      signUpError.message.toLowerCase().includes('already registered') ||
      signUpError.message.toLowerCase().includes('already exists')
    ) {
      return { error: 'An account with this email already exists. Sign in instead.' }
    }
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Signup failed. Please try again.' }
  }

  // Create user row
  await db
    .insert(users)
    .values({
      id: authData.user.id,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
    })
    .onConflictDoNothing()

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: parsed.data.email,
    name: parsed.data.fullName,
    metadata: { userId: authData.user.id },
  })

  // Link Stripe customer to user
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, authData.user.id))

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
    metadata: { userId: authData.user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?plan=${tier}`,
  })

  redirect(session.url!)
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password.' }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle(plan: string) {
  const cookieStore = await cookies()
  const validPlan = subscriptionTierSchema.safeParse(plan).success ? plan : 'core'

  // Store chosen plan in cookie so /auth/callback can read it
  cookieStore.set('gimmelab-pending-plan', validPlan, {
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return { error: 'Could not start Google sign-in. Please try again.' }
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
