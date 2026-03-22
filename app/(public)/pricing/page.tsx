import { db } from '@/lib/db'
import { subscriptionTiers } from '@/lib/db/schema'
import type { Metadata } from 'next'
import PricingClient from './pricing-client'

export const metadata: Metadata = {
  title: 'Membership Plans — gimmelab',
  description: 'Choose a plan and start booking tee times with monthly credits. No booking fees. Cancel anytime.',
}

const TIER_ORDER = ['casual', 'core', 'heavy']

const FALLBACK_TIERS = [
  { id: 'casual', name: 'Casual', monthlyPriceCents: 9900, monthlyCredits: 100, rolloverMax: 50, stripePriceId: '' },
  { id: 'core',   name: 'Core',   monthlyPriceCents: 14900, monthlyCredits: 150, rolloverMax: 75, stripePriceId: '' },
  { id: 'heavy',  name: 'Heavy',  monthlyPriceCents: 19900, monthlyCredits: 210, rolloverMax: 105, stripePriceId: '' },
]

export default async function PricingPage() {
  let tiers = FALLBACK_TIERS

  try {
    const rawTiers = await db.select().from(subscriptionTiers)
    if (rawTiers.length > 0) {
      tiers = rawTiers
        .sort((a, b) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id))
        .map(t => ({
          id: t.id,
          name: t.name,
          monthlyPriceCents: t.monthlyPriceCents,
          monthlyCredits: t.monthlyCredits,
          rolloverMax: t.rolloverMax,
          stripePriceId: t.stripePriceId ?? '',
        }))
    }
  } catch {
    // use fallback tiers
  }

  return <PricingClient tiers={tiers} />
}
