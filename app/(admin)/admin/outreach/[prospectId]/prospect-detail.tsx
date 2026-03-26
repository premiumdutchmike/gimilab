'use client'

import { useState, useTransition } from 'react'
import { updateProspect } from '@/actions/outreach'

type Prospect = {
  id: string
  courseName: string
  gmName: string | null
  email: string | null
  phone: string | null
  websiteUrl: string
  rackRateMin: number | null
  rackRateMax: number | null
  golfnowUrl: string | null
  estimatedMonthlyEarn: number | null
  courseType: string | null
  holes: string | null
  tier: string
  status: string
  skipReason: string | null
  notes: string | null
}

type EmailRow = {
  id: string
  touchNumber: number
  subject: string
  status: string
  sentAt: Date | null
  openedAt: Date | null
  scheduledSendAt: Date
}

const STATUS_OPTIONS = ['new','enriched','queued','active','paused','bounced','skipped','closed']
const TYPE_OPTIONS = ['municipal','semi_private','public','private','resort']
const HOLES_OPTIONS = ['9','18','27','36']
const TIER_OPTIONS = ['tier1','tier2','tier3']

const EMAIL_STATUS_COLOR: Record<string, string> = {
  draft:    '#6b7280',
  approved: '#a855f7',
  sent:     '#22c55e',
  bounced:  '#dc2626',
}

export default function ProspectDetail({
  prospect,
  emails,
}: {
  prospect: Prospect
  emails: EmailRow[]
}) {
  const [fields, setFields] = useState({
    gmName: prospect.gmName ?? '',
    email: prospect.email ?? '',
    courseType: prospect.courseType ?? '',
    holes: prospect.holes ?? '',
    tier: prospect.tier,
    status: prospect.status,
    notes: prospect.notes ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateProspect(prospect.id, {
        gmName: fields.gmName || undefined,
        email: fields.email || undefined,
        courseType: fields.courseType || undefined,
        holes: fields.holes || undefined,
        tier: fields.tier,
        status: fields.status,
        notes: fields.notes || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleMarkReplied() {
    startTransition(async () => {
      await updateProspect(prospect.id, { status: 'active' })
      setFields(f => ({ ...f, status: 'active' }))
    })
  }

  const inputStyle = { width: '100%', background: 'var(--midnight)', border: '1px solid var(--divider)', color: 'var(--linen)', padding: '8px 12px', fontSize: 14, borderRadius: 2, boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block' as const, fontSize: 11, fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 5 }

  return (
    <div>
      {/* Enrichment data */}
      <div style={{ background: 'var(--graphite)', border: '1px solid var(--divider)', borderRadius: 2, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 0 }}>
          Enrichment Data
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>GM Name</label>
            <input style={inputStyle} value={fields.gmName} onChange={e => setFields(f => ({ ...f, gmName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={fields.email} onChange={e => setFields(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Course Type</label>
            <select style={inputStyle} value={fields.courseType} onChange={e => setFields(f => ({ ...f, courseType: e.target.value }))}>
              <option value="">Unknown</option>
              {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Holes</label>
            <select style={inputStyle} value={fields.holes} onChange={e => setFields(f => ({ ...f, holes: e.target.value }))}>
              <option value="">Unknown</option>
              {HOLES_OPTIONS.map(o => <option key={o} value={o}>{o} holes</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tier</label>
            <select style={inputStyle} value={fields.tier} onChange={e => setFields(f => ({ ...f, tier: e.target.value }))}>
              {TIER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={fields.status} onChange={e => setFields(f => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Read-only enrichment fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
          {[
            { label: 'Rack Rate', value: prospect.rackRateMin !== null ? `$${prospect.rackRateMin} – $${prospect.rackRateMax}` : '—' },
            { label: 'Est. Monthly Earn', value: prospect.estimatedMonthlyEarn !== null ? `$${prospect.estimatedMonthlyEarn.toLocaleString()}` : '—' },
            { label: 'GolfNow', value: prospect.golfnowUrl ? 'Listed' : 'Not listed' },
            { label: 'Phone', value: prospect.phone ?? '—' },
            { label: 'Website', value: prospect.websiteUrl ? 'Set' : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={labelStyle}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--linen)' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>Notes / Hook</label>
          <textarea
            value={fields.notes}
            onChange={e => setFields(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {prospect.skipReason && (
          <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12 }}>
            Skipped: {prospect.skipReason}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{ background: 'var(--amber)', color: 'var(--off-white)', border: 'none', padding: '8px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 2, cursor: 'pointer' }}
          >
            {saved ? 'Saved' : isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleMarkReplied}
            disabled={isPending}
            style={{ background: 'transparent', color: 'var(--linen)', border: '1px solid var(--divider)', padding: '8px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}
          >
            Mark as Replied
          </button>
        </div>
      </div>

      {/* Email history */}
      <div style={{ background: 'var(--graphite)', border: '1px solid var(--divider)', borderRadius: 2, padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, marginTop: 0 }}>
          Email Sequence
        </h2>
        {emails.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--stone)' }}>No emails generated yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {emails.map(e => (
              <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 80px 120px 120px', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--midnight)', borderRadius: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--stone)', textTransform: 'uppercase' }}>Touch {e.touchNumber}</span>
                <span style={{ fontSize: 13, color: 'var(--linen)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.subject}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: EMAIL_STATUS_COLOR[e.status] ?? 'var(--stone)', textTransform: 'uppercase' }}>{e.status}</span>
                <span style={{ fontSize: 12, color: 'var(--stone)' }}>
                  {e.sentAt ? `Sent ${new Date(e.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : `Sched. ${new Date(e.scheduledSendAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--stone)' }}>
                  {e.openedAt ? `Opened ${new Date(e.openedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
