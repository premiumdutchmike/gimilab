'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

// ── Math constants — duplicated from components/savings-calculator.tsx ──
// Intentionally NOT imported so the two calculators can drift independently
// if the vs-golfnow landing page ever needs its own assumptions.
type PlanKey = 'casual' | 'core' | 'heavy'
const PLANS: Record<PlanKey, { label: string; monthly: number; credits: number }> = {
  casual: { label: 'Casual', monthly: 99, credits: 100 },
  core: { label: 'Core', monthly: 149, credits: 170 },
  heavy: { label: 'Heavy', monthly: 199, credits: 250 },
}
// Philly metro public/daily-fee benchmark — matches homepage SavingsCalculator
const AVG_CREDITS_PER_ROUND = 50
const AVG_RACK_RATE = 100

// GolfNow Premium comparison assumptions
const GOLFNOW_YEARLY = 99
const GOLFNOW_FEE_WAIVED = 6
const GOLFNOW_HOT_DEAL_PCT = 0.05

const INSTEAD_ITEMS: Array<{ price: number; name: string; suffix: string }> = [
  { price: 55, name: 'Dozen Pro V1s', suffix: '$55 / dozen' },
  { price: 8, name: 'Beers at the turn', suffix: '$8 each' },
  { price: 5, name: 'Hot dogs at the turn', suffix: '$5 each' },
  { price: 400, name: 'Brand new drivers', suffix: '$400 each' },
  { price: 20, name: 'Golf gloves', suffix: '$20 each' },
  { price: 35, name: 'Golf hats', suffix: '$35 each' },
  { price: 12, name: 'Range buckets', suffix: '$12 each' },
  { price: 800, name: 'New iron sets', suffix: '$800 / set' },
]

function maxRoundsFor(plan: PlanKey) {
  return Math.floor(PLANS[plan].credits / AVG_CREDITS_PER_ROUND)
}

