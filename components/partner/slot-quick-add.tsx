'use client'
import { useState, useMemo, useEffect } from 'react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
// Map display indices (0=Mon) to native JS getDay() values (0=Sun, 1=Mon ... 6=Sat)
const DISPLAY_TO_NATIVE = [1, 2, 3, 4, 5, 6, 0] as const
const TIMES = Array.from({ length: 26 }, (_, i) => {
  const h = Math.floor(i / 2) + 6
  const m = i % 2 === 0 ? '00' : '30'
  const hour = h % 12 || 12
  const ampm = h < 12 ? 'AM' : 'PM'
  return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${hour}:${m} ${ampm}` }
})
const DURATIONS = [
  { value: 2, label: '2 weeks' },
  { value: 4, label: '4 weeks' },
  { value: 8, label: '8 weeks' },
  { value: 12, label: '12 weeks' },
]

function toDateStr(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function todayInputValue() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function SlotQuickAdd({
  onChange,
}: {
  onChange: (data: {
    days: number[]
    startTime: string
    endTime: string
    intervalMinutes: number
    startDate: string
    durationWeeks: number
    slotCount: number
  } | null) => void
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>([3, 4, 5]) // Thu, Fri, Sat
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('16:00')
  const [interval, setInterval] = useState(15)
  const [startDate, setStartDate] = useState(todayInputValue())
  const [durationWeeks, setDurationWeeks] = useState(4)

  function toggleDay(i: number) {
    setSelectedDays(prev =>
      prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
    )
  }

  const preview = useMemo(() => {
    if (selectedDays.length === 0 || !startDate) return null

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    if (endMin <= startMin) return null

    const slotsPerDay = Math.floor((endMin - startMin) / interval)
    if (slotsPerDay <= 0) return null

    // Count days in range
    const start = new Date(startDate + 'T00:00:00')
    const endD = new Date(start)
    endD.setDate(endD.getDate() + durationWeeks * 7 - 1)

    let totalDays = 0
    const cur = new Date(start)
    while (cur <= endD) {
      // getDay() returns 0=Sun, 1=Mon...6=Sat
      // Our days: 0=Mon,...,6=Sun
      const dow = (cur.getDay() + 6) % 7
      if (selectedDays.includes(dow)) totalDays++
      cur.setDate(cur.getDate() + 1)
    }

    const slotCount = totalDays * slotsPerDay
    const dayLabels = [...selectedDays].sort().map(d => DAYS[d]).join('–')
    const startLabel = TIMES.find(t => t.value === startTime)?.label ?? startTime
    const endLabel = TIMES.find(t => t.value === endTime)?.label ?? endTime
    const endDateStr = toDateStr(endD)
    const startDateStr = toDateStr(start)

    return { slotCount, dayLabels, startLabel, endLabel, startDateStr, endDateStr }
  }, [selectedDays, startTime, endTime, interval, startDate, durationWeeks])

  // Notify parent whenever configuration changes
  useEffect(() => {
    if (!preview) { onChange(null); return }
    onChange({
      days: [...selectedDays].sort().map(i => DISPLAY_TO_NATIVE[i]),
      startTime,
      endTime,
      intervalMinutes: interval,
      startDate,
      durationWeeks,
      slotCount: preview.slotCount,
    })
  }, [preview, selectedDays, startTime, endTime, interval, startDate, durationWeeks]) // eslint-disable-line react-hooks/exhaustive-deps

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#847C72', marginBottom: 10, display: 'block',
  }
  const select: React.CSSProperties = {
    background: '#1E1D1B', border: '1px solid rgba(229,221,211,0.2)',
    borderRadius: 2, color: '#F4EEE3', fontSize: 14, padding: '10px 12px',
    outline: 'none', width: '100%', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Day chips */}
      <div>
        <span style={lbl}>Available Days</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DAYS.map((day, i) => {
            const active = selectedDays.includes(i)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(i)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 2,
                  border: active ? 'none' : '1px solid rgba(229,221,211,0.15)',
                  background: active ? '#BF7B2E' : '#2A2927',
                  color: active ? '#0C0C0B' : '#847C72',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Start / End time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <span style={lbl}>Start Time</span>
          <select value={startTime} onChange={e => setStartTime(e.target.value)} style={select}>
            {TIMES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <span style={lbl}>End Time</span>
          <select value={endTime} onChange={e => setEndTime(e.target.value)} style={select}>
            {TIMES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interval */}
      <div>
        <span style={lbl}>Interval Between Slots</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[10, 15, 20].map(min => (
            <label key={min} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="interval"
                value={min}
                checked={interval === min}
                onChange={() => setInterval(min)}
                style={{ accentColor: '#BF7B2E', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, color: interval === min ? '#F4EEE3' : '#847C72', fontWeight: interval === min ? 600 : 400 }}>
                {min} min
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <span style={lbl}>Starting</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ ...select, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <span style={lbl}>Duration</span>
          <select value={durationWeeks} onChange={e => setDurationWeeks(Number(e.target.value))} style={select}>
            {DURATIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div style={{
          background: 'rgba(191,123,46,0.08)',
          border: '1px solid rgba(191,123,46,0.25)',
          borderRadius: 2,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#BF7B2E', lineHeight: 1 }}>
              {preview.slotCount}
            </span>
            <span style={{ fontSize: 14, color: '#847C72' }}>tee time slots</span>
          </div>
          <div style={{ fontSize: 13, color: '#847C72', marginTop: 6 }}>
            {preview.dayLabels} · {preview.startLabel}–{preview.endLabel} · every {interval} min
          </div>
          <div style={{ fontSize: 12, color: '#847C72', marginTop: 2 }}>
            {preview.startDateStr} – {preview.endDateStr}
          </div>
        </div>
      )}
      {!preview && selectedDays.length > 0 && (
        <div style={{ background: 'rgba(180,50,50,0.08)', border: '1px solid rgba(180,50,50,0.25)', borderRadius: 2, padding: '12px 16px', fontSize: 12, color: '#b43232' }}>
          End time must be after start time.
        </div>
      )}

    </div>
  )
}
