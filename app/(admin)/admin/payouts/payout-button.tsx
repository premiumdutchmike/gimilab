'use client'

import { useState } from 'react'
import { processPartnerPayouts } from '@/actions/admin'

interface PayoutButtonProps {
  partnerId: string
  pendingCents: number
  disabled: boolean
}

export default function PayoutButton({ partnerId, pendingCents, disabled }: PayoutButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleClick() {
    setState('loading')
    const result = await processPartnerPayouts(partnerId)
    if (result.error) {
      setState('error')
      setMsg(result.error)
    } else {
      setState('done')
      setMsg(`Transferred $${((result.amountCents ?? 0) / 100).toFixed(2)}`)
    }
  }

  if (state === 'done') {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{msg}</span>
    )
  }

  if (state === 'error') {
    return (
      <span style={{ fontSize: 12, color: '#dc2626' }}>{msg}</span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state === 'loading'}
      style={{
        padding: '6px 14px',
        background: disabled || state === 'loading' ? 'rgba(0,0,0,0.06)' : '#111',
        color: disabled || state === 'loading' ? 'rgba(0,0,0,0.3)' : '#fff',
        border: 'none', borderRadius: 3,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', cursor: disabled || state === 'loading' ? 'default' : 'pointer',
      }}
    >
      {state === 'loading' ? 'Processing…' : `Pay ${pendingCents > 0 ? '$' + (pendingCents / 100).toFixed(2) : ''}`}
    </button>
  )
}
