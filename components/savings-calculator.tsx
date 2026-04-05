'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

// Real Gimmelab plans from CLAUDE.md
type PlanKey = 'casual' | 'core' | 'heavy'
const PLANS: Record<PlanKey, { label: string; monthly: number; credits: number }> = {
  casual: { label: 'Casual', monthly: 99,  credits: 100 },
  core:   { label: 'Core',   monthly: 149, credits: 170 },
  heavy:  { label: 'Heavy',  monthly: 199, credits: 250 },
}
// Average round = 50 credits (reasonable for public/municipal courses)
// and a $135 average rack rate for comparison
const AVG_CREDITS_PER_ROUND = 50
const AVG_RACK_RATE = 135

// GolfNow Premium comparison assumptions
// - $99/yr membership fee
// - Waives ~$6 booking fee per round (the real "savings" lever)
// - Occasional Hot Deals: conservatively ~5% off rack rate averaged across bookings
const GOLFNOW_YEARLY = 99
const GOLFNOW_FEE_WAIVED = 6
const GOLFNOW_HOT_DEAL_PCT = 0.05

const INSTEAD_ITEMS: Array<{ price: number; name: string; suffix: string }> = [
  { price: 55,  name: 'Dozen Pro V1s',      suffix: '$55 / dozen' },
  { price: 8,   name: 'Beers at the turn',  suffix: '$8 each' },
  { price: 5,   name: 'Hot dogs at the turn', suffix: '$5 each' },
  { price: 400, name: 'Brand new drivers',  suffix: '$400 each' },
  { price: 20,  name: 'Golf gloves',        suffix: '$20 each' },
  { price: 35,  name: 'Golf hats',          suffix: '$35 each' },
  { price: 12,  name: 'Range buckets',      suffix: '$12 each' },
  { price: 800, name: 'New iron sets',      suffix: '$800 / set' },
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
  if (savings >= 500)  return "That's a set of new wedges."
  if (savings >  0)    return 'Real money back in your pocket.'
  return 'Break-even — but zero hassle and no booking fees.'
}

