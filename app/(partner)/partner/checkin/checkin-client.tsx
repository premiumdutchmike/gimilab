'use client'

import { useState, useTransition, useRef } from 'react'
import { checkInBooking } from '@/actions/partner'

type CheckedInBooking = {
  memberName: string
  courseName: string
  date: string
  time: string
  players: number
}

export default function CheckInClient() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<CheckedInBooking | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setCode('')
    setResult(null)
    setError('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit() {
    if (!code.trim()) return
    setError('')
    setResult(null)
    startTransition(async () => {
      const res = await checkInBooking(code)
      if (res.error) {
        setError(res.error)
      } else if (res.booking) {
        setResult(res.booking)
      }
    })
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <div style={{
        background: '#0f1923', border: '1px solid #1a2433',
        borderRadius: 6, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a2433' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#38bdf8', marginBottom: 6,
          }}>
            Pro Shop
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Member Check-in
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: '24px' }}>
          {!result ? (
            <>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)', marginBottom: 8,
              }}>
                Enter Check-in Code
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. A3F1B2C4"
                  maxLength={8}
                  autoFocus
                  style={{
                    flex: 1, background: '#0a0f1a',
                    border: `1px solid ${error ? '#ef4444' : '#1a2433'}`,
                    borderRadius: 4, padding: '12px 14px',
                    fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                    color: '#fff', letterSpacing: '0.1em', outline: 'none',
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !code.trim()}
                  style={{
                    padding: '12px 20px',
                    background: '#38bdf8', color: '#0a0f1a',
                    border: 'none', borderRadius: 4,
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    opacity: isPending || !code.trim() ? 0.5 : 1,
                  }}
                >
                  {isPending ? '…' : 'Check in'}
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                  {error}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                Enter the 8-character code from the member's app or confirmation email.
              </div>
            </>
          ) : (
            <div>
              {/* Success */}
              <div style={{
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 4, padding: '20px',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#22c55e', marginBottom: 10,
                }}>
                  ✓ Checked in
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
                  {result.courseName}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  {result.date} at {result.time}
                </div>
              </div>
              <button
                onClick={reset}
                style={{
                  width: '100%', marginTop: 14, padding: '12px',
                  background: '#1a2433', border: '1px solid #263447',
                  borderRadius: 4, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                }}
              >
                Next Check-in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
