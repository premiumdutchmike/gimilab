'use client'

import { useState, useTransition } from 'react'
import { adminGrantCredits } from '@/actions/admin'

export default function CreditGrantForm({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    const n = parseInt(amount, 10)
    if (isNaN(n) || n === 0) { setError('Enter a non-zero amount'); return }
    if (!notes.trim()) { setError('Notes are required'); return }
    setError(null)
    startTransition(async () => {
      const result = await adminGrantCredits(userId, n, notes.trim())
      if (result.error) { setError(result.error); return }
      setSuccess(true)
      setOpen(false)
      setAmount('')
      setNotes('')
    })
  }

  if (success) {
    return (
      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'rgba(22,163,74,0.08)', padding: '3px 8px', borderRadius: 2 }}>
        Granted
      </span>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        background: 'transparent', border: '1px solid #e8e8e8',
        borderRadius: 2, padding: '4px 12px', cursor: 'pointer',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', fontFamily: 'inherit',
      }}>
        Adjust
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <input
        type="number"
        placeholder="±credits"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        autoFocus
        style={{
          width: 80, background: '#fff', border: '1px solid #a855f7',
          borderRadius: 2, padding: '4px 8px', color: '#111', fontSize: 12,
          fontFamily: 'inherit', outline: 'none',
        }}
      />
      <input
        type="text"
        placeholder="Reason (required)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
        style={{
          width: 180, background: '#fff', border: '1px solid #d0d0d0',
          borderRadius: 2, padding: '4px 8px', color: '#111', fontSize: 12,
          fontFamily: 'inherit', outline: 'none',
        }}
      />
      <button onClick={save} disabled={isPending} style={{
        background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
        borderRadius: 2, padding: '4px 10px', cursor: isPending ? 'default' : 'pointer',
        fontSize: 10, fontWeight: 700, color: '#a855f7', fontFamily: 'inherit',
        opacity: isPending ? 0.6 : 1,
      }}>
        Save
      </button>
      <button onClick={() => setOpen(false)} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontSize: 10, color: 'rgba(0,0,0,0.3)', fontFamily: 'inherit', padding: '4px',
      }}>
        ✕
      </button>
      {error && <span style={{ fontSize: 10, color: '#dc2626', width: '100%' }}>{error}</span>}
    </div>
  )
}
