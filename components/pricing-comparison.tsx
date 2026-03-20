interface PricingComparisonProps {
  tiers: Array<{ id: string; monthlyCredits: number }>
}

// Column display order is guaranteed by the page (sorted to casual/core/heavy)
const TIER_LABELS: Record<string, string> = {
  casual: 'CASUAL',
  core: 'CORE',
  heavy: 'HEAVY',
}

export function PricingComparison({ tiers }: PricingComparisonProps) {
  return (
    <div>
      {/* Section label bar */}
      <div className="flex items-center justify-between py-3 border-t border-b border-[#1a1a1a]">
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          PLAN COMPARISON
        </span>
        <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#444]">
          03 FEATURES
        </span>
      </div>

      {/* Scrollable table — overflow-x-auto for mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] py-3 border-b border-[#111]">
            <div />
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`text-center text-[10px] font-semibold tracking-[2px] uppercase ${
                  tier.id === 'core' ? 'text-white' : 'text-[#555]'
                }`}
              >
                {TIER_LABELS[tier.id] ?? tier.id.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Monthly Credits row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Monthly Credits
            </div>
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="text-center font-mono text-[14px] text-white"
              >
                {tier.monthlyCredits}
              </div>
            ))}
          </div>

          {/* Booking Fee row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Booking Fee
            </div>
            {tiers.map((tier) => (
              <div key={tier.id} className="text-center font-mono text-[14px] text-white">
                —
              </div>
            ))}
          </div>

          {/* Courses row */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center py-4 border-b border-[#111]">
            <div className="text-[12px] text-[#444] uppercase tracking-[1px]">
              Courses
            </div>
            {tiers.map((tier) => (
              <div key={tier.id} className="text-center font-mono text-[14px] text-white">
                All
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
