'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSlotsByDate, type CourseWithSlots } from '@/actions/slots'
import { confirmBooking } from '@/actions/booking'

type CourseOption = { id: string; name: string }

interface BookingClientProps {
  courseOptions: CourseOption[]
  balance: number
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour}:${m.toString().padStart(2, '0')}${ampm}`
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function BookingClient({ courseOptions, balance }: BookingClientProps) {
  const router = useRouter()

  // Filters
  const [date, setDate] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('any')
  const [players, setPlayers] = useState(1)

  // Results
  const [results, setResults] = useState<CourseWithSlots[] | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isFetching, startFetch] = useTransition()

  // Picked slot
  const [picked, setPicked] = useState<{
    slotId: string; courseName: string; startTime: string; creditCost: number
  } | null>(null)

  // Booking
  const [isBooking, startBooking] = useTransition()
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ courseName: string; time: string; date: string } | null>(null)

  const fetchSlots = useCallback((
    newDate: string, newCourse: string, newTime: string,
  ) => {
    if (!newDate) { setResults(null); setFetchError(null); return }
    setFetchError(null)
    startFetch(async () => {
      const res = await getSlotsByDate(
        newDate,
        newCourse || undefined,
        newTime === 'any' ? undefined : newTime,
      )
      if (res.error) { setFetchError(res.error); setResults(null) }
      else setResults(res.data ?? [])
    })
  }, [])

  function handleDateChange(v: string) {
    setDate(v); setPicked(null); fetchSlots(v, courseFilter, timeFilter)
  }
  function handleCourseChange(v: string) {
    setCourseFilter(v); setPicked(null); fetchSlots(date, v, timeFilter)
  }
  function handleTimeChange(v: string) {
    setTimeFilter(v); setPicked(null); fetchSlots(date, courseFilter, v)
  }

  function pickSlot(course: CourseWithSlots, slot: { id: string; startTime: string; creditCost: number }) {
    setPicked({ slotId: slot.id, courseName: course.courseName, startTime: slot.startTime, creditCost: slot.creditCost })
    setBookingError(null)
  }

  function handleConfirm() {
    if (!picked) return
    startBooking(async () => {
      const res = await confirmBooking(picked.slotId)
      if (res.error) {
        setBookingError(res.error)
      } else {
        setSuccess({
          courseName: picked.courseName,
          time: formatTime(picked.startTime),
          date: date ? formatDateLabel(date) : '',
        })
        setPicked(null)
      }
    })
  }

  const totalCredits = picked ? picked.creditCost * players : 0

  return (
    <>
      {/* ── Topbar ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 36px', borderBottom: '1px solid rgba(12,12,11,0.09)',
        background: '#fff', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0C0C0B', letterSpacing: '-0.02em' }}>
          Book a Tee Time
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#FDFAF6', border: '1px solid rgba(12,12,11,0.15)',
          borderRadius: 2, padding: '8px 14px',
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#BF7B2E', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {balance}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#847C72' }}>
            Credits
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '28px 36px 100px' }}>

        {/* Filters */}
        <div style={{
          background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
          padding: '20px 24px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#847C72', marginBottom: 16 }}>
            Filters
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 200px 120px', gap: 12, alignItems: 'end' }}>

            {/* Course */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#847C72' }}>
                Course
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="bk-select"
                  value={courseFilter}
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  <option value="">All courses</option>
                  {courseOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="select-chevron" />
              </div>
            </div>

            {/* Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#847C72' }}>
                Date
              </label>
              <input
                className="bk-input"
                type="date"
                value={date}
                onChange={e => handleDateChange(e.target.value)}
              />
            </div>

            {/* Time of day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#847C72' }}>
                Time of day
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="bk-select"
                  value={timeFilter}
                  onChange={e => handleTimeChange(e.target.value)}
                >
                  <option value="any">Any</option>
                  <option value="early">Early (before 8am)</option>
                  <option value="morning">Morning (8–11am)</option>
                  <option value="midday">Midday (11am–2pm)</option>
                  <option value="afternoon">Afternoon (after 2pm)</option>
                </select>
                <span className="select-chevron" />
              </div>
            </div>

            {/* Players */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#847C72' }}>
                Players
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="bk-select"
                  value={players}
                  onChange={e => setPlayers(Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="select-chevron" />
              </div>
            </div>
          </div>
        </div>

        {/* Results area */}
        {isFetching ? (
          <div style={{
            background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
            padding: '60px 24px', textAlign: 'center', color: '#847C72', fontSize: 13,
          }}>
            Loading tee times…
          </div>
        ) : fetchError ? (
          <div style={{
            background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
            padding: '40px 24px', textAlign: 'center', color: '#847C72', fontSize: 13,
          }}>
            {fetchError}
          </div>
        ) : results === null ? (
          /* Empty state — no date selected */
          <div style={{
            background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
            padding: '60px 24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, background: '#FDFAF6',
              border: '1px solid rgba(12,12,11,0.09)', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#847C72', marginBottom: 4,
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="14" height="14" rx="1" />
                <line x1="7" y1="2" x2="7" y2="6" />
                <line x1="13" y1="2" x2="13" y2="6" />
                <line x1="3" y1="9" x2="17" y2="9" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0C0C0B' }}>Select a date to see available tee times.</div>
            <div style={{ fontSize: 13, color: '#847C72' }}>Choose a date above to get started.</div>
          </div>
        ) : results.length === 0 ? (
          /* No results */
          <div style={{
            background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
            padding: '60px 24px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 40, height: 40, background: '#FDFAF6',
              border: '1px solid rgba(12,12,11,0.09)', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#847C72', marginBottom: 4,
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="14" height="14" rx="1" />
                <line x1="7" y1="2" x2="7" y2="6" />
                <line x1="13" y1="2" x2="13" y2="6" />
                <line x1="3" y1="9" x2="17" y2="9" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0C0C0B' }}>No tee times available for these filters.</div>
            <div style={{ fontSize: 13, color: '#847C72' }}>Try adjusting your search.</div>
          </div>
        ) : (
          /* Course list */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#847C72' }}>
                {results.length} course{results.length !== 1 ? 's' : ''} available
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0C0C0B' }}>
                {formatDateLabel(date)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(course => (
                <div key={course.courseId} style={{ background: '#fff', border: '1px solid rgba(12,12,11,0.09)' }}>
                  {/* Course header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px 14px' }}>
                    <div style={{
                      width: 48, height: 40, background: '#FDFAF6',
                      border: '1px solid rgba(12,12,11,0.09)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#847C72',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z" />
                        <circle cx="10" cy="7" r="1.8" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0C0C0B', letterSpacing: '-0.01em', marginBottom: 3 }}>
                        {course.courseName}
                      </div>
                      <div style={{ fontSize: 12, color: '#847C72', marginBottom: 7 }}>
                        {course.courseAddress} — {course.holes} holes
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {course.amenities.slice(0, 4).map(tag => (
                          <span key={tag} style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                            background: '#FDFAF6', border: '1px solid rgba(12,12,11,0.09)',
                            borderRadius: 2, padding: '2px 7px', color: '#847C72',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0C0C0B', whiteSpace: 'nowrap', paddingTop: 2 }}>
                      <span style={{ color: '#BF7B2E' }}>{course.baseCreditCost}</span> cr / player
                    </div>
                  </div>

                  {/* Slot grid */}
                  <div style={{ borderTop: '1px solid rgba(12,12,11,0.09)', padding: '12px 20px 14px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#847C72', marginBottom: 10 }}>
                      Available tee times
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {course.slots.map(slot => {
                        const isPicked = picked?.slotId === slot.id
                        return (
                          <button
                            key={slot.id}
                            onClick={() => pickSlot(course, slot)}
                            style={{
                              background: isPicked ? '#BF7B2E' : '#FDFAF6',
                              border: `1px solid ${isPicked ? '#BF7B2E' : 'rgba(12,12,11,0.15)'}`,
                              borderRadius: 2,
                              padding: '8px 14px',
                              fontSize: 12,
                              fontWeight: 700,
                              color: isPicked ? '#0C0C0B' : '#0C0C0B',
                              letterSpacing: '-0.01em',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              fontFamily: 'inherit',
                              transition: 'border-color 0.12s, background 0.12s',
                            }}
                          >
                            {formatTime(slot.startTime)}
                            <span style={{
                              fontSize: 9, fontWeight: 600,
                              color: isPicked ? 'rgba(12,12,11,0.6)' : '#847C72',
                              letterSpacing: '0.05em',
                            }}>
                              {slot.creditCost} cr
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 228, right: 0,
        background: '#fff', borderTop: '1px solid rgba(12,12,11,0.15)',
        padding: '16px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        zIndex: 90,
        transform: picked ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.2s',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0C0C0B' }}>
            {picked ? `${picked.courseName} — ${formatTime(picked.startTime)}` : ''}
          </div>
          <div style={{ fontSize: 12, color: '#847C72' }}>
            {date ? `${formatDateLabel(date)} · ` : ''}{players} player{players !== 1 ? 's' : ''}
          </div>
          {bookingError && (
            <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>{bookingError}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#BF7B2E', letterSpacing: '-0.03em' }}>
              {totalCredits}
            </span>
            <span style={{ fontSize: 11, color: '#847C72' }}>credits</span>
          </div>
          <button
            onClick={() => { setPicked(null); setBookingError(null) }}
            style={{
              background: 'none', border: 'none',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#847C72', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBooking}
            style={{
              background: '#BF7B2E', border: 'none', borderRadius: 2,
              padding: '13px 28px',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#0C0C0B', cursor: isBooking ? 'default' : 'pointer',
              opacity: isBooking ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
          >
            {isBooking ? 'Booking…' : 'Confirm Booking'}
          </button>
        </div>
      </div>

      {/* ── Success overlay ── */}
      {success && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(253,250,246,0.92)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', border: '1px solid rgba(12,12,11,0.09)',
            padding: '44px 40px', maxWidth: 400, width: '90%', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48,
              background: 'rgba(191,123,46,0.10)', border: '1px solid rgba(191,123,46,0.22)',
              borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#BF7B2E', margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="4 10 8 14 16 6" />
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0C0C0B', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {"You're on the tee!"}
            </div>
            <div style={{ fontSize: 13, color: '#847C72', lineHeight: 1.6, marginBottom: 24 }}>
              {success.courseName} — {success.date} at {success.time}.{' '}
              Confirmation sent to your email.
            </div>
            <button
              onClick={() => router.push('/rounds')}
              style={{
                width: '100%', background: '#0C0C0B', color: '#F4EEE3',
                border: 'none', borderRadius: 2, padding: 13,
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              View My Rounds
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bk-select, .bk-input {
          width: 100%;
          background: #FDFAF6;
          border: 1px solid rgba(12,12,11,0.15);
          border-radius: 2px;
          padding: 10px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #0C0C0B;
          outline: none;
          transition: border-color 0.15s;
          appearance: none;
          -webkit-appearance: none;
        }
        .bk-select:focus, .bk-input:focus { border-color: #BF7B2E; background: #fff; }
        .bk-select { padding-right: 28px; cursor: pointer; }
        .select-chevron {
          position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
          width: 0; height: 0;
          border-left: 4px solid transparent; border-right: 4px solid transparent;
          border-top: 5px solid #847C72; pointer-events: none;
        }
      `}</style>
    </>
  )
}
