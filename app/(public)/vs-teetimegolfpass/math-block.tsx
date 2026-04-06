'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

// ── TTGP Super Pass assumptions (from teetimegolfpass.com — verify before publishing)
const TTGP_SUB_COST = 99.99
const TTGP_DISCOUNT_PCT = 0.2
const TTGP_MAX_ANNUAL_SAVINGS = 500 // hard ceiling regardless of play volume

// ── Gimmelab tiers (from CLAUDE.md + lib pricing)
// Credit economics: 50 credits per round → monthly round caps below.
// Annual billing = 2 months free (10× monthly).
type TierKey = 'casual' | 'core' | 'heavy'
const TIERS: Record<
  TierKey,
  {
    label: string
    monthly: number
    roundsPerMonthCap: number // hard cap on rounds/month from credit allowance
    roundsPerYearCap: number // practical annual cap
  }
> = {
  casual: { label: 'Casual', monthly: 99, roundsPerMonthCap: 2, roundsPerYearCap: 24 },
  core: { label: 'Core', monthly: 149, roundsPerMonthCap: 3, roundsPerYearCap: 36 },
  heavy: { label: 'Heavy', monthly: 199, roundsPerMonthCap: 5, roundsPerYearCap: 60 },
}

function annualPrice(tier: TierKey, billing: 'monthly' | 'annual') {
  const m = TIERS[tier].monthly
  return billing === 'annual' ? m * 10 : m * 12 // 2 months free on annual
}

// Pick the smallest tier whose annual cap covers the golfer's usage.
function recommendTier(rounds: number): TierKey {
  if (rounds <= TIERS.casual.roundsPerYearCap) return 'casual'
  if (rounds <= TIERS.core.roundsPerYearCap) return 'core'
  return 'heavy'
}

