'use client'

import { useState, useTransition } from 'react'
import { updateBlockCreditOverride } from '@/actions/partner'

export default function BlockOverrideEditor({
  blockId,
  initialOverride,
  baseRate,
}: {
  blockId: string
  initialOverride: number | null
  baseRate: number
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialOverride !== null ? String(initialOverride) : '')
  const [displayed, setDisplayed] = useState<number | null>(initialOverride)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save(override: number | null) {
    if (override !== null && isNaN(override)) { setError('Invalid'); return }
    setError(null)
    startTransition(async () => {
      const result = await updateBlockCreditOverride(blockId, override)
      if (result.error) { setError(result.error); return }
      setDisplayed(override)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <input
          type="number"
          min={1}
          placeholder={String(baseRate)}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') save(value ? parseInt(value, 10) : null)
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
          style={{
            width: 64, background: '#0f1923', border: '1px solid #38bdf8',
            borderRadius: 2, padding: '3px 6px', color: '#fff', fontSize: 12,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>cr</span>
        <button onClick={() => save(value ? parseInt(value, 10) : null)} disabled={isPending} style={{
          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
          borderRadius: 2, padding: '3px 8px', cursor: 'pointer',
          fontSize: 10, fontWeight: 700, color: '#38bdf8', fontFamily: 'inherit',
          opacity: isPending ? 0.5 : 1,
        }}>
          Save
        </button>
        {displayed !== null && (
          <button onClick={() => save(null)} disabled={isPending} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2, padding: '3px 8px', cursor: 'pointer',
            fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit',
          }}>
            Use base
          </button>
        )}
        <button onClick={() => setEditing(false)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: 10, color: 'rgba(255,255,255,0.25)', padding: '3px', fontFamily: 'inherit',
        }}>✕</button>
        {error && <span style={{ fontSize: 10, color: '#f87171', width: '100%' }}>{error}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      padding: 0, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {displayed !== null ? (
        <>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{displayed} cr</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>EDIT</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>— (base rate)</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>SET</span>
        </>
      )}
    </button>
  )
}
