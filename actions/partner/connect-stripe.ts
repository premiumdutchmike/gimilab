'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { partners } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe/client'
import { getPartnerByUserId } from '@/lib/partner/queries'

export async function initiateStripeConnect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/apply/signup')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/apply/signup')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const refreshUrl = `${baseUrl}/partner/onboarding/payout?status=refresh`
  const returnUrl = `${baseUrl}/partner/onboarding/payout?status=connected`

  let connectId = partner.stripeConnectId
  if (!connectId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    connectId = account.id
    await db
      .update(partners)
      .set({ stripeConnectId: connectId, stripeConnectStatus: 'pending', updatedAt: new Date() })
      .where(eq(partners.id, partner.id))
  }

  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  redirect(accountLink.url)
}

export async function skipStripeConnect() {
  redirect('/partner/onboarding/slots')
}
