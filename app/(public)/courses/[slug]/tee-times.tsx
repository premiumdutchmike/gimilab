'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getPublicSlotsByCourse, type CourseSlot } from '@/actions/slots'

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

function buildDays(n: number) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      label: i === 0 ? 'Today' : dayNames[d.getDay()],
      date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
      dateStr: toDateString(d),
    }
  })
}

const PREVIEW_COUNT = 3 // slots shown to non-members before the gate

export default function TeeTimes({
  courseId,
  isLoggedIn,
}: {
  courseId: string
  isLoggedIn: boolean
}) {
  const days = useMemo(() => buildDays(7), [])
  const [activeDay, setActiveDay] = useState(0)
  const [slots, setSlots] = useState<CourseSlot[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async (dayIndex: number) => {
    setLoading(true)
    setError(null)
    setSlots(null)
    const { slots: data, error: err } = await getPublicSlotsByCourse(courseId, days[dayIndex].dateStr)
    setSlots(data)
    if (err) setError(err)
    setLoading(false)
  }, [courseId, days])

  useEffect(() => { fetchSlots(0) }, [fetchSlots])

  function handleDayChange(i: number) {
    setActiveDay(i)
    fetchSlots(i)
  }

  const visibleSlots = !isLoggedIn && slots ? slots.slice(0, PREVIEW_COUNT) : slots

  return (
    <>
      {/* Date Tabs */}
      <div className="tt-tabs">
        {days.map((day, i) => (
          <button
            key={i}
            className={`tt-tab${activeDay === i ? ' active' : ''}`}
            onClick={() => handleDayChange(i)}
          >
            <span className="tt-tab-day">{day.label}</span>
            <span className="tt-tab-date">{day.date}</span>
          </button>
        ))}
      </div>

      {/* Slots */}
      <div className="tt-slots">
        {loading ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} className="tt-slot tt-slot-skeleton">
                <div className="tt-skel tt-skel-time" />
                <div className="tt-skel-meta">
                  <div className="tt-skel tt-skel-line" />
                </div>
                <div className="tt-skel tt-skel-badge" />
                <div className="tt-skel tt-skel-btn" />
              </div>
            ))}
          </>
        ) : error ? (
          <div className="tt-empty">{error}</div>
        ) : !slots || slots.length === 0 ? (
          <div className="tt-empty">No tee times available for this day.</div>
        ) : (
          <>
            {visibleSlots!.map((slot) => (
              <div key={slot.id} className="tt-slot">
                <div className="tt-slot-time">{formatTime(slot.startTime)}</div>
                <div className="tt-slot-meta">
                  <div className="tt-slot-players">Up to 4 players</div>
                </div>
                <span className="tt-slot-cost">{slot.creditCost} cr</span>
                {isLoggedIn ? (
                  <Link href="/dashboard" className="tt-slot-btn">Book</Link>
                ) : (
                  <Link href="/pricing" className="tt-slot-btn">Join to Book</Link>
                )}
              </div>
            ))}

            {/* Gate for non-members when there are more slots than the preview */}
            {!isLoggedIn && slots.length > PREVIEW_COUNT && (
              <div className="tt-gate">
                <div className="tt-gate-title">
                  +{slots.length - PREVIEW_COUNT} more tee times available today.
                </div>
                <div className="tt-gate-sub">
                  Members unlock full booking access across every course in the network. Plans from $99/month.
                </div>
                <Link href="/pricing" className="tt-gate-btn">
                  See Membership Plans
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
                  </svg>
                </Link>
              </div>
            )}

            {/* Gate for non-members when there are no/few slots — still prompt join */}
            {!isLoggedIn && slots.length <= PREVIEW_COUNT && slots.length > 0 && (
              <div className="tt-gate">
                <div className="tt-gate-title">Join to book these tee times.</div>
                <div className="tt-gate-sub">Members book with monthly credits — no green fees, no booking fees ever.</div>
                <Link href="/pricing" className="tt-gate-btn">
                  See Membership Plans
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </div>

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
        .tt-slot-players { font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }
        .tt-slot-cost { font-size: 12px; font-weight: 700; color: #BF7B2E; background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.2); border-radius: 2px; padding: 4px 10px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .tt-slot-btn { background: #0C0C0B; color: #F4EEE3; border: none; border-radius: 2px; padding: 9px 16px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; text-decoration: none; transition: background 0.15s; flex-shrink: 0; }
        .tt-slot-btn:hover { background: #1E1D1B; }

        /* Skeleton */
        .tt-slot-skeleton { pointer-events: none; }
        .tt-skel { background: #F0EBE4; border-radius: 2px; animation: tt-pulse 1.4s ease-in-out infinite; }
        .tt-skel-time { width: 64px; height: 22px; flex-shrink: 0; }
        .tt-skel-meta { flex: 1; }
        .tt-skel-line { width: 120px; height: 14px; }
        .tt-skel-badge { width: 48px; height: 28px; border-radius: 2px; }
        .tt-skel-btn { width: 72px; height: 36px; border-radius: 2px; flex-shrink: 0; }
        @keyframes tt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Empty / error */
        .tt-empty { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); padding: 28px 18px; font-size: 13px; color: #847C72; text-align: center; font-family: 'Inter', sans-serif; }

        .tt-gate { background: #0C0C0B; padding: 24px; text-align: center; margin-top: 2px; }
        .tt-gate-title { font-size: 14px; font-weight: 600; color: #F4EEE3; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .tt-gate-sub { font-size: 12px; color: #847C72; margin-bottom: 18px; line-height: 1.5; font-family: 'Inter', sans-serif; }
        .tt-gate-btn { display: inline-flex; align-items: center; gap: 8px; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 12px 22px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
        .tt-gate-btn:hover { background: #d48c37; }
      `}</style>
    </>
  )
}
