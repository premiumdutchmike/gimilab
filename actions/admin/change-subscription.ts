// actions/admin/change-subscription.ts
'use server'
import Stripe from 'stripe'
import { requireAdmin } from './require-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

const TIER_PRICE: Record<string, string> = {
  casual: process.env.STRIPE_CASUAL_PRICE_ID!,
  core:   process.env.STRIPE_CORE_PRICE_ID!,
  heavy:  process.env.STRIPE_HEAVY_PRICE_ID!,
}

export async function changeSubscriptionTier(
  stripeSubscriptionId: string,
  newTier: 'casual' | 'core' | 'heavy'
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const priceId = TIER_PRICE[newTier]
    if (!priceId) return { error: 'Invalid tier' }
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    const itemId = sub.items.data[0]?.id
    if (!itemId) return { error: 'Subscription item not found' }
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'always_invoice',
    })
    // DB sync happens via existing webhook (customer.subscription.updated → invoice.paid)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Stripe update failed' }
  }
}

export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    await stripe.subscriptions.cancel(stripeSubscriptionId)
    // DB sync via webhook (customer.subscription.deleted)
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Cancel failed' }
  }
}
