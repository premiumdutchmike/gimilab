'use client'

import { useState, useTransition } from 'react'
import { approveAndSendEmail, skipEmail } from '@/actions/outreach'

type QueueEmail = {
  id: string
  touchNumber: number
  subject: string
  body: string
  courseName: string
  prospectId: string
  scheduledSendAt: Date
}

export default function QueueCard({ email, onDone }: { email: QueueEmail; onDone: () => void }) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(email.subject)
  const [body, setBody] = useState(email.body)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const res = await approveAndSendEmail(email.id, { subject, body })
      if (res.error) { setError(res.error); return }
      onDone()
    })
  }

  function handleSkip() {
    startTransition(async () => {
      await skipEmail(email.id)
      onDone()
    })
  }

  return (
    <div style={{ background: 'var(--graphite)', border: '1px solid var(--divider)', borderRadius: 2, padding: 24, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ background: 'var(--amber-dim)', color: 'var(--amber)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 2 }}>
          Touch {email.touchNumber}
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--linen)' }}>{email.courseName}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--stone)' }}>
          Due {new Date(email.scheduledSendAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Subject */}
      {editing ? (
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ width: '100%', background: 'var(--midnight)', border: '1px solid var(--divider)', color: 'var(--linen)', padding: '8px 12px', fontSize: 14, fontWeight: 600, borderRadius: 2, marginBottom: 10, boxSizing: 'border-box' }}
        />
      ) : (
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--linen)', marginBottom: 10 }}>
          {subject}
        </div>
      )}

      {/* Body */}
      {editing ? (
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={10}
          style={{ width: '100%', background: 'var(--midnight)', border: '1px solid var(--divider)', color: 'var(--linen)', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', borderRadius: 2, resize: 'vertical', boxSizing: 'border-box' }}
        />
      ) : (
        <pre style={{ fontSize: 13, color: 'var(--linen-dim)', fontFamily: 'inherit', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
          {body}
        </pre>
      )}

      {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</p>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button
          onClick={handleApprove}
          disabled={isPending}
          style={{ background: 'var(--amber)', color: 'var(--off-white)', border: 'none', padding: '8px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 2, cursor: isPending ? 'wait' : 'pointer' }}
        >
          {isPending ? 'Sending...' : 'Approve & Send'}
        </button>
        <button
          onClick={() => setEditing(e => !e)}
          style={{ background: 'transparent', color: 'var(--linen)', border: '1px solid var(--divider)', padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}
        >
          {editing ? 'Done editing' : 'Edit'}
        </button>
        <button
          onClick={handleSkip}
          disabled={isPending}
          style={{ marginLeft: 'auto', background: 'transparent', color: 'var(--stone)', border: 'none', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          Skip (delay 1 day)
        </button>
      </div>
    </div>
  )
}
