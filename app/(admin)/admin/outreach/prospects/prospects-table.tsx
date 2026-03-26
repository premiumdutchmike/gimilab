'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enrichProspect, generateProspectEmails } from '@/actions/outreach'

type Prospect = {
  id: string
  courseName: string
  courseType: string | null
  holes: string | null
  tier: string
  status: string
  rackRateMin: number | null
  rackRateMax: number | null
  estimatedMonthlyEarn: number | null
  email: string | null
  gmName: string | null
}

const STATUS_COLOR: Record<string, string> = {
  new:      '#6b7280',
  enriched: '#0ea5e9',
  queued:   '#a855f7',
  active:   '#22c55e',
  bounced:  '#dc2626',
  skipped:  '#4b5563',
  closed:   '#4b5563',
}

const TIER_LABEL: Record<string, string> = { tier1: 'T1', tier2: 'T2', tier3: 'T3' }

export default function ProspectsTable({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = statusFilter === 'all'
    ? prospects
    : prospects.filter(p => p.status === statusFilter)

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleEnrich() {
    const ids = [...selected]
    if (ids.length === 0) return
    setMsg(null)
    startTransition(async () => {
      for (const id of ids) await enrichProspect(id)
      setSelected(new Set())
      setMsg(`Enriched ${ids.length} prospect${ids.length === 1 ? '' : 's'}.`)
    })
  }

  function handleGenerate() {
    const ids = [...selected]
    if (ids.length === 0) return
    setMsg(null)
    startTransition(async () => {
      const res = await generateProspectEmails(ids)
      setSelected(new Set())
      setMsg(res.error ?? `Generated emails for ${res.generated} prospect${res.generated === 1 ? '' : 's'}.`)
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ background: 'var(--graphite)', border: '1px solid var(--divider)', color: 'var(--linen)', padding: '7px 12px', fontSize: 13, borderRadius: 2 }}
        >
          {['all','new','enriched','queued','active','bounced','skipped','closed'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: 'var(--stone)', marginLeft: 4 }}>
          {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} prospects`}
        </span>
        {selected.size > 0 && (
          <>
            <button onClick={handleEnrich} disabled={isPending} style={{ marginLeft: 'auto', background: 'var(--graphite)', color: 'var(--linen)', border: '1px solid var(--divider)', padding: '7px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}>
              {isPending ? 'Working...' : 'Enrich'}
            </button>
            <button onClick={handleGenerate} disabled={isPending} style={{ background: 'var(--amber)', color: 'var(--off-white)', border: 'none', padding: '7px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}>
              Generate Emails
            </button>
          </>
        )}
      </div>

      {msg && <p style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 14 }}>{msg}</p>}

      {/* Table */}
      <div style={{ border: '1px solid var(--divider)', borderRadius: 2, overflow: 'hidden' }}>
        {filtered.map((p, i) => (
          <div
            key={p.id}
            style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 60px 60px 100px 80px', alignItems: 'center', gap: 12, padding: '12px 16px', background: selected.has(p.id) ? 'var(--amber-dim)' : i % 2 === 0 ? 'var(--graphite)' : 'var(--midnight)', borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}
            onClick={() => router.push(`/admin/outreach/${p.id}`)}
          >
            <input type="checkbox" checked={selected.has(p.id)} onClick={e => e.stopPropagation()} onChange={() => toggle(p.id)} style={{ accentColor: 'var(--amber)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--linen)' }}>{p.courseName}</div>
              <div style={{ fontSize: 11, color: 'var(--stone)', marginTop: 2 }}>{p.gmName ?? '—'} {p.email ? `· ${p.email}` : ''}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[p.status] ?? 'var(--stone)', textTransform: 'uppercase' }}>{p.status}</span>
            <span style={{ fontSize: 12, color: 'var(--stone)' }}>{p.holes ? `${p.holes}h` : '—'}</span>
            <span style={{ fontSize: 12, color: 'var(--stone)' }}>{TIER_LABEL[p.tier] ?? p.tier}</span>
            <span style={{ fontSize: 13, color: 'var(--linen)' }}>
              {p.rackRateMin !== null ? `$${p.rackRateMin}–$${p.rackRateMax}` : '—'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
              {p.estimatedMonthlyEarn !== null ? `$${p.estimatedMonthlyEarn.toLocaleString()}` : '—'}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--stone)', fontSize: 14 }}>
            No prospects yet. <a href="/admin/outreach/discover" style={{ color: 'var(--amber)' }}>Discover courses</a> to get started.
          </div>
        )}
      </div>
    </div>
  )
}