function formatUSD(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function savingsSubtext(savings: number) {
  if (savings >= 1500) return "That's a new driver. New irons. Both."
  if (savings >= 1000) return "That's a new driver plus lessons."
  if (savings >= 500) return "That's a set of new wedges."
  if (savings > 0) return 'Real money back in your pocket.'
  return 'Break-even — but zero hassle and no booking fees.'
}

function isPlanKey(v: string | null): v is PlanKey {
  return v === 'casual' || v === 'core' || v === 'heavy'
}

export default function VsGolfnowCalculator() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize from URL (with defaults + clamping)
  const initialPlan: PlanKey = (() => {
    const p = searchParams.get('plan')
    return isPlanKey(p) ? p : 'core'
  })()
  const initialRounds: number = (() => {
    const r = Number(searchParams.get('rounds'))
    const max = maxRoundsFor(initialPlan)
    if (!Number.isFinite(r) || r < 1) return 3 > max ? max : 3
    return Math.max(1, Math.min(max, Math.floor(r)))
  })()

  const [plan, setPlan] = useState<PlanKey>(initialPlan)
  const [rounds, setRounds] = useState<number>(initialRounds)
  const [copied, setCopied] = useState(false)

  const maxForPlan = maxRoundsFor(plan)

  // Sync state → URL (replace, not push)
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('rounds', String(rounds))
    params.set('plan', plan)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [plan, rounds, router])

  const selectPlan = useCallback((p: PlanKey) => {
    setPlan(p)
    const max = maxRoundsFor(p)
    setRounds((r) => (r > max ? max : r))
  }, [])

  const {
    roundsPerYear,
    withoutYearly,
    golfnowYearly,
    withYearly,
    savingsYearly,
    golfnowSavings,
  } = useMemo(() => {
    const rpy = rounds * 12
    const without = rpy * AVG_RACK_RATE
    const withG = PLANS[plan].monthly * 12
    const gnFeesWaived = rpy * GOLFNOW_FEE_WAIVED
    const gnHotDeals = without * GOLFNOW_HOT_DEAL_PCT
    const golfnow = without + GOLFNOW_YEARLY - gnFeesWaived - gnHotDeals
    return {
      roundsPerYear: rpy,
      withoutYearly: without,
      golfnowYearly: golfnow,
      withYearly: withG,
      savingsYearly: without - withG,
      golfnowSavings: without - golfnow,
    }
  }, [plan, rounds])

  const handleCopy = useCallback(() => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const reset = () => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(reset).catch(reset)
    } else {
      reset()
    }
  }, [])

  return (
    <section className="vgn-math-section" id="calculator">
      <div className="vgn-math-eyebrow">Your numbers</div>
      <h2>
        Drag the slider. <span className="gold">Watch the gap.</span>
      </h2>
      <p>Reads straight from public-rate golf. Share the link and the next golfer sees the same math.</p>

      <div className="vgn-math-layout">
        {/* LEFT: controls + instead */}
        <div className="vgn-math-left">
          <div className="vgn-math-controls">
            <div className="vgn-ctrl-group">
              <div className="vgn-ctrl-label">Rounds per month</div>
              <div className="vgn-ctrl-val-display">
                {rounds}
                <em>rounds / mo</em>
              </div>
              <input
                type="range"
                className="vgn-rounds-slider"
                min={1}
                max={maxForPlan}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
              <div className="vgn-ctrl-max-hint">
                Max {maxForPlan} {maxForPlan === 1 ? 'round' : 'rounds'} on {PLANS[plan].label}
                {' '}({PLANS[plan].credits} credits ÷ ~{AVG_CREDITS_PER_ROUND} per round)
              </div>
            </div>
            <div className="vgn-ctrl-group">
              <div className="vgn-ctrl-label">Your plan</div>
              <div className="vgn-plan-pills">
                {(Object.keys(PLANS) as PlanKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`vgn-plan-pill-btn${plan === p ? ' active' : ''}`}
                    onClick={() => selectPlan(p)}
                  >
                    {PLANS[p].label} — ${PLANS[p].monthly}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="vgn-instead-section">
            <div className="vgn-instead-header">
              <div className="vgn-instead-label">
                Or you could spend it on <em>other things...</em>
              </div>
            </div>
            <div className="vgn-instead-grid">
              {INSTEAD_ITEMS.map((item) => {
                const count = savingsYearly > 0 ? Math.floor(savingsYearly / item.price) : 0
                return (
                  <div key={item.name} className="vgn-instead-item">
                    <div className="vgn-instead-count">{count}</div>
                    <div className="vgn-instead-name">{item.name}</div>
                    <div className="vgn-instead-price">{item.suffix}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: table + save callout + share */}
        <div className="vgn-math-right">
          <div className="vgn-math-card">
            <table className="vgn-math-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Line item</th>
                  <th>Rack rate</th>
                  <th>GolfNow Premium</th>
                  <th className="vgn-th-gold">gimmelab</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Green fees{' '}
                    <span className="vgn-td-muted" style={{ fontSize: 11 }}>
                      (avg ${AVG_RACK_RATE}/round)
                    </span>
                  </td>
                  <td className="vgn-td-muted">{formatUSD(withoutYearly)}</td>
                  <td className="vgn-td-muted">{formatUSD(withoutYearly * (1 - GOLFNOW_HOT_DEAL_PCT))}</td>
                  <td className="vgn-td-gold">Included</td>
                </tr>
                <tr>
                  <td>Booking fees</td>
                  <td className="vgn-td-muted">{formatUSD(roundsPerYear * GOLFNOW_FEE_WAIVED)}</td>
                  <td className="vgn-td-muted">Waived</td>
                  <td className="vgn-td-gold">$0</td>
                </tr>
                <tr>
                  <td>Membership</td>
                  <td className="vgn-td-muted">—</td>
                  <td className="vgn-td-muted">{formatUSD(GOLFNOW_YEARLY)} / yr</td>
                  <td className="vgn-td-gold">{formatUSD(withYearly)} / yr</td>
                </tr>
                <tr>
                  <td>Pro shop calls</td>
                  <td className="vgn-td-muted">Endless</td>
                  <td className="vgn-td-muted">Some</td>
                  <td className="vgn-td-gold">Zero</td>
                </tr>
                <tr className="vgn-total-row">
                  <td>Total yearly spend</td>
                  <td>{formatUSD(withoutYearly + roundsPerYear * GOLFNOW_FEE_WAIVED)}</td>
                  <td>{formatUSD(golfnowYearly)}</td>
                  <td className="vgn-td-gold">{formatUSD(withYearly)}</td>
                </tr>
              </tbody>
            </table>
            <div className="vgn-math-save">
              <div>
                <div className="vgn-save-eyebrow">You save vs. rack rate</div>
                <div className="vgn-save-amount">
                  {savingsYearly > 0 ? `${formatUSD(savingsYearly)} / year` : '—'}
                </div>
                <div className="vgn-save-sub">
                  {savingsSubtext(savingsYearly)}
                  {' · '}
                  <strong>{formatUSD(savingsYearly - golfnowSavings)}</strong> more than GolfNow Premium
                </div>
              </div>
              <Link href="/waitlist" className="vgn-btn-gold-solid">
                Start saving today →
              </Link>
            </div>
          </div>

          <div className="vgn-share-row">
            <button type="button" className="vgn-btn-share" onClick={handleCopy} aria-live="polite">
              {copied ? 'Copied ✓' : 'Copy share link'}
            </button>
            <div className="vgn-share-hint">
              Send your exact numbers to a buddy. They&apos;ll land on the same math.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .vgn-math-section {
          background: #EDE8DF;
          padding: 96px 56px;
          border-top: 1px solid #DDD7CC;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .vgn-math-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 14px;
        }
        .vgn-math-section h2 {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 700;
          letter-spacing: -0.045em;
          color: #131110;
          line-height: 1;
          margin-bottom: 12px;
        }
        .vgn-math-section h2 .gold { color: #C4893A; }
        .vgn-math-section > p {
          font-size: 15px;
          color: #8A847C;
          margin-bottom: 32px;
        }
        .vgn-math-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          align-items: start;
        }

        /* Controls */
        .vgn-math-controls {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-radius: 12px;
        }
        .vgn-ctrl-group { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 200px; }
        .vgn-ctrl-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A847C;
        }
        .vgn-ctrl-val-display {
          font-size: 22px;
          font-weight: 700;
          color: #131110;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .vgn-ctrl-val-display em { font-size: 13px; font-weight: 400; font-style: normal; color: #8A847C; margin-left: 6px; }
        .vgn-ctrl-max-hint {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.06em;
          color: #8A847C;
          margin-top: 2px;
        }
        .vgn-rounds-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          background: #DDD7CC;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .vgn-rounds-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #131110;
          cursor: pointer;
          border: 3px solid #F4F0EA;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.15s;
        }
        .vgn-rounds-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .vgn-rounds-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #131110;
          cursor: pointer;
          border: 3px solid #F4F0EA;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .vgn-plan-pills {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .vgn-plan-pill-btn {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 9px 14px;
          border-radius: 7px;
          border: 1px solid #DDD7CC;
          background: transparent;
          color: #4A4540;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
          flex: 1;
          text-align: center;
        }
        .vgn-plan-pill-btn.active {
          background: #131110;
          color: #EDE8DF;
          border-color: #131110;
        }
        .vgn-plan-pill-btn:hover:not(.active) {
          border-color: #4A4540;
          color: #131110;
        }

        /* Instead section */
        .vgn-instead-section { margin-top: 8px; }
        .vgn-instead-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .vgn-instead-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A847C;
        }
        .vgn-instead-label em { color: #C4893A; font-style: normal; }
        .vgn-instead-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .vgn-instead-item {
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-radius: 10px;
          padding: 16px 16px 14px;
          transition: all 0.18s;
        }
        .vgn-instead-item:hover {
          border-color: #C4893A;
          box-shadow: 0 6px 20px rgba(196,137,58,0.12);
          transform: translateY(-2px);
        }
        .vgn-instead-count {
          font-size: 22px;
          font-weight: 700;
          color: #131110;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 4px;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .vgn-instead-name {
          font-size: 12px;
          color: #4A4540;
          line-height: 1.3;
        }
        .vgn-instead-price {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #8A847C;
          margin-top: 6px;
          opacity: 0.75;
        }

        /* Right side */
        .vgn-math-card {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #DDD7CC;
        }
        .vgn-math-table {
          width: 100%;
          border-collapse: collapse;
        }
        .vgn-math-table thead tr { background: #131110; }
        .vgn-math-table thead th {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          padding: 12px 14px;
          text-align: left;
          font-weight: 400;
          white-space: nowrap;
        }
        .vgn-math-table thead th.vgn-th-gold { color: #C4893A; }
        .vgn-math-table tbody tr {
          border-bottom: 1px solid #DDD7CC;
          background: #F4F0EA;
        }
        .vgn-math-table tbody tr:last-child { border-bottom: none; }
        .vgn-math-table tbody tr.vgn-total-row { background: #fff; }
        .vgn-math-table tbody tr.vgn-total-row td { font-weight: 700; }
        .vgn-math-table td {
          padding: 12px 14px;
          font-size: 12px;
          color: #131110;
        }
        .vgn-math-table td:first-child { font-size: 13px; }
        .vgn-math-table td.vgn-td-muted { color: #8A847C; }
        .vgn-math-table td.vgn-td-gold { color: #C4893A; font-weight: 600; }

        /* Save callout */
        .vgn-math-save {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
          background: #131110;
          padding: 20px 24px;
        }
        .vgn-save-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 6px;
        }
        .vgn-save-amount {
          font-size: clamp(26px, 3vw, 40px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 6px;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .vgn-save-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }
        .vgn-btn-gold-solid {
          background: #C4893A;
          color: #fff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 7px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: background 0.18s, transform 0.12s;
        }
        .vgn-btn-gold-solid:hover { background: #b87a2e; transform: translateY(-1px); }

        /* Share row */
        .vgn-share-row {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }
        .vgn-btn-share {
          background: #C4893A;
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 7px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: var(--font-inter), 'Inter', sans-serif;
          transition: background 0.18s, transform 0.12s;
          min-width: 200px;
        }
        .vgn-btn-share:hover { background: #b87a2e; transform: translateY(-1px); }
        .vgn-share-hint {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #8A847C;
        }

        @media (max-width: 1024px) {
          .vgn-math-layout { grid-template-columns: 1fr; }
          .vgn-math-section { padding: 72px 28px; }
          .vgn-instead-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .vgn-math-section { padding: 56px 20px; }
          .vgn-math-controls { flex-direction: column; align-items: stretch; }
          .vgn-plan-pills { flex-wrap: wrap; }
          .vgn-plan-pill-btn { min-width: 0; }
        }
      `}</style>
    </section>
  )
}
