import Link from 'next/link'
import { db } from '@/lib/db'
import { subscriptionTiers } from '@/lib/db/schema'
import { PricingTierCard } from '@/components/pricing-tier-card'
import { PricingComparison } from '@/components/pricing-comparison'

export const metadata = {
  title: 'Plans — OneGolf',
}

const TIER_ORDER = ['casual', 'core', 'heavy']

export default async function PricingPage() {
  const rawTiers = await db.select().from(subscriptionTiers)

  // Sort to canonical order; discard DB fields not needed by components
  const tiers = rawTiers
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id)
    )
    .map(({ id, name, monthlyPriceCents, monthlyCredits }) => ({
      id,
      name,
      monthlyPriceCents,
      monthlyCredits,
    }))

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-[860px] mx-auto px-6">

        {/* Section label bar */}
        <div className="flex items-center justify-between py-3 border-t border-b border-[#1a1a1a]">
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
            MEMBERSHIP PLANS
          </span>
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
            03 TIERS
          </span>
        </div>

        {/* Page headline */}
        <div className="pt-12 pb-8">
          <h1
            className="font-black uppercase leading-none text-white"
            style={{
              fontSize: 'clamp(56px, 10vw, 96px)',
              letterSpacing: '-2px',
            }}
          >
            CHOOSE
            <br />
            YOUR PLAN
          </h1>
          <p className="text-[11px] text-[#444] uppercase tracking-[2px] mt-3">
            Credits refresh monthly · Any partner course · Zero booking fees
          </p>
        </div>

        {/* Tier blocks */}
        {tiers.length === 0 ? (
          <p className="text-[13px] text-[#444] text-center py-12">
            Plans unavailable. Please try again later.
          </p>
        ) : (
          <div>
            {tiers.map((tier) => (
              <PricingTierCard
                key={tier.id}
                id={tier.id}
                name={tier.name}
                monthlyPriceCents={tier.monthlyPriceCents}
                monthlyCredits={tier.monthlyCredits}
                featured={tier.id === 'core'}
              />
            ))}
          </div>
        )}

        {/* Feature comparison — only renders when tiers exist */}
        {tiers.length > 0 && (
          <div className="mt-12">
            <PricingComparison
              tiers={tiers.map(({ id, monthlyCredits }) => ({
                id,
                monthlyCredits,
              }))}
            />
          </div>
        )}

        {/* Footer reassurance */}
        <div className="flex items-center justify-between py-8 border-t border-[#1a1a1a]">
          <span className="text-[11px] text-[#333] uppercase tracking-[1px]">
            Cancel anytime · No contracts · Credits refresh monthly
          </span>
          <Link
            href="/"
            className="text-[11px] text-[#444] uppercase tracking-[1px] transition-colors hover:text-white"
          >
            ← BACK TO HOME
          </Link>
        </div>

      </div>
    </main>
  )
}
