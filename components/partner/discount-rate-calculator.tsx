'use client'
import { useState, useTransition } from 'react'

const TIERS = [
  { label: 'Starter', min: 10, max: 19.99, keep: 0.85, commission: 0.15 },
  { label: 'Plus',    min: 20, max: 29.99, keep: 0.87, commission: 0.13 },
  { label: 'Pro',     min: 30, max: 999,   keep: 0.90, commission: 0.10 },
] as const

const PLANS = [
  { name: 'Casual', credits: 100 },
  { name: 'Core',   credits: 170 },
  { name: 'Heavy',  credits: 250 },
]

type SaveFn = (prev: unknown, fd: FormData) => Promise<{ error?: string } | void>

export function DiscountRateCalculator({
  courseId,
  onSave,
  initialRackRate = '',
  initialGimmelabRate = '',
}: {
  courseId: string
  onSave: SaveFn
  initialRackRate?: string
  initialGimmelabRate?: string
}) {
  const [rackStr, setRackStr] = useState(initialRackRate)
  const [gimmelabStr, setGimmelabStr] = useState(initialGimmelabRate)
  const [serverError, setServerError] = useState('')
  const [pending, startTransition] = useTransition()

  const rack = parseFloat(rackStr) || 0
  const gimmelab = parseFloat(gimmelabStr) || 0
  const hasValues = rack > 0 && gimmelab > 0
  const discountPct = hasValues ? ((rack - gimmelab) / rack) * 100 : 0
  const isValid = discountPct >= 10
  const isAboveCap = gimmelab > 150

  const activeTier = hasValues && isValid
    ? [...TIERS].reverse().find(t => discountPct >= t.min) ?? null
    : null
  const keepPct = activeTier?.keep ?? 0.85
  const progressWidth = Math.min((discountPct / 40) * 100, 100)
  const nextTier = TIERS.find(t => discountPct < t.min)

  const statusText = !hasValues
    ? ''
    : !isValid
    ? `⚠ Minimum 10% discount required. Current: ${discountPct.toFixed(1)}%`
    : activeTier
    ? nextTier
      ? `✓ ${activeTier.label} tier unlocked. Offer ${nextTier.min}%+ off to unlock ${nextTier.label} (keep ${Math.round(nextTier.keep * 100)}%).`
      : '✓ Pro tier unlocked — maximum payout rate.'
    : ''

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setServerError('')
    const fd = new FormData()
    fd.append('courseId', courseId)
    fd.append('rackRateCents', String(Math.round(rack * 100)))
    fd.append('gimmelabRateCents', String(Math.round(gimmelab * 100)))
    startTransition(async () => {
      const result = await onSave(null, fd)
      if (result && 'error' in result && result.error) setServerError(result.error)
    })
  }

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#847C72' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Tier cards */}
      <div>
        <p style={{ ...lbl, letterSpacing: '0.1em', marginBottom: 12 }}>Your Commission Tier</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {TIERS.map(tier => {
            const unlocked = discountPct >= tier.min
            const isActive = activeTier?.label === tier.label
            return (
              <div key={tier.label} style={{
                border: isActive ? '1.5px solid #BF7B2E' : '1px solid #D8D1C6',
                borderRadius: 2,
                padding: 16,
                background: isActive ? 'rgba(191,123,46,0.05)' : '#fff',
                opacity: unlocked ? 1 : 0.4,
                transition: 'all 0.25s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0C0C0B' }}>{tier.label}</span>
                  <span>{unlocked ? '✓' : '🔒'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#847C72', marginBottom: 8 }}>
                  {tier.label === 'Pro' ? '30%+ off rack' : `${tier.min}–${Math.floor(tier.max)}% off rack`}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C0B' }}>Keep {Math.round(tier.keep * 100)}%</div>
                <div style={{ fontSize: 11, color: '#847C72' }}>Gimmelab: {Math.round(tier.commission * 100)}%</div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, height: 6, background: '#E5DDD3', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressWidth}%`, background: '#BF7B2E', transition: 'width 0.3s ease' }} />
        </div>
        {statusText && (
          <p style={{ fontSize: 12, color: isValid ? '#2E6B38' : '#847C72', marginTop: 6 }}>{statusText}</p>
        )}
      </div>

      {/* Rate inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={lbl}>Your standard walk-up rate</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D8D1C6', borderRadius: 2, background: '#fff' }}>
            <span style={{ padding: '12px 8px 12px 14px', color: '#847C72', fontWeight: 600 }}>$</span>
            <input
              type="number" min={0} value={rackStr}
              onChange={e => setRackStr(e.target.value)}
              placeholder="85"
              style={{ border: 'none', outline: 'none', background: 'transparent', color: '#0C0C0B', fontSize: 15, padding: '12px 14px 12px 0', width: '100%' }}
            />
          </div>
          <p style={{ fontSize: 11, color: '#847C72' }}>What a walk-in pays at your course.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={lbl}>Your Gimmelab rate</label>
            {hasValues && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2,
                background: isValid ? 'rgba(46,107,56,0.1)' : 'rgba(191,123,46,0.1)',
                color: isValid ? '#2E6B38' : '#BF7B2E',
              }}>
                {discountPct.toFixed(0)}% off{isValid ? ' ✓' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${hasValues && !isValid ? 'rgba(200,60,60,0.5)' : '#D8D1C6'}`, borderRadius: 2, background: '#fff' }}>
            <span style={{ padding: '12px 8px 12px 14px', color: '#847C72', fontWeight: 600 }}>$</span>
            <input
              type="number" min={0} value={gimmelabStr}
              onChange={e => setGimmelabStr(e.target.value)}
              placeholder="60"
              style={{ border: 'none', outline: 'none', background: 'transparent', color: '#0C0C0B', fontSize: 15, padding: '12px 14px 12px 0', width: '100%' }}
            />
          </div>
          {rack > 0 && (
            <p style={{ fontSize: 11, color: '#847C72' }}>Minimum: ${(rack * 0.9).toFixed(0)} (10% off ${rack})</p>
          )}
        </div>
      </div>

      {/* Validation banners */}
      {hasValues && !isValid && (
        <div style={{ background: 'rgba(180,50,50,0.08)', border: '1px solid rgba(180,50,50,0.3)', borderRadius: 2, padding: '12px 16px', color: '#b43232', fontSize: 12 }}>
          ⚠ Your Gimmelab rate must be at least 10% below your walk-up rate. Members need to see a real saving.
        </div>
      )}
      {isAboveCap && (
        <div style={{ background: 'rgba(191,123,46,0.08)', border: '1px solid rgba(191,123,46,0.3)', borderRadius: 2, padding: '12px 16px', color: '#BF7B2E', fontSize: 12 }}>
          Rate above $150 will be reviewed before going live.
        </div>
      )}

      {/* Live preview card */}
      {hasValues && isValid && (
        <div style={{ background: '#F4EEE3', borderTop: '2px solid #BF7B2E', borderRadius: 2, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
            <div>
              <p style={{ ...lbl, marginBottom: 6 }}>Credits charged to member</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#BF7B2E', letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.round(gimmelab)}</p>
              <p style={{ fontSize: 11, color: '#2E6B38', marginTop: 6 }}>Member saves ${(rack - gimmelab).toFixed(0)} vs walk-up</p>
            </div>
            <div>
              <p style={{ ...lbl, marginBottom: 6 }}>You earn per booking</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#0C0C0B', letterSpacing: '-0.04em', lineHeight: 1 }}>${(gimmelab * keepPct).toFixed(2)}</p>
              <p style={{ fontSize: 11, color: '#847C72', marginTop: 6 }}>after {Math.round((1 - keepPct) * 100)}% commission</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D8D1C6', paddingTop: 16, marginBottom: 16 }}>
            <p style={{ ...lbl, marginBottom: 10 }}>Who Can Book</p>
            {PLANS.map(plan => (
              <div key={plan.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 12, color: '#847C72' }}>{plan.name} ({plan.credits} credits/mo)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0C0C0B' }}>~{Math.max(1, Math.floor(plan.credits / Math.max(1, gimmelab)))} rounds</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #D8D1C6', paddingTop: 16 }}>
            <p style={{ ...lbl, marginBottom: 10, color: '#BF7B2E' }}>Earnings Estimate @ {Math.round(keepPct * 100)}% payout</p>
            {[20, 50, 100].map(vol => (
              <div key={vol} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 12, color: '#847C72' }}>At {vol} bookings/mo</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0C0C0B' }}>${Math.round(vol * gimmelab * keepPct).toLocaleString()} / month</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: '#847C72' }}>You can update your rate anytime. Commission tier recalculates automatically.</p>
      {serverError && <p style={{ fontSize: 12, color: '#b43232' }}>{serverError}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
        <a href="/partner/onboarding/course" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '13px 20px', border: '1px solid #D8D1C6', borderRadius: 2, color: '#847C72', textDecoration: 'none' }}>
          ← Back
        </a>
        <button
          type="submit"
          disabled={!isValid || pending}
          style={{
            background: isValid && !pending ? '#BF7B2E' : '#D8D1C6',
            color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            padding: '14px 28px', border: 'none', borderRadius: 2,
            cursor: isValid && !pending ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {pending ? 'Saving…' : 'Lock In Rate →'}
        </button>
      </div>
    </form>
  )
}
