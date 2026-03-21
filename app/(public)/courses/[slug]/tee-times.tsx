'use client'

import { useState } from 'react'
import Link from 'next/link'

const DEMO_SLOTS = [
  { time: '7:00 AM', players: 'Up to 4 players', avail: '2 spots remaining' },
  { time: '7:42 AM', players: 'Up to 4 players', avail: '4 spots available' },
  { time: '8:24 AM', players: 'Up to 4 players', avail: '3 spots remaining' },
]

function getNextDays(n: number) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const result = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    result.push({
      label: i === 0 ? 'Today' : days[d.getDay()],
      date: `${months[d.getMonth()]} ${d.getDate()}`,
    })
  }
  return result
}

export default function TeeTimes({
  courseSlug,
  isLoggedIn,
}: {
  courseSlug: string
  isLoggedIn: boolean
}) {
  const [activeDay, setActiveDay] = useState(0)
  const days = getNextDays(7)

  return (
    <>
      {/* Date Tabs */}
      <div className="tt-tabs">
        {days.map((day, i) => (
          <button
            key={i}
            className={`tt-tab${activeDay === i ? ' active' : ''}`}
            onClick={() => setActiveDay(i)}
          >
            <span className="tt-tab-day">{day.label}</span>
            <span className="tt-tab-date">{day.date}</span>
          </button>
        ))}
      </div>

      {/* Slots */}
      <div className="tt-slots">
        {DEMO_SLOTS.map((slot, i) => (
          <div key={i} className="tt-slot">
            <div className="tt-slot-time">{slot.time}</div>
            <div className="tt-slot-meta">
              <div className="tt-slot-players">{slot.players}</div>
              <div className="tt-slot-avail">{slot.avail}</div>
            </div>
            <span className="tt-slot-cost">1 Credit</span>
            {isLoggedIn ? (
              <Link href="/dashboard" className="tt-slot-btn">Book</Link>
            ) : (
              <Link href="/pricing" className="tt-slot-btn">Join to Book</Link>
            )}
          </div>
        ))}
      </div>

      {/* Gate (only shown to non-members) */}
      {!isLoggedIn && (
        <div className="tt-gate">
          <div className="tt-gate-title">Join to see all available tee times.</div>
          <div className="tt-gate-sub">Members unlock full booking access across every course in the network. Plans from $99/month.</div>
          <Link href="/pricing" className="tt-gate-btn">
            See Membership Plans
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
            </svg>
          </Link>
        </div>
      )}

      <style>{`
        .tt-tabs { display: flex; gap: 6px; margin-bottom: 16px; overflow-x: auto; }
        .tt-tab { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 10px 16px; font-size: 12px; font-weight: 600; color: #847C72; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; text-align: center; font-family: 'Inter', sans-serif; }
        .tt-tab:hover { border-color: #BF7B2E; color: #BF7B2E; }
        .tt-tab.active { background: rgba(191,123,46,0.10); border-color: #BF7B2E; color: #BF7B2E; }
        .tt-tab-day { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2px; }
        .tt-tab-date { display: block; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; color: #0C0C0B; }
        .tt-tab.active .tt-tab-date { color: #0C0C0B; }

        .tt-slots { display: flex; flex-direction: column; gap: 2px; }
        .tt-slot { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
        .tt-slot-time { font-size: 16px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; width: 72px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .tt-slot-meta { flex: 1; }
        .tt-slot-players { font-size: 12px; color: #847C72; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .tt-slot-avail { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }
        .tt-slot-cost { font-size: 12px; font-weight: 700; color: #BF7B2E; background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.2); border-radius: 2px; padding: 4px 10px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .tt-slot-btn { background: #0C0C0B; color: #F4EEE3; border: none; border-radius: 2px; padding: 9px 16px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; text-decoration: none; transition: background 0.15s; flex-shrink: 0; }
        .tt-slot-btn:hover { background: #1E1D1B; }

        .tt-gate { background: #0C0C0B; padding: 24px; text-align: center; margin-top: 2px; }
        .tt-gate-title { font-size: 14px; font-weight: 600; color: #F4EEE3; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .tt-gate-sub { font-size: 12px; color: #847C72; margin-bottom: 18px; line-height: 1.5; font-family: 'Inter', sans-serif; }
        .tt-gate-btn { display: inline-flex; align-items: center; gap: 8px; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 12px 22px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
        .tt-gate-btn:hover { background: #d48c37; }
      `}</style>
    </>
  )
}
