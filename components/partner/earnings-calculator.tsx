'use client'
import { useState } from 'react'

export function EarningsCalculator({ dark = false }: { dark?: boolean }) {
  const [rate, setRate] = useState(38)
  const [bookings, setBookings] = useState(30)

  const gross = rate * bookings
  const payout = Math.round(gross * 0.85)
  const perBooking = Math.round(rate * 0.85)

  const textColor = dark ? '#F4EEE3' : '#0C0C0B'
  const subColor = '#847C72'
  const bgCard = dark ? 'rgba(255,255,255,0.05)' : '#fff'
  const borderColor = dark ? 'rgba(229,221,211,0.12)' : '#D8D1C6'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: subColor }}>
          Your rate per tee time
        </label>
        <div style={{ display: 'flex', alignItems: 'center', background: dark ? '#1E1D1B' : '#fff', border: `1px solid ${dark ? '#BF7B2E' : borderColor}`, borderRadius: 2 }}>
          <span style={{ padding: '12px 8px 12px 14px', color: subColor, fontWeight: 600 }}>$</span>
          <input
            type="number"
            value={rate}
            min={0}
            onChange={e => setRate(Math.max(0, Number(e.target.value)))}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: textColor, fontSize: 15, padding: '12px 14px 12px 0', width: '100%' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: subColor }}>
            Monthly bookings
          </label>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#BF7B2E' }}>{bookings}</span>
        </div>
        <input
          type="range"
          min={1}
          max={200}
          value={bookings}
          onChange={e => setBookings(Number(e.target.value))}
          style={{ accentColor: '#BF7B2E', width: '100%', cursor: 'pointer' }}
        />
      </div>
      <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderTop: '2px solid #BF7B2E', borderRadius: 2, padding: '20px 24px' }}>
        {[
          { label: 'Monthly gross', value: `$${gross.toLocaleString()}` },
          { label: 'Gimmelab payout to you (85%)', value: `$${payout.toLocaleString()}` },
          { label: 'Per-booking rate', value: `$${perBooking}` },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
            <span style={{ fontSize: 13, color: subColor }}>{label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: textColor }}>{value}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: subColor, marginTop: 12 }}>Numbers are estimates based on 85% payout rate.</p>
      </div>
    </div>
  )
}
