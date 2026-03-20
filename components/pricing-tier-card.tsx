import Link from 'next/link'

interface PricingTierCardProps {
  id: string               // 'casual' | 'core' | 'heavy'
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  featured?: boolean       // hard-coded as `tier.id === 'core'` in the page — no DB column
}

/** Exported for unit testing. Converts cents to integer dollar display. */
export function formatPrice(cents: number): string {
  return `$${Math.floor(cents / 100)} / MO`
}

export function PricingTierCard({
  id,
  name,
  monthlyPriceCents,
  monthlyCredits,
  featured,
}: PricingTierCardProps) {
  return (
    <div
      className={
        featured
          ? 'border border-white'
          : 'border border-[#222] -mt-px first:mt-0'
      }
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          {name}
        </span>
        {featured && (
          <span className="text-[10px] font-semibold tracking-[2px] uppercase text-white">
            RECOMMENDED
          </span>
        )}
      </div>

      {/* Body row */}
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <div className="font-mono text-[64px] font-normal text-white leading-none">
            {monthlyCredits}
          </div>
          <div className="text-[11px] text-[#444] uppercase tracking-[2px] mt-1">
            credits / month
          </div>
        </div>
        <div className="text-[36px] font-black text-white">
          {formatPrice(monthlyPriceCents)}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex justify-end px-6 py-4 border-t border-[#222]">
        <Link
          href={`/signup?plan=${id}`}
          className={
            featured
              ? 'bg-white text-black text-[11px] font-semibold tracking-[2px] uppercase px-7 py-2.5 transition-colors hover:bg-[#e5e5e5]'
              : 'border border-[#444] text-white text-[11px] font-semibold tracking-[2px] uppercase px-7 py-2.5 transition-colors hover:border-white'
          }
        >
          JOIN {name.toUpperCase()} →
        </Link>
      </div>
    </div>
  )
}
