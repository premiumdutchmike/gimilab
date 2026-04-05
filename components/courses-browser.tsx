'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CourseItem } from '@/app/(public)/courses/fallback-courses'
import type { PlanKey } from '@/lib/credits/pricing'
import CreditDollarHint from '@/components/credit-dollar-hint'
import { geocodeZip, distanceMiles, type LatLng } from '@/lib/geo/distance'

type SortKey = 'featured' | 'credit-asc' | 'name-asc' | 'distance-asc'
type RadiusFilter = 'all' | 10 | 25 | 50

const PIN_ICON = (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z"/>
    <circle cx="10" cy="7" r="1.8"/>
  </svg>
)

export default function CoursesBrowser({
  courses,
  isLoggedIn,
  balance,
  userTier,
  userHomeZip,
}: {
  courses: CourseItem[]
  isLoggedIn: boolean
  balance?: number
  userTier?: PlanKey
  userHomeZip?: string | null
}) {
  const displayTier: PlanKey = userTier ?? 'core'

  const [search, setSearch] = useState('')
  const [zipInput, setZipInput] = useState(userHomeZip ?? '')
  const [resolvedOrigin, setResolvedOrigin] = useState<LatLng | null>(null)
  const [zipError, setZipError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [radius, setRadius] = useState<RadiusFilter>('all')
  const [sort, setSort] = useState<SortKey>('featured')

  // Auto-resolve the pre-filled zip on mount (if the user is logged in and
  // has a homeZip saved on their profile).
  useEffect(() => {
    if (!zipInput || resolvedOrigin) return
    let cancelled = false
    setIsResolving(true)
    geocodeZip(zipInput).then((coords) => {
      if (cancelled) return
      setIsResolving(false)
      if (coords) {
        setResolvedOrigin(coords)
        setZipError(null)
      }
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = zipInput.trim()
    if (!clean) {
      setResolvedOrigin(null)
      setZipError(null)
      return
    }
    setIsResolving(true)
    setZipError(null)
    const coords = await geocodeZip(clean)
    setIsResolving(false)
    if (coords) {
      setResolvedOrigin(coords)
    } else {
      setResolvedOrigin(null)
      setZipError('Unknown zip code — try a 5-digit US zip.')
    }
  }

  const filtered = useMemo(() => {
    let list = courses.map((c) => {
      const dist =
        resolvedOrigin && c.lat != null && c.lng != null
          ? distanceMiles(resolvedOrigin, { lat: c.lat, lng: c.lng })
          : null
      const affordable = balance == null ? true : balance >= c.baseCreditCost
      return { ...c, distance: dist, affordable }
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q),
      )
    }

    // Only apply radius filter if we have an origin AND a specific radius
    if (resolvedOrigin && radius !== 'all') {
      list = list.filter((c) => c.distance != null && c.distance <= radius)
    }

    if (sort === 'credit-asc') list.sort((a, b) => a.baseCreditCost - b.baseCreditCost)
    else if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'distance-asc' && resolvedOrigin) {
      list.sort((a, b) => {
        const da = a.distance ?? Infinity
        const db = b.distance ?? Infinity
        return da - db
      })
    }

    return list
  }, [courses, search, radius, sort, resolvedOrigin, balance])

  const affordableCount = useMemo(
    () => (balance == null ? null : filtered.filter((c) => c.affordable).length),
    [filtered, balance],
  )

  return (
    <>
      {/* Page Hero */}
      <section className="cb-hero">
        <div className="cb-hero-left">
          <div className="cb-eyebrow">Member Network</div>
          <h1 className="cb-title">Play anywhere.<br /><span className="cb-title-gold">Pay nothing extra.</span></h1>
          <p className="cb-sub">
            One membership. Every course in our network. Book with monthly credits —
            no green fees, no booking fees, ever.
          </p>
        </div>
        <div className="cb-hero-right">
          {isLoggedIn && balance !== undefined ? (
            <div className="cb-balance-card">
              <div className="cb-balance-label">Your credits</div>
              <div className="cb-balance-num">{balance}</div>
              <div className="cb-balance-sub">
                {affordableCount != null
                  ? `${affordableCount} course${affordableCount === 1 ? '' : 's'} in reach`
                  : 'ready to book'}
              </div>
            </div>
          ) : (
            <div className="cb-cta-card">
              <div className="cb-cta-note">Membership from</div>
              <div className="cb-cta-price">$99<span>/mo</span></div>
              <Link href="/pricing" className="cb-cta-btn">See plans →</Link>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="cb-filters">
        <input
          className="cb-search"
          type="text"
          placeholder="Search by course name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <form className="cb-zip-form" onSubmit={handleZipSubmit}>
          <input
            className="cb-zip-input"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Zip"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
          />
          <button type="submit" className="cb-zip-btn" disabled={isResolving}>
            {isResolving ? '…' : 'Find'}
          </button>
        </form>
        <div className="cb-radius-group">
          {([['all', 'Any distance'], [10, '10 mi'], [25, '25 mi'], [50, '50 mi']] as const).map(([val, label]) => {
            const active = radius === val
            const disabled = val !== 'all' && !resolvedOrigin
            return (
              <button
                key={String(val)}
                type="button"
                className={`cb-radius-pill${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                disabled={disabled}
                onClick={() => setRadius(val as RadiusFilter)}
              >
                {label}
              </button>
            )
          })}
        </div>
        <select
          className="cb-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="featured">Featured</option>
          {resolvedOrigin && <option value="distance-asc">Nearest first</option>}
          <option value="credit-asc">Credits: low → high</option>
          <option value="name-asc">Name: A → Z</option>
        </select>
      </section>

      {zipError && (
        <div className="cb-zip-error">{zipError}</div>
      )}

      {/* Results count */}
      <div className="cb-results-bar">
        <span>
          <strong>{filtered.length}</strong> course{filtered.length === 1 ? '' : 's'}
          {resolvedOrigin && radius !== 'all' ? ` within ${radius} miles` : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="cb-grid-wrap">
        <div className="cb-grid">
          {filtered.map((course, i) => {
            const isFeatured = i === 1 && sort === 'featured'
            const showPriceSignal = balance != null
            const notAffordable = showPriceSignal && !course.affordable
            const href = isLoggedIn
              ? `/book?course=${course.id}`
              : `/login?redirectTo=${encodeURIComponent(`/courses/${course.slug}`)}`

            return (
              <Link
                key={course.id}
                href={href}
                className={`c-card${isFeatured ? ' featured' : ''}${notAffordable ? ' muted' : ''}`}
              >
                <div className="c-thumb-wrap">
                  {course.photos[0] ? (
                    <Image
                      src={course.photos[0]}
                      alt={course.name}
                      fill
                      className="c-thumb"
                      sizes="(max-width: 700px) 100vw, (max-width: 1080px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="c-thumb-placeholder" />
                  )}
                  <div className={`c-tag${isFeatured ? ' featured-tag' : ''}`}>
                    {isFeatured
                      ? 'Featured'
                      : notAffordable
                      ? 'Not enough credits'
                      : 'Open today'}
                  </div>
                  {course.distance != null && (
                    <div className="c-distance">{course.distance.toFixed(1)} mi</div>
                  )}
                </div>
                <div className="c-body">
                  <div className="c-name">{course.name}</div>
                  <div className="c-meta">
                    {course.holes} Holes · {course.address}
                  </div>
                  <div className="c-divider" />
                  <div className="c-bottom-row">
                    <div className="c-credits-block">
                      <div className="c-credits-label">Credits</div>
                      <div className={`c-credits-num${isFeatured ? ' featured-num' : ''}`}>
                        {course.baseCreditCost}
                      </div>
                      <CreditDollarHint credits={course.baseCreditCost} plan={displayTier} />
                    </div>
                    <div className="c-right-col">
                      <div className={`c-status${notAffordable ? ' locked' : ''}`}>
                        <span className="c-status-dot" />
                        {notAffordable ? 'Locked' : 'Live'}
                      </div>
                      <span className="c-cta">
                        {isLoggedIn ? 'Book tee time →' : 'Sign in to book →'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {!isLoggedIn && (
        <section className="cb-join-banner">
          <div>
            <div className="cb-jb-eyebrow">Ready to play?</div>
            <div className="cb-jb-title">One membership. Every course.</div>
            <div className="cb-jb-sub">
              Credits reset monthly. No booking fees. No green fees. Cancel anytime.
            </div>
          </div>
          <div className="cb-jb-actions">
            <Link href="/pricing" className="cb-jb-btn">See plans &amp; pricing →</Link>
            <Link href="/login" className="cb-jb-link">Already a member →</Link>
          </div>
        </section>
      )}

      <style>{`
        :root {
          --cream: #EDE8DF;
          --cream-card: #F4F0EA;
          --cream-mid: #DDD7CC;
          --ink: #131110;
          --ink-mid: #4A4540;
          --ink-soft: #8A847C;
          --accent: #C84B2A;
          --gold: #C4893A;
          --green: #1FC76A;
        }

        main { background: var(--cream); }

        .cb-hero {
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 48px 40px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 48px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .cb-hero-left { max-width: 640px; }
        .cb-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
        }
        .cb-title {
          font-size: clamp(38px, 5vw, 60px);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: var(--ink);
          margin: 0 0 16px;
        }
        .cb-title-gold { color: var(--gold); }
        .cb-sub {
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.65;
          max-width: 520px;
        }

        .cb-hero-right { flex-shrink: 0; }
        .cb-balance-card,
        .cb-cta-card {
          background: var(--cream-card);
          border: 1px solid var(--cream-mid);
          border-radius: 14px;
          padding: 24px 28px;
          min-width: 220px;
          text-align: right;
        }
        .cb-balance-label,
        .cb-cta-note {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 10px;
        }
        .cb-balance-num {
          font-size: 48px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .cb-balance-sub {
          font-size: 12px;
          color: var(--ink-soft);
        }
        .cb-cta-price {
          font-size: 40px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 14px;
        }
        .cb-cta-price span { font-size: 16px; color: var(--ink-soft); font-weight: 400; }
        .cb-cta-btn {
          display: inline-block;
          background: var(--accent);
          color: #fff;
          padding: 11px 20px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.18s;
        }
        .cb-cta-btn:hover { background: #b03d21; }

        /* Filters row */
        .cb-filters {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 48px 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .cb-search {
          flex: 1;
          min-width: 240px;
          background: var(--cream-card);
          border: 1px solid var(--cream-mid);
          border-radius: 10px;
          padding: 12px 16px;
          font-family: inherit;
          font-size: 13px;
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .cb-search:focus {
          border-color: var(--gold);
          background: #fff;
        }
        .cb-search::placeholder { color: var(--ink-soft); }

        .cb-zip-form {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .cb-zip-input {
          width: 90px;
          background: var(--cream-card);
          border: 1px solid var(--cream-mid);
          border-radius: 10px;
          padding: 12px 14px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: var(--ink);
          outline: none;
          text-align: center;
        }
        .cb-zip-input:focus {
          border-color: var(--gold);
          background: #fff;
        }
        .cb-zip-btn {
          background: var(--ink);
          color: var(--cream);
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cb-zip-btn:hover:not(:disabled) { background: #2e2b27; }
        .cb-zip-btn:disabled { opacity: 0.5; cursor: wait; }

        .cb-radius-group { display: flex; gap: 6px; }
        .cb-radius-pill {
          background: transparent;
          border: 1px solid var(--cream-mid);
          color: var(--ink-mid);
          border-radius: 10px;
          padding: 11px 14px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cb-radius-pill:hover:not(:disabled):not(.active) {
          border-color: var(--gold);
          color: var(--ink);
        }
        .cb-radius-pill.active {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
        }
        .cb-radius-pill.disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .cb-sort {
          background: var(--cream-card);
          border: 1px solid var(--cream-mid);
          border-radius: 10px;
          padding: 12px 14px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          outline: none;
        }

        .cb-zip-error {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 48px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          color: var(--accent);
          letter-spacing: 0.04em;
        }

        /* Results bar */
        .cb-results-bar {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 48px 20px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-soft);
        }
        .cb-results-bar strong { color: var(--ink); font-weight: 700; }

        /* Grid */
        .cb-grid-wrap { max-width: 1280px; margin: 0 auto; padding: 0 48px 72px; }
        .cb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* ── Hybrid card (matches homepage redesign) ── */
        .c-card {
          background: var(--cream-card);
          border: 1px solid var(--cream-mid);
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          transition: box-shadow 0.22s, transform 0.22s, opacity 0.22s;
          position: relative;
          color: var(--ink);
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .c-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
          transform: translateY(-3px);
        }
        .c-card.featured {
          border-color: var(--gold);
          box-shadow: 0 4px 24px rgba(196,137,58,0.15);
        }
        .c-card.muted { opacity: 0.55; }
        .c-card.muted:hover { opacity: 0.75; }

        .c-thumb-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
          flex-shrink: 0;
          background: #E5DDD3;
        }
        .c-thumb {
          object-fit: cover;
          object-position: center 30%;
          transition: transform 0.4s ease;
        }
        .c-card:hover .c-thumb { transform: scale(1.04); }
        .c-thumb-placeholder { width: 100%; height: 100%; background: #E5DDD3; }

        .c-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 4px;
          background: rgba(20,18,14,0.72);
          color: #fff;
          backdrop-filter: blur(6px);
        }
        .c-tag.featured-tag { background: var(--gold); }
        .c-distance {
          position: absolute;
          top: 14px;
          right: 14px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 4px;
          background: rgba(244,240,234,0.96);
          color: var(--ink);
          border: 1px solid var(--cream-mid);
        }

        .c-body {
          padding: 22px 22px 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .c-name {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--ink);
          margin-bottom: 6px;
          line-height: 1.1;
        }
        .c-meta {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 18px;
        }
        .c-divider {
          height: 1px;
          background: var(--cream-mid);
          margin-bottom: 18px;
        }
        .c-bottom-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 22px;
          gap: 12px;
        }
        .c-credits-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 2px;
        }
        .c-credits-num {
          font-size: 38px;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: var(--ink);
          line-height: 1;
        }
        .c-credits-num.featured-num { color: var(--gold); }
        .c-right-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
        .c-status {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .c-status.locked { color: var(--ink-soft); }
        .c-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .c-cta {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--gold);
          border-bottom: 1px solid var(--gold);
          padding-bottom: 2px;
          transition: color 0.18s, border-color 0.18s;
          text-align: right;
        }
        .c-card:hover .c-cta { color: var(--accent); border-color: var(--accent); }

        /* Join banner */
        .cb-join-banner {
          max-width: 1280px;
          margin: 0 auto 64px;
          padding: 40px 48px;
          background: var(--ink);
          color: #fff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .cb-jb-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .cb-jb-title {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }
        .cb-jb-sub { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.6; }
        .cb-jb-actions { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        .cb-jb-btn {
          background: var(--gold);
          color: #fff;
          padding: 14px 26px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-decoration: none;
          text-transform: uppercase;
          transition: background 0.18s, transform 0.12s;
          white-space: nowrap;
        }
        .cb-jb-btn:hover { background: #b87a2e; transform: translateY(-1px); }
        .cb-jb-link {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .cb-jb-link:hover { color: #fff; }

        /* Responsive */
        @media (max-width: 1080px) {
          .cb-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .cb-hero {
            flex-direction: column;
            align-items: flex-start;
            padding: 48px 24px 28px;
            gap: 24px;
          }
          .cb-hero-right { align-self: stretch; }
          .cb-balance-card, .cb-cta-card { text-align: left; }
          .cb-filters { padding: 16px 24px 4px; gap: 8px; }
          .cb-search { min-width: 0; width: 100%; }
          .cb-results-bar { padding: 12px 24px 16px; }
          .cb-grid-wrap { padding: 0 24px 48px; }
          .cb-grid { grid-template-columns: 1fr; gap: 16px; }
          .cb-join-banner {
            margin: 0 24px 48px;
            padding: 32px 28px;
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
        }
      `}</style>
    </>
  )
}
