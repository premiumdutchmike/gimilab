import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe/client'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { subscriptionTierSchema } from '@/lib/validations'
import type { SubscriptionTierKey } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Exchange code for session using the anon server client
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  const { user } = data
  const cookieStore = await cookies()

  // Set member role via service role client
  const adminSupabase = await createServiceClient()
  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: 'member' },
  })

  // Upsert user row — fullName is nullable so we gracefully fall back to null
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email!,
      fullName:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        null,
    })
    .onConflictDoNothing()

  // Read pending plan from cookie
  const pendingPlan = cookieStore.get('onegolf-pending-plan')?.value
  const tier: SubscriptionTierKey = subscriptionTierSchema.safeParse(pendingPlan).success
    ? (pendingPlan as SubscriptionTierKey)
    : 'core'

  // Get the user row (may have been just inserted or existed before)
  const [existingUser] = await db.select().from(users).where(eq(users.id, user.id))
  let customerId = existingUser?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: existingUser?.fullName ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, user.id))
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_IDS[tier], quantity: 1 }],
    metadata: { userId: user.id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?plan=${tier}`,
  })

  // Clear pending plan cookie
  cookieStore.delete('onegolf-pending-plan')

  return NextResponse.redirect(session.url!)
}
