// app/(admin)/admin/members/[id]/credit-adjustment-form.tsx
'use client'
import { useState, useTransition } from 'react'
import { adjustMemberCredits } from '@/actions/admin/adjust-member-credits'

export function CreditAdjustmentForm({ userId }: { userId: string }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #e8e8e8',
    borderRadius: 2, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 4,
  }

  function handleSubmit() {
    setError('')
    setSuccess('')
    const n = parseInt(amount)
    if (isNaN(n) || n === 0) { setError('Enter a non-zero amount'); return }
    if (!notes.trim()) { setError('Notes are required'); return }
    startTransition(async () => {
      const result = await adjustMemberCredits(userId, n, notes)
      if (result.error) { setError(result.error) }
      else { setSuccess(`${n > 0 ? '+' : ''}${n} credits applied.`); setAmount(''); setNotes('') }
    })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e8', padding: '20px 24px', maxWidth: 440, borderRadius: 2 }}>
      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 16 }}>
        Manual Adjustment
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>Amount (positive to add, negative to deduct)</label>
          <input style={inputStyle} type="number" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="e.g. 20 or -10" />
        </div>
        <div>
          <label style={labelStyle}>Notes (required)</label>
          <input style={inputStyle} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Reason for adjustment" />
        </div>
        {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: '#16a34a' }}>{success}</p>}
        <button
          onClick={handleSubmit}
          disabled={pending}
          style={{
            alignSelf: 'flex-start', padding: '8px 20px', background: '#111',
            color: '#fff', border: 'none', borderRadius: 2, fontSize: 13,
            fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Saving…' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
