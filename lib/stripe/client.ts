import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder_set_env', {
  apiVersion: '2026-02-25.clover',
})

// Subscription tier → Stripe price ID mapping
export const STRIPE_PRICE_IDS = {
  casual: process.env.STRIPE_CASUAL_PRICE_ID!,
  core: process.env.STRIPE_CORE_PRICE_ID!,
  heavy: process.env.STRIPE_HEAVY_PRICE_ID!,
} as const

// Monthly credits per tier
export const TIER_CREDITS = {
  casual: 100,
  core: 150,
  heavy: 210,
} as const

// 1 credit = $1.00. Used for payout calculations.
export const CREDIT_VALUE_CENTS = 100

// Rollover max per tier (50% of monthly allocation)
export const TIER_ROLLOVER_MAX = {
  casual: 50,
  core: 75,
  heavy: 105,
} as const
