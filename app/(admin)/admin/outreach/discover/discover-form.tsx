'use client'

import { useState, useTransition } from 'react'
import { discoverCourses, addProspects } from '@/actions/outreach'
import type { PlaceResult } from '@/lib/outreach/places'

export default function DiscoverForm() {
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(30)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [addedMsg, setAddedMsg] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSearch() {
    if (!location.trim()) return
    setError(null)
    setResults([])
    setSelected(new Set())
    setAddedMsg(null)
    setSearched(false)

    startTransition(async () => {
      const res = await discoverCourses(location.trim(), radius)
      setSearched(true)
      if (res.error) { setError(res.error); return }
      setResults(res.results)
    })
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(results.map(r => r.googlePlaceId)))
  }

  function handleAdd() {
    const toAdd = results.filter(r => selected.has(r.googlePlaceId))
    if (toAdd.length === 0) return

    startTransition(async () => {
      const res = await addProspects(toAdd)
      if (res.error) { setError(res.error); return }
      setAddedMsg(`Added ${res.added} course${res.added === 1 ? '' : 's'}${res.skipped > 0 ? ` (${res.skipped} already existed)` : ''}.`)
      setSelected(new Set())
    })
  }

  return (
    <div>
      {/* Search inputs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Wilmington, DE  or  19801"
            style={{ width: '100%', background: '#fff', border: '1px solid #e8e8e8', color: '#111', padding: '10px 14px', fontSize: 14, borderRadius: 2, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Radius (miles)
          </label>
          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ background: '#fff', border: '1px solid #e8e8e8', color: '#111', padding: '10px 14px', fontSize: 14, borderRadius: 2 }}
          >
            {[10, 20, 30, 50].map(r => <option key={r} value={r}>{r} mi</option>)}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={isPending || !location.trim()}
          style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '10px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 2, cursor: isPending ? 'wait' : 'pointer', opacity: !location.trim() ? 0.5 : 1 }}
        >
          {isPending ? 'Searching...' : searched && !error ? `Found ${results.length}` : 'Find Courses'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      {addedMsg && (
        <p style={{ color: '#a855f7', fontSize: 13, marginBottom: 16 }}>{addedMsg}</p>
      )}

      {searched && !isPending && results.length === 0 && !error && (
        <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13, marginBottom: 16 }}>
          No golf courses found. Try a larger radius or different location.
        </p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              {results.length} course{results.length === 1 ? '' : 's'} found — {selected.size} selected
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={selectAll} style={{ fontSize: 12, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Select all
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0 || isPending}
                style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 2, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 ? 0.4 : 1 }}
              >
                Add Selected ({selected.size})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {results.map(r => (
              <label
                key={r.googlePlaceId}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: selected.has(r.googlePlaceId) ? 'rgba(168,85,247,0.08)' : '#fff', border: `1px solid ${selected.has(r.googlePlaceId) ? '#a855f7' : '#e8e8e8'}`, borderRadius: 2, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.googlePlaceId)}
                  onChange={() => toggleSelect(r.googlePlaceId)}
                  style={{ accentColor: '#a855f7', width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{r.courseName}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.formattedAddress}</div>
                </div>
                {r.websiteUrl && (
                  <span style={{ fontSize: 11, color: '#888' }}>has website</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
