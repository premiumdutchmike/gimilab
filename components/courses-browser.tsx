'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CourseItem } from '@/app/(public)/courses/fallback-courses'

const PIN_ICON = (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z"/>
    <circle cx="10" cy="7" r="1.8"/>
  </svg>
)

const ARROW_ICON = (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="6" x2="10" y2="6"/>
    <polyline points="7 3 10 6 7 9"/>
  </svg>
)

type SortKey = 'featured' | 'credit-asc' | 'name-asc'
type RadiusFilter = 'all' | '10' | '25' | '50'

export default function CoursesBrowser({
  courses,
  isLoggedIn,
  balance,
}: {
  courses: CourseItem[]
  isLoggedIn: boolean
  balance?: number
}) {
  const [search, setSearch] = useState('')
  const [radius, setRadius] = useState<RadiusFilter>('all')
  const [sort, setSort] = useState<SortKey>('featured')

  const filtered = useMemo(() => {
    let list = [...courses]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))
    }

    // Radius filtering will be distance-based once we have lat/lng on courses
    // For now it filters by proximity labels if available

    if (sort === 'credit-asc') list.sort((a, b) => a.baseCreditCost - b.baseCreditCost)
    if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name))

    return list
  }, [courses, search, radius, sort])

  const creditLabel = (cost: number) => `${cost} Credits`

  return (
    <>
      {/* Page Hero */}
      <div className="cb-page-hero">
        <div>
          <div className="cb-eyebrow">Member Network</div>
          <h1 className="cb-title">Play anywhere.<br />Pay nothing extra.</h1>
          <p className="cb-sub">One membership. Every course in our network. Book with monthly credits — no green fees, no booking fees, ever.</p>
        </div>
        <div className="cb-hero-right">
          {isLoggedIn ? (
            <>
              {balance !== undefined && (
                <div className="cb-balance-pill">
                  <span className="cb-balance-num">{balance}</span>
                  <span className="cb-balance-label">Credits available</span>
                </div>
              )}
              <Link href="/dashboard" className="cb-join-hero-btn">
                Book a Tee Time
                <span className="cb-arrow-ring">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6"/>
                    <polyline points="7 3 10 6 7 9"/>
                  </svg>
                </span>
              </Link>
            </>
          ) : (
            <>
              <p className="cb-cta-note">Membership from $99/month</p>
              <Link href="/pricing" className="cb-join-hero-btn">
                Choose Your Plan
                <span className="cb-arrow-ring">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="6" x2="10" y2="6"/>
                    <polyline points="7 3 10 6 7 9"/>
                  </svg>
                </span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tier Strip */}
      <div className="cb-tier-strip">
        <div className="cb-tier-inner">
          <div className="cb-tier-item">
            <div className="cb-tier-num">{courses.length}</div>
            <div>
              <div className="cb-tier-label">Member Courses</div>
              <div className="cb-tier-sub">Greater Philadelphia Area</div>
            </div>
          </div>
          <div className="cb-tier-item">
            <div className="cb-tier-num">10%+</div>
            <div>
              <div className="cb-tier-label">Savings Per Round</div>
              <div className="cb-tier-sub">vs. public green fees</div>
            </div>
          </div>
          <div className="cb-tier-item">
            <div className="cb-tier-num">$0</div>
            <div>
              <div className="cb-tier-label">Booking Fees</div>
              <div className="cb-tier-sub">For any course, any time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="cb-filters">
        <input
          className="cb-search"
          type="text"
          placeholder="Search by course name or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="cb-radius-group">
          <span className="cb-radius-label">Distance</span>
          {([['all', 'All'], ['10', '10 mi'], ['25', '25 mi'], ['50', '50 mi']] as const).map(([val, label]) => (
            <button
              key={val}
              className={`cb-tag${radius === val ? ' active' : ''}`}
              onClick={() => setRadius(val as RadiusFilter)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Bar */}
      <div className="cb-results-bar">
        <span className="cb-results-count">
          Showing <strong>{filtered.length}</strong> member course{filtered.length !== 1 ? 's' : ''}
        </span>
        <select
          className="cb-sort"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
        >
          <option value="featured">Featured</option>
          <option value="credit-asc">Credit Cost: Low–High</option>
          <option value="name-asc">Name: A–Z</option>
        </select>
      </div>

      {/* Grid */}
      <div className="cb-grid-wrap">
        <div className="cb-grid">
          {filtered.map(course => (
            <div key={course.id} className="cb-card">
              <div className="cb-photo">
                {course.photos[0] ? (
                  <Image
                    src={course.photos[0]}
                    alt={course.name}
                    fill
                    className="cb-photo-img"
                    sizes="(max-width: 700px) 100vw, (max-width: 1080px) 50vw, 33vw"
                  />
                ) : (
                  <div className="cb-photo-placeholder" />
                )}
                <div className="cb-photo-overlay" />
                <span className="cb-credit-badge">{creditLabel(course.baseCreditCost)}</span>
              </div>
              <div className="cb-card-body">
                <div className="cb-card-name">{course.name}</div>
                <div className="cb-card-location">
                  {PIN_ICON}
                  {course.address}
                </div>
                <div className="cb-card-tags">
                  {course.tags.map(tag => (
                    <span key={tag} className="cb-card-tag">{tag}</span>
                  ))}
                </div>
                <div className="cb-card-footer">
                  {isLoggedIn ? (
                    <Link href={`/courses/${course.slug}`} className="cb-book-btn">Book Now</Link>
                  ) : (
                    <Link href="/pricing" className="cb-book-btn">Join to Book</Link>
                  )}
                  <Link href={`/courses/${course.slug}`} className="cb-detail-btn">Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join Banner */}
      {!isLoggedIn && (
        <div className="cb-join-banner">
          <div className="cb-join-banner-inner">
            <div>
              <div className="cb-jb-eyebrow">Ready to Play?</div>
              <div className="cb-jb-title">One membership. Every course.</div>
              <div className="cb-jb-sub">Credits reset monthly. No booking fees. No green fees. Cancel anytime.</div>
            </div>
            <div className="cb-jb-actions">
              <Link href="/pricing" className="cb-jb-btn">
                See Plans &amp; Pricing {ARROW_ICON}
              </Link>
              <Link href="/login" className="cb-jb-link">Already a member →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="cb-footer">
        <Link href="/" className="cb-footer-wm">gimmelab</Link>
        <div className="cb-footer-links">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/courses">Courses</Link>
        </div>
        <span className="cb-footer-copy">© 2026 Gimmelab</span>
      </footer>

      <style>{`
        .cb-page-hero { max-width: 1280px; margin: 0 auto; padding: 52px 40px 36px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; border-bottom: 1px solid rgba(12,12,11,0.09); }
        .cb-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #BF7B2E; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        .cb-title { font-size: 42px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.04em; line-height: 1.05; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        .cb-sub { font-size: 15px; color: #847C72; line-height: 1.6; max-width: 480px; font-family: 'Inter', sans-serif; }
        .cb-hero-right { flex-shrink: 0; text-align: right; }
        .cb-cta-note { font-size: 12px; color: #847C72; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        .cb-balance-pill { display: flex; align-items: baseline; gap: 7px; background: #FDFAF6; border: 1px solid rgba(191,123,46,0.3); border-radius: 2px; padding: 10px 18px; margin-bottom: 14px; }
        .cb-balance-num { font-size: 28px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.04em; line-height: 1; font-family: 'Inter', sans-serif; }
        .cb-balance-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #847C72; font-family: 'Inter', sans-serif; }
        .cb-join-hero-btn { display: inline-flex; align-items: center; gap: 10px; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 13px 24px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
        .cb-join-hero-btn:hover { background: #d48c37; }
        .cb-arrow-ring { width: 20px; height: 20px; border: 2px solid rgba(12,12,11,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        .cb-tier-strip { background: #F4EEE3; border-top: 1px solid #E5DDD3; border-bottom: 1px solid #E5DDD3; padding: 28px 0; }
        .cb-tier-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .cb-tier-item { padding: 20px 28px; display: flex; align-items: center; gap: 16px; background: #FFFFFF; }
        .cb-tier-num { font-size: 32px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.04em; flex-shrink: 0; line-height: 1; font-family: 'Inter', sans-serif; }
        .cb-tier-label { font-size: 14px; font-weight: 600; color: #0C0C0B; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .cb-tier-sub { font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }

        .cb-filters { max-width: 1280px; margin: 0 auto; padding: 20px 40px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .cb-search { flex: 1; min-width: 220px; background: #FFFFFF; border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 11px 16px 11px 40px; font-family: 'Inter', sans-serif; font-size: 13px; color: #0C0C0B; outline: none; transition: border-color 0.15s; background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 20 20' fill='none' stroke='%23847C72' stroke-width='1.8' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='9' cy='9' r='6'/%3E%3Cline x1='14' y1='14' x2='18' y2='18'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 14px center; }
        .cb-search::placeholder { color: #847C72; }
        .cb-search:focus { border-color: #BF7B2E; }
        .cb-radius-group { display: flex; align-items: center; gap: 6px; }
        .cb-radius-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; margin-right: 4px; font-family: 'Inter', sans-serif; }
        .cb-tag { background: transparent; border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 10px 16px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: #847C72; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
        .cb-tag:hover, .cb-tag.active { border-color: #BF7B2E; color: #BF7B2E; background: rgba(191,123,46,0.10); }

        .cb-results-bar { max-width: 1280px; margin: 0 auto; padding: 0 40px 18px; display: flex; align-items: center; justify-content: space-between; }
        .cb-results-count { font-size: 12px; font-weight: 600; color: #847C72; letter-spacing: 0.04em; font-family: 'Inter', sans-serif; }
        .cb-results-count strong { color: #0C0C0B; }
        .cb-sort { background: transparent; border: none; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #847C72; cursor: pointer; outline: none; }

        .cb-grid-wrap { max-width: 1280px; margin: 0 auto; padding: 0 40px 60px; }
        .cb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        .cb-card { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s; }
        .cb-card:hover { box-shadow: 0 8px 32px rgba(12,12,11,0.10); transform: translateY(-2px); }

        .cb-photo { position: relative; height: 210px; overflow: hidden; background: #E5DDD3; }
        .cb-photo-img { object-fit: cover; transition: transform 0.4s ease; }
        .cb-card:hover .cb-photo-img { transform: scale(1.04); }
        .cb-photo-placeholder { width: 100%; height: 100%; background: #E5DDD3; }
        .cb-photo-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,12,11,0.5) 0%, transparent 55%); }

        .cb-credit-badge { position: absolute; bottom: 12px; left: 12px; background: #BF7B2E; color: #0C0C0B; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; padding: 5px 11px; border-radius: 2px; text-transform: uppercase; font-family: 'Inter', sans-serif; }
        .cb-type-badge { position: absolute; top: 12px; right: 12px; background: rgba(253,250,246,0.92); color: #0C0C0B; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; padding: 4px 9px; border-radius: 2px; text-transform: uppercase; font-family: 'Inter', sans-serif; }

        .cb-card-body { padding: 20px 20px 22px; flex: 1; display: flex; flex-direction: column; }
        .cb-card-name { font-size: 17px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; margin-bottom: 6px; line-height: 1.2; font-family: 'Inter', sans-serif; }
        .cb-card-location { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #847C72; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .cb-card-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
        .cb-card-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; color: #847C72; background: #FDFAF6; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; padding: 4px 9px; text-transform: uppercase; font-family: 'Inter', sans-serif; }

        .cb-card-footer { margin-top: auto; display: flex; gap: 8px; }
        .cb-book-btn { flex: 1; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 13px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; text-align: center; text-decoration: none; display: block; transition: background 0.15s; }
        .cb-book-btn:hover { background: #d48c37; }
        .cb-detail-btn { background: transparent; border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 13px 14px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: #847C72; text-transform: uppercase; text-decoration: none; text-align: center; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
        .cb-detail-btn:hover { border-color: #0C0C0B; color: #0C0C0B; }

        .cb-join-banner { max-width: 1280px; margin: 0 auto 40px; padding: 0 40px; }
        .cb-join-banner-inner { background: #0C0C0B; padding: 40px 48px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
        .cb-jb-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #BF7B2E; text-transform: uppercase; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .cb-jb-title { font-size: 26px; font-weight: 700; color: #F4EEE3; letter-spacing: -0.03em; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .cb-jb-sub { font-size: 13px; color: #847C72; line-height: 1.6; font-family: 'Inter', sans-serif; }
        .cb-jb-actions { display: flex; gap: 12px; flex-shrink: 0; align-items: center; }
        .cb-jb-btn { display: inline-flex; align-items: center; gap: 10px; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 14px 28px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; white-space: nowrap; }
        .cb-jb-btn:hover { background: #d48c37; }
        .cb-jb-link { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #847C72; text-decoration: none; text-transform: uppercase; white-space: nowrap; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .cb-jb-link:hover { color: #F4EEE3; }

        .cb-footer { background: #0C0C0B; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .cb-footer-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 20px; color: #F4EEE3; letter-spacing: -0.02em; text-decoration: none; }
        .cb-footer-links { display: flex; gap: 24px; }
        .cb-footer-links a { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .cb-footer-links a:hover { color: #F4EEE3; }
        .cb-footer-copy { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }

        @media (max-width: 1080px) { .cb-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .cb-page-hero { flex-direction: column; align-items: flex-start; padding: 36px 20px 28px; }
          .cb-hero-right { text-align: left; }
          .cb-tier-inner { grid-template-columns: 1fr; }
          .cb-filters { padding: 16px 20px; }
          .cb-results-bar { padding: 0 20px 14px; }
          .cb-grid-wrap { padding: 0 20px 40px; }
          .cb-join-banner { padding: 0 20px; }
          .cb-join-banner-inner { flex-direction: column; align-items: flex-start; padding: 32px 28px; }
          .cb-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; gap: 16px; }
        }
        @media (max-width: 700px) { .cb-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}
