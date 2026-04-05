'use client'

import { useState, useTransition } from 'react'
import { updateCoursePricing } from '@/actions/partner'

export default function BaseRateEditor({
  courseId,
  initialRate,
  floor,
  ceiling,
}: {
  courseId: string
  initialRate: number
  floor: number | null
  ceiling: number | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(initialRate))
  const [displayed, setDisplayed] = useState(initialRate)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    const n = parseInt(value, 10)
    if (isNaN(n)) { setError('Invalid'); return }
    setError(null)
    startTransition(async () => {
      const result = await updateCoursePricing(courseId, n)
      if (result.error) { setError(result.error); return }
      setDisplayed(n)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min={floor ?? 1}
          max={ceiling ?? undefined}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          style={{
            width: 72, background: '#0C0C0B', border: '1px solid #BF7B2E',
            borderRadius: 2, padding: '5px 8px', color: '#F4EEE3', fontSize: 14,
            fontFamily: 'inherit', outline: 'none', fontWeight: 700,
          }}
        />
        <span style={{ fontSize: 13, color: 'rgba(244,238,227,0.4)' }}>credits</span>
        <button onClick={save} disabled={isPending} style={{
          background: 'rgba(191,123,46,0.12)', border: '1px solid rgba(191,123,46,0.3)',
          borderRadius: 2, padding: '5px 12px', cursor: isPending ? 'default' : 'pointer',
          fontSize: 11, fontWeight: 700, color: '#BF7B2E', fontFamily: 'inherit',
          opacity: isPending ? 0.5 : 1,
        }}>
          Save
        </button>
        <button onClick={() => setEditing(false)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'rgba(244,238,227,0.35)', fontFamily: 'inherit',
        }}>Cancel</button>
        {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 32, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.04em' }}>
        {displayed}
      </span>
      <span style={{ fontSize: 14, color: 'rgba(244,238,227,0.4)' }}>credits</span>
      <button onClick={() => setEditing(true)} style={{
        background: 'rgba(244,238,227,0.05)', border: '1px solid rgba(244,238,227,0.1)',
        borderRadius: 2, padding: '4px 10px', cursor: 'pointer',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(244,238,227,0.4)',
        textTransform: 'uppercase', fontFamily: 'inherit',
      }}>
        Edit
      </button>
      {(floor || ceiling) && (
        <span style={{ fontSize: 11, color: 'rgba(244,238,227,0.3)' }}>
          {floor && ceiling ? `${floor}–${ceiling} cr range` : floor ? `min ${floor} cr` : `max ${ceiling} cr`}
        </span>
      )}
    </div>
  )
}
