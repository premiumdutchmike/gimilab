'use client'

import { useState, useTransition } from 'react'
import { updateCoursePayoutRate } from '@/actions/admin'

export default function PayoutRateEditor({
  courseId,
  initialRate,
}: {
  courseId: string
  initialRate: number | null // e.g. 0.70
}) {
  const defaultPct = initialRate != null ? Math.round(initialRate * 100) : 70
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(defaultPct))
  const [displayed, setDisplayed] = useState(defaultPct)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    const pct = parseInt(value, 10)
    if (isNaN(pct)) { setError('Invalid'); return }
    setError(null)
    startTransition(async () => {
      const result = await updateCoursePayoutRate(courseId, pct)
      if (result.error) { setError(result.error); return }
      setDisplayed(pct)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          style={{
            width: 52, background: '#fff', border: '1px solid #a855f7',
            borderRadius: 2, padding: '3px 6px', color: '#111', fontSize: 12,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>%</span>
        <button
          onClick={save}
          disabled={isPending}
          style={{
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 2, padding: '3px 8px', cursor: isPending ? 'default' : 'pointer',
            fontSize: 10, fontWeight: 700, color: '#a855f7', fontFamily: 'inherit',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          Save
        </button>
        {error && <span style={{ fontSize: 10, color: '#dc2626' }}>{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        padding: 0, display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7' }}>{displayed}%</span>
      <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.25)', letterSpacing: '0.08em' }}>EDIT</span>
    </button>
  )
}
