'use client'
import { useState, useTransition } from 'react'
import { SlotQuickAdd } from '@/components/partner/slot-quick-add'
import { createInitialSlots, skipSlots } from '@/actions/partner/create-slots'

export function SlotsForm({ courseId }: { courseId: string }) {
  const [tab, setTab] = useState<'quick' | 'manual'>('quick')
  const [slotData, setSlotData] = useState<{
    days: number[]
    startTime: string
    endTime: string
    intervalMinutes: number
    startDate: string
    durationWeeks: number
    slotCount: number
  } | null>(null)
  const [serverError, setServerError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleGenerate() {
    if (!slotData || slotData.slotCount === 0) return
    setServerError('')
    const fd = new FormData()
    fd.append('courseId', courseId)
    fd.append('days', slotData.days.join(','))
    fd.append('startTime', slotData.startTime)
    fd.append('endTime', slotData.endTime)
    fd.append('interval', String(slotData.intervalMinutes))
    fd.append('startDate', slotData.startDate)
    fd.append('weeks', String(slotData.durationWeeks))
    startTransition(async () => {
      const result = await createInitialSlots(null, fd)
      if (result && 'error' in result) setServerError(result.error ?? '')
    })
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 20px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #BF7B2E' : '2px solid transparent',
    color: active ? '#F4EEE3' : '#847C72',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left' as const,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tab switcher */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(229,221,211,0.1)',
        marginBottom: 28,
      }}>
        <button type="button" style={tabStyle(tab === 'quick')} onClick={() => setTab('quick')}>
          Quick Add
          <div style={{ fontSize: 11, color: '#5A5550', fontWeight: 400, marginTop: 2 }}>
            Set a recurring schedule
          </div>
        </button>
        <button type="button" style={tabStyle(tab === 'manual')} onClick={() => setTab('manual')}>
          Manual Entry
          <div style={{ fontSize: 11, color: '#5A5550', fontWeight: 400, marginTop: 2 }}>
            Add specific dates and times
          </div>
        </button>
      </div>

      {tab === 'quick' && (
        <SlotQuickAdd onChange={data => setSlotData(data)} />
      )}

      {tab === 'manual' && (
        <ManualEntry />
      )}

      {serverError && (
        <div style={{
          marginTop: 16,
          background: 'rgba(180,50,50,0.08)', border: '1px solid rgba(180,50,50,0.25)',
          borderRadius: 2, padding: '12px 16px', fontSize: 13, color: '#b43232',
        }}>
          {serverError}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 28, marginTop: 16,
        borderTop: '1px solid rgba(229,221,211,0.1)',
      }}>
        <a href="/partner/onboarding/payout" style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '13px 20px', border: '1px solid rgba(229,221,211,0.2)', borderRadius: 2,
          color: '#847C72', textDecoration: 'none',
        }}>
          ← Back
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => skipSlots())}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#847C72',
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={pending || tab === 'quick' && !slotData}
            onClick={handleGenerate}
            style={{
              background: (pending || (tab === 'quick' && !slotData)) ? '#5A5550' : '#BF7B2E',
              color: '#fff',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '14px 28px', border: 'none', borderRadius: 2,
              cursor: (pending || (tab === 'quick' && !slotData)) ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {pending ? 'Generating…' : 'Generate Slots →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManualEntry() {
  const [rows, setRows] = useState([{ date: '', time: '08:00' }])

  const timeOptions = Array.from({ length: 26 }, (_, i) => {
    const h = Math.floor(i / 2) + 6
    const m = i % 2 === 0 ? '00' : '30'
    const hour = h % 12 || 12
    const ampm = h < 12 ? 'AM' : 'PM'
    return { value: `${String(h).padStart(2, '0')}:${m}`, label: `${hour}:${m} ${ampm}` }
  })

  const inputStyle: React.CSSProperties = {
    background: '#1E1D1B', border: '1px solid rgba(229,221,211,0.15)',
    borderRadius: 2, color: '#F4EEE3', fontSize: 14, padding: '10px 12px',
    outline: 'none', fontFamily: 'inherit', colorScheme: 'dark',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr auto',
        gap: 10, marginBottom: 4,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#847C72' }}>Date</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#847C72' }}>Time</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            value={row.date}
            onChange={e => setRows(prev => prev.map((r, j) => j === i ? { ...r, date: e.target.value } : r))}
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
          <select
            value={row.time}
            onChange={e => setRows(prev => prev.map((r, j) => j === i ? { ...r, time: e.target.value } : r))}
            style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
          >
            {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setRows(prev => prev.filter((_, j) => j !== i))}
            disabled={rows.length === 1}
            style={{
              background: 'none', border: 'none', color: '#847C72',
              cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
              fontSize: 18, padding: '0 4px', opacity: rows.length === 1 ? 0.3 : 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows(prev => [...prev, { date: '', time: '08:00' }])}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#BF7B2E', fontSize: 13, fontWeight: 600,
          textAlign: 'left', padding: '4px 0', marginTop: 4,
        }}
      >
        + Add another time
      </button>
    </div>
  )
}