export default function SavingsCalculator() {
  const [plan, setPlan] = useState<PlanKey>('core')
  const [rounds, setRounds] = useState<number>(2)

  const maxForPlan = maxRoundsFor(plan)

  // Clamp rounds when plan changes
  function selectPlan(p: PlanKey) {
    setPlan(p)
    const max = maxRoundsFor(p)
    if (rounds > max) setRounds(max)
  }

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
    // GolfNow: rack rate minus fee waivers minus small hot-deal discount, plus membership fee
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

  return (
    <section className="math-section" id="savings">
      <div className="math-eyebrow">The Math</div>
      <h2>Play more. <span className="gold">Spend less.</span></h2>
      <p>See what you&apos;d actually save based on how much you play.</p>

      <div className="math-layout">
        {/* LEFT: controls + instead */}
        <div className="math-left">
          <div className="math-controls">
            <div className="ctrl-group">
              <div className="ctrl-label">Rounds per month</div>
              <div className="ctrl-val-display">
                {rounds}<em>rounds / mo</em>
              </div>
              <input
                type="range"
                className="rounds-slider"
                min={1}
                max={maxForPlan}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
              <div className="ctrl-max-hint">
                Max {maxForPlan} {maxForPlan === 1 ? 'round' : 'rounds'} on {PLANS[plan].label}
                {' '}({PLANS[plan].credits} credits ÷ ~{AVG_CREDITS_PER_ROUND} per round)
              </div>
            </div>
            <div className="ctrl-group">
              <div className="ctrl-label">Your plan</div>
              <div className="plan-pills">
                {(Object.keys(PLANS) as PlanKey[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`plan-pill-btn${plan === p ? ' active' : ''}`}
                    onClick={() => selectPlan(p)}
                  >
                    {PLANS[p].label} — ${PLANS[p].monthly}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="instead-section">
            <div className="instead-header">
              <div className="instead-label">
                Or you could spend it on <em>other things...</em>
              </div>
            </div>
            <div className="instead-grid">
              {INSTEAD_ITEMS.map((item) => {
                const count = savingsYearly > 0 ? Math.floor(savingsYearly / item.price) : 0
                return (
                  <div key={item.name} className="instead-item">
                    <div className="instead-count">{count}</div>
                    <div className="instead-name">{item.name}</div>
                    <div className="instead-price">{item.suffix}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: table + save callout */}
        <div className="math-right">
          <div className="math-card">
            <table className="math-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Line item</th>
                  <th>Rack rate</th>
                  <th>GolfNow Premium</th>
                  <th className="th-gold">gimmelab</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Green fees <span className="td-muted" style={{ fontSize: 11 }}>(avg ${AVG_RACK_RATE}/round)</span></td>
                  <td className="td-muted">{formatUSD(withoutYearly)}</td>
                  <td className="td-muted">{formatUSD(withoutYearly * (1 - GOLFNOW_HOT_DEAL_PCT))}</td>
                  <td className="td-gold">Included</td>
                </tr>
                <tr>
                  <td>Booking fees</td>
                  <td className="td-muted">{formatUSD(roundsPerYear * GOLFNOW_FEE_WAIVED)}</td>
                  <td className="td-muted">Waived</td>
                  <td className="td-gold">$0</td>
                </tr>
                <tr>
                  <td>Membership</td>
                  <td className="td-muted">—</td>
                  <td className="td-muted">{formatUSD(GOLFNOW_YEARLY)} / yr</td>
                  <td className="td-gold">{formatUSD(withYearly)} / yr</td>
                </tr>
                <tr>
                  <td>Pro shop calls</td>
                  <td className="td-muted">Endless</td>
                  <td className="td-muted">Some</td>
                  <td className="td-gold">Zero</td>
                </tr>
                <tr className="total-row">
                  <td>Total yearly spend</td>
                  <td>{formatUSD(withoutYearly + roundsPerYear * GOLFNOW_FEE_WAIVED)}</td>
                  <td>{formatUSD(golfnowYearly)}</td>
                  <td className="td-gold">{formatUSD(withYearly)}</td>
                </tr>
              </tbody>
            </table>
            <div className="math-save">
              <div>
                <div className="save-eyebrow">You save vs. rack rate</div>
                <div className="save-amount">
                  {savingsYearly > 0 ? `${formatUSD(savingsYearly)} / year` : '—'}
                </div>
                <div className="save-sub">
                  {savingsSubtext(savingsYearly)}
                  {' · '}
                  <strong>{formatUSD(savingsYearly - golfnowSavings)}</strong> more than GolfNow Premium
                </div>
              </div>
              <Link href="/signup" className="btn-gold-solid">Start saving today →</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .math-section {
          background: #EDE8DF;
          padding: 96px 56px;
          border-top: 1px solid #DDD7CC;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .math-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 14px;
        }
        .math-section h2 {
          font-size: clamp(36px, 5vw, 60px);
          font-weight: 700;
          letter-spacing: -0.045em;
          color: #131110;
          line-height: 1;
          margin-bottom: 12px;
        }
        .math-section h2 .gold { color: #C4893A; }
        .math-section > p {
          font-size: 15px;
          color: #8A847C;
          margin-bottom: 32px;
        }
        .math-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          align-items: start;
        }

        /* Controls */
        .math-controls {
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
        .ctrl-group { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 200px; }
        .ctrl-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A847C;
        }
        .ctrl-val-display {
          font-size: 22px;
          font-weight: 700;
          color: #131110;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .ctrl-val-display em { font-size: 13px; font-weight: 400; font-style: normal; color: #8A847C; margin-left: 6px; }
        .ctrl-max-hint {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.06em;
          color: #8A847C;
          margin-top: 2px;
        }
        .rounds-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          background: #DDD7CC;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .rounds-slider::-webkit-slider-thumb {
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
        .rounds-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .rounds-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #131110;
          cursor: pointer;
          border: 3px solid #F4F0EA;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .plan-pills {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .plan-pill-btn {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
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
        .plan-pill-btn.active {
          background: #131110;
          color: #EDE8DF;
          border-color: #131110;
        }
        .plan-pill-btn:hover:not(.active) {
          border-color: #4A4540;
          color: #131110;
        }

        /* Instead section */
        .instead-section { margin-top: 8px; }
        .instead-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .instead-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8A847C;
        }
        .instead-label em { color: #C4893A; font-style: normal; }
        .instead-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .instead-item {
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-radius: 10px;
          padding: 16px 16px 14px;
          transition: all 0.18s;
        }
        .instead-item:hover {
          border-color: #C4893A;
          box-shadow: 0 6px 20px rgba(196,137,58,0.12);
          transform: translateY(-2px);
        }
        .instead-count {
          font-size: 22px;
          font-weight: 700;
          color: #131110;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 4px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .instead-name {
          font-size: 12px;
          color: #4A4540;
          line-height: 1.3;
        }
        .instead-price {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #8A847C;
          margin-top: 6px;
          opacity: 0.75;
        }

        /* Right side */
        .math-card {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #DDD7CC;
        }
        .math-table {
          width: 100%;
          border-collapse: collapse;
        }
        .math-table thead tr { background: #131110; }
        .math-table thead th {
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
        .math-table thead th.th-gold { color: #C4893A; }
        .math-table tbody tr {
          border-bottom: 1px solid #DDD7CC;
          background: #F4F0EA;
        }
        .math-table tbody tr:last-child { border-bottom: none; }
        .math-table tbody tr.total-row { background: #fff; }
        .math-table tbody tr.total-row td { font-weight: 700; }
        .math-table td {
          padding: 12px 14px;
          font-size: 12px;
          color: #131110;
        }
        .math-table td:first-child { font-size: 13px; }
        .math-table td.td-muted { color: #8A847C; }
        .math-table td.td-gold { color: #C4893A; font-weight: 600; }

        /* Save callout */
        .math-save {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
          background: #131110;
          padding: 20px 24px;
        }
        .save-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 6px;
        }
        .save-amount {
          font-size: clamp(26px, 3vw, 40px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 6px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .save-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }
        .btn-gold-solid {
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
        .btn-gold-solid:hover { background: #b87a2e; transform: translateY(-1px); }

        @media (max-width: 1024px) {
          .math-layout { grid-template-columns: 1fr; }
          .math-section { padding: 72px 28px; }
          .instead-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .math-section { padding: 56px 20px; }
          .math-controls { flex-direction: column; align-items: stretch; }
          .plan-pills { flex-wrap: wrap; }
          .plan-pill-btn { min-width: 0; }
        }
      `}</style>
    </section>
  )
}
