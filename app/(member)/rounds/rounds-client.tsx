'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { submitRating } from '@/actions/rating'

interface UpcomingBooking {
  id: string
  courseName: string
  courseAddress: string | null
  date: string // 'YYYY-MM-DD'
  startTime: string // 'HH:MM:SS'
  playerCount: number | null
  creditCost: number
  status: string
  qrCode: string | null
}

interface PastBooking {
  id: string
  courseName: string
  date: string
  startTime: string
  playerCount: number | null
  creditCost: number
  ratingScore: number | null
  ratingId: string | null
  bookingStatus: string
}

interface Props {
  upcoming: UpcomingBooking[]
  past: PastBooking[]
  balance: number
}

type Tab = 'upcoming' | 'past'

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

function groupByMonth(bookings: PastBooking[]): Array<{ label: string; items: PastBooking[] }> {
  const map = new Map<string, PastBooking[]>()
  for (const b of bookings) {
    const dt = new Date(b.date + 'T00:00:00')
    const label = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(b)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

function CheckInCode({ code }: { code: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const displayCode = code ? code.split('-')[0].toUpperCase() : null
  if (!displayCode) return null
  return (
    <>
      <button className="checkin-toggle" onClick={() => setExpanded(v => !v)}>
        {expanded ? 'Hide code' : 'Check-in code'}
      </button>
      {expanded && (
        <div className="checkin-card">
          <div className="checkin-label">Show at the pro shop</div>
          <div className="checkin-code">{displayCode}</div>
        </div>
      )}
    </>
  )
}

function StarRating({ bookingId, existingScore }: { bookingId: string; existingScore: number | null }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(existingScore ?? 0)
  const [showForm, setShowForm] = useState(false)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(!!existingScore)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  if (submitted) {
    return (
      <div className="stars-display">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`star-icon${s <= selected ? ' filled' : ''}`}>★</span>
        ))}
      </div>
    )
  }

  if (!showForm) {
    return (
      <button className="rate-btn" onClick={() => setShowForm(true)}>
        Rate
      </button>
    )
  }

  function handleSubmit() {
    if (selected === 0) { setError('Pick a star rating.'); return }
    startTransition(async () => {
      const res = await submitRating(bookingId, selected, comment)
      if (res.error) { setError(res.error); return }
      setSubmitted(true)
    })
  }

  return (
    <div className="rating-form">
      <div className="star-picker">
        {[1,2,3,4,5].map(s => (
          <button
            key={s}
            className={`star-btn${s <= (hovered || selected) ? ' lit' : ''}`}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
          >★</button>
        ))}
      </div>
      <textarea
        className="rating-comment"
        placeholder="Optional comment…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
      />
      {error && <div className="rating-error">{error}</div>}
      <div className="rating-actions">
        <button className="rate-cancel" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
        <button className="rate-submit" onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

export function RoundsClient({ upcoming, past, balance }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('upcoming')

  const pastGroups = groupByMonth(past)

  return (
    <>
      <header className="pg-topbar">
        <span className="pg-topbar-title">My Rounds</span>
        <div className="topbar-right">
          <div className="credit-chip">
            <span className="chip-val">{balance}</span>
            <span className="chip-label">credits</span>
          </div>
          <Link href="/courses" className="book-btn">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="14" height="14" rx="1" />
              <line x1="7" y1="2" x2="7" y2="6" />
              <line x1="13" y1="2" x2="13" y2="6" />
              <line x1="3" y1="9" x2="17" y2="9" />
            </svg>
            Book Tee Time
          </Link>
        </div>
      </header>

      <div className="pg-content">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab${activeTab === 'upcoming' ? ' active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`tab${activeTab === 'past' ? ' active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Rounds
          </button>
        </div>

        {/* ── Upcoming tab ── */}
        {activeTab === 'upcoming' && (
          <div>
            {upcoming.length === 0 ? (
              <div className="no-rounds">
                <span>No upcoming tee times.</span>
                <Link href="/courses" className="book-btn" style={{ fontSize: 11, padding: '9px 16px' }}>
                  Book a Round
                </Link>
              </div>
            ) : (
              <>
                {upcoming.map((b) => {
                  const dt = new Date(b.date + 'T00:00:00')
                  const month = dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  const day = dt.getDate()
                  return (
                    <div key={b.id} className="upcoming-card">
                      <div className="date-block">
                        <div className="date-month">{month}</div>
                        <div className="date-day">{day}</div>
                      </div>
                      <div className="upcoming-info">
                        <div className="upcoming-course">{b.courseName}</div>
                        <div className="upcoming-meta">
                          <span>
                            <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="10" cy="10" r="7" />
                              <polyline points="10 6 10 10 13 12" />
                            </svg>
                            {' '}{formatTime(b.startTime)}
                          </span>
                          {b.playerCount && (
                            <span>
                              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <circle cx="10" cy="7" r="3.5" />
                                <path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6" />
                              </svg>
                              {' '}{b.playerCount} Players
                            </span>
                          )}
                          {b.courseAddress && <span>{b.courseAddress}</span>}
                        </div>
                      </div>
                      <div className="upcoming-right">
                        <span className="status-badge">Confirmed</span>
                        <span className="upcoming-credits">{b.creditCost} credit{b.creditCost !== 1 ? 's' : ''}</span>
                        <CheckInCode code={b.qrCode} />
                      </div>
                    </div>
                  )
                })}
                <div className="no-rounds-cta">
                  <span className="no-rounds-text">Want to play more?</span>
                  <Link href="/courses" className="book-btn" style={{ fontSize: 11, padding: '9px 16px' }}>
                    Book Another Round
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Past Rounds tab ── */}
        {activeTab === 'past' && (
          <div>
            {pastGroups.length === 0 ? (
              <div className="no-rounds">
                <span>No past rounds yet.</span>
              </div>
            ) : (
              pastGroups.map((group) => (
                <div key={group.label}>
                  <div className="month-label">{group.label}</div>
                  {group.items.map((b) => {
                    const dateLabel = new Date(b.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const canRate = b.bookingStatus !== 'CANCELLED'
                    return (
                      <div key={b.id} className="round-row">
                        <div className="round-dot" />
                        <div className="round-main">
                          <div className="round-course">{b.courseName}</div>
                          <div className="round-sub">
                            {formatTime(b.startTime)}
                            {b.playerCount ? ` · ${b.playerCount} players` : ''}
                          </div>
                          {canRate && (
                            <StarRating bookingId={b.id} existingScore={b.ratingScore} />
                          )}
                        </div>
                        <div className="round-credits">−{b.creditCost} cr.</div>
                        <div className="round-date">{dateLabel}</div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .pg-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 36px;
          border-bottom: 1px solid rgba(12,12,11,0.09);
          background: #fff;
          position: sticky; top: 0; z-index: 50; gap: 20px;
          font-family: 'Inter', sans-serif;
        }
        .pg-topbar-title { font-size: 17px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .credit-chip {
          display: flex; align-items: center; gap: 8px;
          background: #FDFAF6; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; padding: 9px 14px;
        }
        .chip-val { font-weight: 700; color: #BF7B2E; font-size: 16px; }
        .chip-label { font-size: 12px; color: #847C72; }
        .book-btn {
          background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px;
          padding: 10px 18px; font-family: 'Inter', sans-serif; font-size: 11px;
          font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
          cursor: pointer; transition: background 0.15s;
        }
        .book-btn:hover { background: #d48c37; }

        .pg-content {
          flex: 1; padding: 24px 36px 48px;
          max-width: 860px; font-family: 'Inter', sans-serif;
        }

        /* Tabs */
        .tabs { display: flex; border-bottom: 1px solid rgba(12,12,11,0.15); margin-bottom: 24px; }
        .tab {
          padding: 10px 20px; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; color: #847C72;
          cursor: pointer; border: none; background: none;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color 0.15s, border-color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .tab:hover { color: #0C0C0B; }
        .tab.active { color: #0C0C0B; border-bottom-color: #BF7B2E; }

        /* Upcoming card */
        .upcoming-card {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 22px; margin-bottom: 8px;
          display: flex; align-items: center; gap: 18px;
          transition: box-shadow 0.15s;
        }
        .upcoming-card:hover { box-shadow: 0 3px 12px rgba(12,12,11,0.06); }
        .date-block {
          width: 52px; flex-shrink: 0; text-align: center;
          background: rgba(191,123,46,0.10);
          border: 1px solid rgba(191,123,46,0.2);
          border-radius: 2px; padding: 8px 6px;
        }
        .date-month { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; color: #BF7B2E; text-transform: uppercase; margin-bottom: 2px; }
        .date-day { font-size: 24px; font-weight: 700; color: #0C0C0B; line-height: 1; letter-spacing: -0.03em; }
        .upcoming-info { flex: 1; }
        .upcoming-course { font-size: 14px; font-weight: 700; color: #0C0C0B; margin-bottom: 4px; }
        .upcoming-meta { font-size: 12px; color: #847C72; display: flex; gap: 14px; flex-wrap: wrap; }
        .upcoming-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .status-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          border-radius: 2px; padding: 3px 9px;
          color: #BF7B2E; background: rgba(191,123,46,0.10);
          border: 1px solid rgba(191,123,46,0.2);
        }
        .upcoming-credits { font-size: 12px; color: #847C72; }

        .no-rounds-cta {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 22px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .no-rounds-text { font-size: 13px; color: #847C72; }
        .no-rounds {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 22px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          font-size: 13px; color: #847C72;
        }

        /* Past rounds */
        .month-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72;
          margin-bottom: 8px; margin-top: 24px;
        }
        .month-label:first-child { margin-top: 0; }
        .round-row {
          display: flex; align-items: center; gap: 14px;
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 14px 18px; margin-bottom: 4px;
          text-decoration: none; color: #0C0C0B;
          transition: background 0.12s;
        }
        .round-row:hover { background: #FDFAF6; }
        .round-dot { width: 6px; height: 6px; border-radius: 50%; background: #847C72; opacity: 0.35; flex-shrink: 0; }
        .round-main { flex: 1; }
        .round-course { font-size: 13px; font-weight: 600; color: #0C0C0B; margin-bottom: 2px; }
        .round-sub { font-size: 11px; color: #847C72; }
        .round-credits { font-size: 12px; font-weight: 700; color: #847C72; flex-shrink: 0; }
        .round-date { font-size: 11px; color: #847C72; width: 56px; text-align: right; flex-shrink: 0; }

        /* Check-in code */
        .checkin-toggle {
          margin-top: 8px; padding: 4px 10px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer;
          background: rgba(191,123,46,0.08); border: 1px solid rgba(191,123,46,0.25);
          border-radius: 2px; color: #BF7B2E; font-family: 'Inter', sans-serif;
        }
        .checkin-card {
          margin-top: 8px; padding: 10px 14px;
          background: #FDFAF6; border: 1px solid rgba(191,123,46,0.2);
          border-radius: 2px; text-align: right;
        }
        .checkin-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72; margin-bottom: 4px;
        }
        .checkin-code {
          font-size: 22px; font-weight: 900; font-family: monospace;
          color: #BF7B2E; letter-spacing: 0.08em;
        }

        /* Ratings */
        .stars-display { display: flex; gap: 2px; margin-top: 6px; }
        .star-icon { font-size: 14px; color: #e8e8e8; }
        .star-icon.filled { color: #BF7B2E; }

        .rate-btn {
          margin-top: 6px; padding: 3px 10px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer;
          background: none; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; color: #847C72;
          font-family: 'Inter', sans-serif;
        }
        .rate-btn:hover { border-color: #BF7B2E; color: #BF7B2E; }

        .rating-form { margin-top: 8px; }
        .star-picker { display: flex; gap: 2px; margin-bottom: 8px; }
        .star-btn {
          font-size: 20px; cursor: pointer; background: none; border: none;
          color: #e8e8e8; padding: 0; line-height: 1; transition: color 0.1s;
        }
        .star-btn.lit { color: #BF7B2E; }
        .rating-comment {
          width: 100%; box-sizing: border-box;
          font-size: 12px; font-family: 'Inter', sans-serif;
          padding: 7px 10px; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; resize: none; color: #0C0C0B;
          background: #fff; outline: none;
        }
        .rating-comment:focus { border-color: #BF7B2E; }
        .rating-error { font-size: 11px; color: #dc2626; margin-top: 4px; }
        .rating-actions { display: flex; gap: 8px; margin-top: 8px; }
        .rate-cancel {
          padding: 5px 12px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
          background: none; border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px; color: #847C72; font-family: 'Inter', sans-serif;
        }
        .rate-submit {
          padding: 5px 14px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
          background: #BF7B2E; border: none; border-radius: 2px;
          color: #0C0C0B; font-family: 'Inter', sans-serif;
        }
        .rate-submit:disabled { opacity: 0.5; cursor: default; }

        @media (max-width: 860px) {
          .pg-content { padding: 20px 24px 40px; }
          .pg-topbar { padding: 16px 24px; }
        }
        @media (max-width: 560px) {
          .upcoming-meta { gap: 8px; }
        }
      `}</style>
    </>
  )
}
