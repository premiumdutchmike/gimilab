import { db } from '@/lib/db'
import { subscriptionTiers } from '@/lib/db/schema'
import { PricingTierRow } from '@/components/pricing-tier-row'

export const metadata = {
  title: 'Plans — OneGolf',
}

export default async function PricingPage() {
  const tiers = await db.select().from(subscriptionTiers)

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Choose your plan
        </h1>
        <p className="text-white/50 text-center mb-10">
          Book tee times at top courses. Credits refresh monthly.
        </p>

        <div className="flex flex-col gap-3">
          {tiers
            .sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents)
            .map((tier) => (
              <PricingTierRow
                key={tier.id}
                id={tier.id}
                name={tier.name}
                monthlyPriceCents={tier.monthlyPriceCents}
                monthlyCredits={tier.monthlyCredits}
                rolloverMax={tier.rolloverMax}
                isPopular={tier.id === 'core'}
              />
            ))}
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Cancel anytime. Credits roll over each month (up to your tier max).
        </p>
      </div>
    </main>
  )
}