function currency(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export default function MathBlock() {
  const params = useSearchParams()
  const [rounds, setRounds] = useState(25)
  const [fee, setFee] = useState(85)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  useEffect(() => {
    const r = params.get('rounds')
    const f = params.get('fee')
    const b = params.get('billing')
    if (r && !isNaN(+r)) setRounds(Math.max(1, Math.min(120, +r)))
    if (f && !isNaN(+f)) setFee(Math.max(10, Math.min(400, +f)))
    if (b === 'monthly' || b === 'annual') setBilling(b)
  }, [params])

  // Debounced analytics — fire ttgp_math_adjusted 600ms after the last change,
  // and skip the initial render so we don't log on mount.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!posthog.__loaded) return
    const t = setTimeout(() => {
      posthog.capture('ttgp_math_adjusted', { rounds, fee, billing })
    }, 600)
    return () => clearTimeout(t)
  }, [rounds, fee, billing])

  const math = useMemo(() => {
    const rackTotal = rounds * fee

    // TTGP: ~20% discount capped at $500, plus sub cost
    const ttgpSavings = Math.min(TTGP_MAX_ANNUAL_SAVINGS, rackTotal * TTGP_DISCOUNT_PCT)
    const ttgpTotal = rackTotal - ttgpSavings + TTGP_SUB_COST
    const ttgpCeilingHit = rackTotal * TTGP_DISCOUNT_PCT >= TTGP_MAX_ANNUAL_SAVINGS

    // Gimmelab: dynamic tier recommendation
    const tier = recommendTier(rounds)
    const gimmelabTotal = annualPrice(tier, billing)
    const gimmelabSavingsVsRack = rackTotal - gimmelabTotal
    const gimmelabVsTtgp = ttgpTotal - gimmelabTotal
    const gimmelabWins = gimmelabVsTtgp > 0

    // Per-round effective cost (sticky framing)
    const effectiveCostPerRound = gimmelabTotal / rounds
    const deltaPerRound = gimmelabVsTtgp / rounds

    // Break-even: monthly rounds at current fee that make tier pay for itself
    const monthlyCost = TIERS[tier].monthly
    const breakEvenRoundsPerMonth = monthlyCost / fee

    return {
      rackTotal,
      ttgpSavings,
      ttgpTotal,
      ttgpCeilingHit,
      tier,
      gimmelabTotal,
      gimmelabSavingsVsRack,
      gimmelabVsTtgp,
      gimmelabWins,
      effectiveCostPerRound,
      deltaPerRound,
      breakEvenRoundsPerMonth,
    }
  }, [rounds, fee, billing])

  const tierMeta = TIERS[math.tier]

  return (
    <div className="vs-math-wrap">
      {/* Billing toggle */}
      <div className="vs-math-billing">
        <div className="vs-math-billing-label">Billing</div>
        <div className="vs-math-billing-toggle" role="tablist" aria-label="Billing period">
          <button
            type="button"
            role="tab"
            aria-selected={billing === 'monthly'}
            className={`vs-math-billing-btn${billing === 'monthly' ? ' is-active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={billing === 'annual'}
            className={`vs-math-billing-btn${billing === 'annual' ? ' is-active' : ''}`}
            onClick={() => setBilling('annual')}
          >
            Annual <span className="vs-math-billing-save">· 2 months free</span>
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="vs-math-inputs">
        <div className="vs-math-input">
          <label className="vs-math-label">Rounds per year</label>
          <div className="vs-math-input-row">
            <input
              type="range"
              min={4}
              max={60}
              value={rounds}
              onChange={(e) => setRounds(+e.target.value)}
              className="vs-math-slider"
              aria-label="Rounds per year"
            />
            <div className="vs-math-value">{rounds}</div>
          </div>
        </div>
        <div className="vs-math-input">
          <label className="vs-math-label">Avg green fee (Philly)</label>
          <div className="vs-math-input-row">
            <input
              type="range"
              min={40}
              max={200}
              step={5}
              value={fee}
              onChange={(e) => setFee(+e.target.value)}
              className="vs-math-slider"
              aria-label="Average green fee"
            />
            <div className="vs-math-value">${fee}</div>
          </div>
        </div>
      </div>

      {/* Three-column result */}
      <div className="vs-math-grid">
        <div className="vs-math-col">
          <div className="vs-math-col-head">Rack rate</div>
          <div className="vs-math-col-sub">Paying full price every round</div>
          <div className="vs-math-col-num">{currency(math.rackTotal)}</div>
          <div className="vs-math-col-foot">
            {rounds} rounds × ${fee}
          </div>
        </div>
        <div className="vs-math-col">
          <div className="vs-math-col-head">Tee Time Golf Pass</div>
          <div className="vs-math-col-sub">Super Pass — static discount, $500 ceiling</div>
          <div className="vs-math-col-num">{currency(math.ttgpTotal)}</div>
          <div className="vs-math-col-foot">
            Saves {currency(math.ttgpSavings)} vs rack
            {math.ttgpCeilingHit && <span className="vs-math-ceiling"> · ceiling hit</span>}
          </div>
        </div>
        <div className={`vs-math-col vs-math-col-win${math.gimmelabWins ? '' : ' is-tied'}`}>
          <div className="vs-math-col-badge">Recommended for you</div>
          <div className="vs-math-col-head">Gimmelab {tierMeta.label}</div>
          <div className="vs-math-col-sub">
            ${tierMeta.monthly}/mo
            {billing === 'annual' ? ' · billed annually' : ''} · fits up to{' '}
            {tierMeta.roundsPerMonthCap} rounds/mo
          </div>
          <div className="vs-math-col-num">{currency(math.gimmelabTotal)}</div>
          <div className="vs-math-col-foot">
            {currency(math.effectiveCostPerRound)}/round all-in
            {math.gimmelabSavingsVsRack > 0 && (
              <> · saves {currency(math.gimmelabSavingsVsRack)} vs rack</>
            )}
          </div>
        </div>
      </div>

      {/* Verdict — reframed as per-round + break-even */}
      <div className="vs-math-verdict">
        {math.gimmelabWins ? (
          <>
            At <strong>{rounds} rounds/year</strong> in Philly, Gimmelab{' '}
            {tierMeta.label} pays for itself in{' '}
            <strong>
              {math.breakEvenRoundsPerMonth < 1
                ? 'under a round'
                : `${math.breakEvenRoundsPerMonth.toFixed(1)} rounds`}
            </strong>{' '}
            per month — and saves <strong>{currency(math.deltaPerRound)}</strong> on every round
            vs TTGP Super Pass.
            {math.ttgpCeilingHit && (
              <>
                {' '}
                <span className="vs-math-verdict-ceiling">
                  TTGP is capped at $500 savings; Gimmelab keeps scaling.
                </span>
              </>
            )}
          </>
        ) : (
          <>
            At <strong>{rounds} rounds/year</strong>, TTGP is{' '}
            <strong>{currency(Math.abs(math.gimmelabVsTtgp))}</strong>{' '}cheaper — but you&apos;d pay
            a booking fee every round and hit the $500 savings ceiling the moment you play more.
            Gimmelab {tierMeta.label} pulls ahead from{' '}
            <strong>
              ~{Math.ceil((math.gimmelabTotal - TTGP_SUB_COST) / (fee * (1 - TTGP_DISCOUNT_PCT)))}{' '}
              rounds
            </strong>
            .
          </>
        )}
      </div>

      {/* Component-scoped styles for new elements (billing toggle, tier badge, ceiling phrase) */}
      <style>{`
        .vs-math-billing {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .vs-math-billing-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-stone);
        }
        .vs-math-billing-toggle {
          display: inline-flex;
          border: 1px solid rgba(0,0,0,0.12);
          background: #fff;
        }
        .vs-math-billing-btn {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 10px 18px;
          background: transparent;
          border: 0;
          color: var(--vs-stone);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .vs-math-billing-btn + .vs-math-billing-btn {
          border-left: 1px solid rgba(0,0,0,0.12);
        }
        .vs-math-billing-btn:hover:not(.is-active) {
          color: var(--vs-midnight);
        }
        .vs-math-billing-btn.is-active {
          background: var(--vs-midnight);
          color: var(--vs-linen);
        }
        .vs-math-billing-save {
          display: inline;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--vs-amber);
          margin-left: 4px;
        }
        .vs-math-billing-btn.is-active .vs-math-billing-save {
          color: var(--vs-amber);
        }

        .vs-math-col-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--vs-amber);
          background: rgba(191,123,46,0.12);
          padding: 5px 10px;
          margin-bottom: 14px;
          border: 1px solid rgba(191,123,46,0.35);
        }
        .vs-math-col-win.is-tied .vs-math-col-badge {
          color: rgba(244,238,227,0.85);
          background: rgba(244,238,227,0.08);
          border-color: rgba(244,238,227,0.22);
        }
        .vs-math-verdict-ceiling {
          display: inline;
          color: var(--vs-amber);
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .vs-math-billing {
            justify-content: space-between;
          }
          .vs-math-billing-btn {
            padding: 10px 14px;
          }
          .vs-math-billing-save {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
