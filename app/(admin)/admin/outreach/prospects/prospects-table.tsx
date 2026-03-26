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
      let failed = 0
      for (const id of ids) {
        const res = await enrichProspect(id)
        if (res.error) failed++
      }
      setSelected(new Set())
      const succeeded = ids.length - failed
      setMsg(failed > 0
        ? `Enriched ${succeeded}, failed ${failed}.`
        : `Enriched ${succeeded} prospect${succeeded === 1 ? '' : 's'}.`
      )
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
          style={{ background: '#fff', border: '1px solid #e8e8e8', color: '#111', padding: '7px 12px', fontSize: 13, borderRadius: 2 }}
        >
          {['all','new','enriched','queued','active','bounced','skipped','closed'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
          ))}
        </select>
        <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>
          {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} prospects`}
        </span>
        {selected.size > 0 && (
          <>
            <button onClick={handleEnrich} disabled={isPending} style={{ marginLeft: 'auto', background: '#fff', color: '#111', border: '1px solid #e8e8e8', padding: '7px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}>
              {isPending ? 'Working...' : 'Enrich'}
            </button>
            <button onClick={handleGenerate} disabled={isPending} style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '7px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 2, cursor: 'pointer' }}>
              Generate Emails
            </button>
          </>
        )}
      </div>

      {msg && <p style={{ fontSize: 13, color: '#a855f7', marginBottom: 14 }}>{msg}</p>}

      {/* Table */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: 2, overflow: 'hidden' }}>
        {filtered.map((p, i) => (
          <div
            key={p.id}
            style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 60px 60px 100px 80px', alignItems: 'center', gap: 12, padding: '12px 16px', background: selected.has(p.id) ? 'rgba(168,85,247,0.08)' : i % 2 === 0 ? '#fff' : '#f5f5f5', borderBottom: '1px solid #e8e8e8', cursor: 'pointer' }}
            onClick={() => router.push(`/admin/outreach/${p.id}`)}
          >
            <input type="checkbox" checked={selected.has(p.id)} onClick={e => e.stopPropagation()} onChange={() => toggle(p.id)} style={{ accentColor: '#a855f7' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{p.courseName}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{p.gmName ?? '—'} {p.email ? `· ${p.email}` : ''}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[p.status] ?? '#888', textTransform: 'uppercase' }}>{p.status}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{p.holes ? `${p.holes}h` : '—'}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{TIER_LABEL[p.tier] ?? p.tier}</span>
            <span style={{ fontSize: 13, color: '#111' }}>
              {p.rackRateMin !== null ? `$${p.rackRateMin}–$${p.rackRateMax}` : '—'}
            </span>
            <span style={{ fontSize: 13, color: '#a855f7', fontWeight: 600 }}>
              {p.estimatedMonthlyEarn !== null ? `$${p.estimatedMonthlyEarn.toLocaleString()}` : '—'}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: 14 }}>
            No prospects yet. <a href="/admin/outreach/discover" style={{ color: '#a855f7' }}>Discover courses</a> to get started.
          </div>
        )}
      </div>
    </div>
  )
}
