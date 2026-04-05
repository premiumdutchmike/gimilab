'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

// TTGP Super Pass assumptions (from teetimegolfpass.com — verify before publishing)
const TTGP_SUB_COST = 99.99
const TTGP_MAX_ANNUAL_SAVINGS = 500 // ceiling regardless of play volume

// Gimmelab Core — from CLAUDE.md pricing
const GIMMELAB_CORE_ANNUAL = 149 * 12 // $1,788 — all-in, no per-round fees

function currency(n: number) {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

export default function MathBlock() {
  const params = useSearchParams()
  const [rounds, setRounds] = useState(36)
  const [fee, setFee] = useState(100)

  useEffect(() => {
    const r = params.get('rounds')
    const f = params.get('fee')
    if (r && !isNaN(+r)) setRounds(Math.max(1, Math.min(120, +r)))
    if (f && !isNaN(+f)) setFee(Math.max(10, Math.min(400, +f)))
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
      posthog.capture('ttgp_math_adjusted', { rounds, fee })
    }, 600)
    return () => clearTimeout(t)
  }, [rounds, fee])

  const rackTotal = rounds * fee

  // TTGP: saves min(max-ceiling, ~20% of rack) + sub cost added back
  const ttgpSavings = Math.min(TTGP_MAX_ANNUAL_SAVINGS, rackTotal * 0.2)
  const ttgpTotal = rackTotal - ttgpSavings + TTGP_SUB_COST

  // Gimmelab Core: flat annual — no per-round fee
  const gimmelabTotal = GIMMELAB_CORE_ANNUAL
  const gimmelabSavingsVsRack = rackTotal - gimmelabTotal
  const gimmelabVsTtgp = ttgpTotal - gimmelabTotal

  const gimmelabWins = gimmelabVsTtgp > 0

  return (
    <div className="vs-math-wrap">
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
          <div className="vs-math-col-num">{currency(rackTotal)}</div>
          <div className="vs-math-col-foot">
            {rounds} rounds × ${fee}
          </div>
        </div>
        <div className="vs-math-col">
          <div className="vs-math-col-head">Tee Time Golf Pass</div>
          <div className="vs-math-col-sub">Super Pass — static discount, $500 ceiling</div>
          <div className="vs-math-col-num">{currency(ttgpTotal)}</div>
          <div className="vs-math-col-foot">
            Saves {currency(ttgpSavings)} vs rack
            {ttgpSavings >= TTGP_MAX_ANNUAL_SAVINGS && (
              <span className="vs-math-ceiling"> · ceiling hit</span>
            )}
          </div>
        </div>
        <div className="vs-math-col vs-math-col-win">
          <div className="vs-math-col-head">Gimmelab Core</div>
          <div className="vs-math-col-sub">$149/mo — scales with how much you play</div>
          <div className="vs-math-col-num">{currency(gimmelabTotal)}</div>
          <div className="vs-math-col-foot">
            {gimmelabSavingsVsRack > 0
              ? `Saves ${currency(gimmelabSavingsVsRack)} vs rack`
              : `Costs ${currency(-gimmelabSavingsVsRack)} more than rack`}
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="vs-math-verdict">
        {gimmelabWins ? (
          <>
            At <strong>{rounds} rounds/year</strong> in Philly, Gimmelab Core costs{' '}
            <strong>{currency(Math.abs(gimmelabVsTtgp))}</strong> less than TTGP Super Pass.
          </>
        ) : (
          <>
            At <strong>{rounds} rounds/year</strong>, TTGP Super Pass is{' '}
            <strong>{currency(Math.abs(gimmelabVsTtgp))}</strong> cheaper. Gimmelab wins once you
            play ~{Math.ceil((GIMMELAB_CORE_ANNUAL + TTGP_MAX_ANNUAL_SAVINGS - TTGP_SUB_COST) / fee)}{' '}
            rounds or more.
          </>
        )}
      </div>
    </div>
  )
}
