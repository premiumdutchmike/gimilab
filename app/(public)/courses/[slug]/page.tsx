import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { FALLBACK_COURSES } from '../fallback-courses'
import TeeTimes from './tee-times'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const course = FALLBACK_COURSES.find(c => c.slug === slug)
  return {
    title: course ? `${course.name} — gimmelab` : 'Course — gimmelab',
    description: course
      ? `Book ${course.name} with monthly credits. No green fees, no booking fees.`
      : 'Book with monthly credits — no green fees, no booking fees.',
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // Try DB first, fall back to static data
  const dbCourses = await db.select().from(courses).where(eq(courses.slug, slug))
  let course: {
    id: string
    name: string
    address: string
    holes: number
    baseCreditCost: number
    photos: string[]
    slug: string
    type: string
    tags: string[]
    description?: string
    par?: number
    rating?: number
    slope?: number
  } | undefined

  if (dbCourses.length > 0) {
    const c = dbCourses[0]
    course = {
      id: c.id,
      name: c.name,
      address: c.address,
      holes: c.holes ?? 18,
      baseCreditCost: c.baseCreditCost,
      photos: (c.photos as string[]) ?? [],
      slug: c.slug,
      type: 'Public',
      tags: [`${c.holes ?? 18} Holes`],
    }
  } else {
    course = FALLBACK_COURSES.find(c => c.slug === slug)
  }

  if (!course) notFound()

  const creditLabel = `${course.baseCreditCost} Credits / Round`
  const creditShort = `${course.baseCreditCost} credits`

  // Related courses (3 others, excluding current)
  const related = FALLBACK_COURSES.filter(c => c.slug !== slug).slice(0, 3)

  const CHECK_ICON = (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l2 2 4-4"/>
      <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Z"/>
    </svg>
  )

  return (
    <>
      {/* Breadcrumb */}
      <div className="cd-breadcrumb">
        <Link href="/">Home</Link>
        <span className="cd-bc-sep">→</span>
        <Link href="/courses">Courses</Link>
        <span className="cd-bc-sep">→</span>
        <span>{course.name}</span>
      </div>

      {/* Hero */}
      <div className="cd-hero">
        {course.photos[0] ? (
          <Image
            src={course.photos[0]}
            alt={course.name}
            fill
            className="cd-hero-img"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="cd-hero-placeholder" />
        )}
        <div className="cd-hero-overlay" />
        <div className="cd-hero-content">
          <div>
            <div className="cd-hero-eyebrow">{course.address} · Public Course</div>
            <h1 className="cd-hero-title">{course.name}</h1>
            <div className="cd-hero-location">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z"/>
                <circle cx="10" cy="7" r="1.8"/>
              </svg>
              {course.address}
            </div>
            <div className="cd-hero-badges">
              <span className="cd-hero-badge amber">{creditLabel}</span>
              {course.tags.map(tag => (
                <span key={tag} className="cd-hero-badge">{tag}</span>
              ))}
            </div>
          </div>
          <div className="cd-hero-cta">
            <div className="cd-hero-credit-note">{creditShort} per round · members only</div>
            {isLoggedIn ? (
              <Link href="/dashboard" className="cd-hero-join-btn">
                Book Now
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
                </svg>
              </Link>
            ) : (
              <Link href="/pricing" className="cd-hero-join-btn">
                Join to Book
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="cd-body-wrap">
        {/* Left column */}
        <div>
          {/* Stats */}
          <div className="cd-stats-row">
            <div className="cd-stat-box">
              <div className="cd-stat-label">Credit Cost</div>
              <div className="cd-stat-value" style={{ color: '#BF7B2E' }}>
                {course.baseCreditCost}
              </div>
              <div className="cd-stat-sub">per round</div>
            </div>
            <div className="cd-stat-box">
              <div className="cd-stat-label">Holes</div>
              <div className="cd-stat-value">{course.holes}</div>
              <div className="cd-stat-sub">{course.tags.find(t => t.startsWith('Par')) ?? 'Championship'}</div>
            </div>
            <div className="cd-stat-box">
              <div className="cd-stat-label">Type</div>
              <div className="cd-stat-value" style={{ fontSize: 16, marginTop: 4 }}>Public</div>
              <div className="cd-stat-sub">Course</div>
            </div>
            <div className="cd-stat-box">
              <div className="cd-stat-label">Booking Fee</div>
              <div className="cd-stat-value">$0</div>
              <div className="cd-stat-sub">always</div>
            </div>
          </div>

          {/* About */}
          <div className="cd-section-title">About This Course</div>
          <p className="cd-about-text">
            {course.name} is part of the Gimmelab member network — available for booking with your monthly credits, with no green fees or booking fees ever. One of the finest courses in our network, offering a premier golf experience for members at every tier.
          </p>

          {/* Photo strip */}
          {course.photos.length > 0 && (
            <>
              <div className="cd-section-title">Course Photos</div>
              <div className="cd-photo-strip">
                {course.photos.slice(0, 3).map((photo, i) => (
                  <div key={i} className="cd-photo-item">
                    <Image
                      src={photo}
                      alt={`${course.name} photo ${i + 1}`}
                      fill
                      className="cd-photo-img"
                      sizes="(max-width: 960px) 100vw, 400px"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tee Times */}
          <div className="cd-section-title">Available Tee Times</div>
          <TeeTimes courseId={course.id} isLoggedIn={isLoggedIn} />
        </div>

        {/* Sidebar */}
        <div>
          <div className="cd-sidebar">
            <div className="cd-sb-head">
              <div className="cd-sb-eyebrow">Member Booking</div>
              <div className="cd-sb-title">Book This Course</div>
              <div className="cd-sb-sub">
                {isLoggedIn
                  ? `Use your monthly credits to book ${course.name}.`
                  : `Join Gimmelab to unlock tee time booking at ${course.name} and every course in our network.`}
              </div>
            </div>
            <div className="cd-sb-body">
              <div className="cd-sb-row">
                <span className="cd-sb-label">Credit Cost</span>
                <span className="cd-sb-val amber">{creditShort} / round</span>
              </div>
              <div className="cd-sb-row">
                <span className="cd-sb-label">Booking Fee</span>
                <span className="cd-sb-val">$0</span>
              </div>
              <div className="cd-sb-row">
                <span className="cd-sb-label">Players</span>
                <span className="cd-sb-val">1–4 per slot</span>
              </div>
              <div className="cd-sb-row">
                <span className="cd-sb-label">Availability</span>
                <span className="cd-sb-val">7 days out</span>
              </div>

              <div className="cd-sb-divider" />

              {isLoggedIn ? (
                <Link href="/dashboard" className="cd-sb-join-btn">Book a Tee Time</Link>
              ) : (
                <>
                  <Link href="/pricing" className="cd-sb-join-btn">Choose a Plan — From $99/mo</Link>
                  <Link href="/login" className="cd-sb-login-link">Already a member? Log in →</Link>
                </>
              )}

              <div className="cd-sb-trust">
                {['No booking fees, ever', 'Credits reset monthly', 'Cancel anytime', 'Access all 12 courses'].map(item => (
                  <div key={item} className="cd-sb-trust-item">
                    {CHECK_ICON}
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="cd-related">
        <div className="cd-related-title">More Member Courses</div>
        <div className="cd-related-grid">
          {related.map(r => (
            <Link key={r.id} href={`/courses/${r.slug}`} className="cd-related-card">
              <div className="cd-related-photo">
                {r.photos[0] && (
                  <Image
                    src={r.photos[0]}
                    alt={r.name}
                    fill
                    className="cd-related-img"
                    sizes="(max-width: 800px) 50vw, 33vw"
                  />
                )}
                <div className="cd-related-overlay" />
                <span className="cd-related-credit">
                  {r.baseCreditCost} Credits
                </span>
              </div>
              <div className="cd-related-body">
                <div className="cd-related-name">{r.name}</div>
                <div className="cd-related-loc">{r.address} · {r.holes} Holes</div>
                <span className="cd-related-btn">View Course</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="cd-footer">
        <Link href="/" className="cd-footer-wm">gimmelab</Link>
        <div className="cd-footer-links">
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/courses">Courses</Link>
        </div>
        <span className="cd-footer-copy">© 2026 Gimmelab</span>
      </footer>

      <style>{`
        .cd-breadcrumb { max-width: 1280px; margin: 0 auto; padding: 16px 40px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }
        .cd-breadcrumb a { color: #847C72; text-decoration: none; transition: color 0.15s; }
        .cd-breadcrumb a:hover { color: #BF7B2E; }
        .cd-bc-sep { opacity: 0.4; }

        .cd-hero { position: relative; height: 460px; overflow: hidden; background: #1E1D1B; }
        .cd-hero-img { object-fit: cover; }
        .cd-hero-placeholder { width: 100%; height: 100%; background: #1E1D1B; }
        .cd-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,12,11,0.75) 0%, rgba(12,12,11,0.1) 60%); }
        .cd-hero-content { position: absolute; bottom: 0; left: 0; right: 0; max-width: 1280px; margin: 0 auto; padding: 40px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
        .cd-hero-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #BF7B2E; text-transform: uppercase; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .cd-hero-title { font-size: 38px; font-weight: 700; color: #F4EEE3; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        .cd-hero-location { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(244,238,227,0.7); font-family: 'Inter', sans-serif; }
        .cd-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .cd-hero-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; background: rgba(244,238,227,0.12); border: 1px solid rgba(244,238,227,0.2); border-radius: 2px; padding: 5px 11px; color: #F4EEE3; text-transform: uppercase; font-family: 'Inter', sans-serif; }
        .cd-hero-badge.amber { background: #BF7B2E; border-color: #BF7B2E; color: #0C0C0B; }
        .cd-hero-cta { flex-shrink: 0; text-align: right; }
        .cd-hero-credit-note { font-size: 12px; color: rgba(244,238,227,0.6); margin-bottom: 10px; font-family: 'Inter', sans-serif; }
        .cd-hero-join-btn { display: inline-flex; align-items: center; gap: 10px; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 15px 28px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
        .cd-hero-join-btn:hover { background: #d48c37; }

        .cd-body-wrap { max-width: 1280px; margin: 0 auto; padding: 40px 40px 60px; display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }

        .cd-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; margin-bottom: 32px; }
        .cd-stat-box { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); padding: 18px 20px; }
        .cd-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #847C72; text-transform: uppercase; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .cd-stat-value { font-size: 22px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; line-height: 1; font-family: 'Inter', sans-serif; }
        .cd-stat-sub { font-size: 11px; color: #847C72; margin-top: 2px; font-family: 'Inter', sans-serif; }

        .cd-section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #847C72; text-transform: uppercase; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .cd-about-text { font-size: 14px; color: #1E1D1B; line-height: 1.75; margin-bottom: 32px; font-family: 'Inter', sans-serif; }

        .cd-photo-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 32px; }
        .cd-photo-item { height: 160px; overflow: hidden; border-radius: 2px; background: #E5DDD3; position: relative; }
        .cd-photo-img { object-fit: cover; transition: transform 0.3s; }
        .cd-photo-item:hover .cd-photo-img { transform: scale(1.04); }

        .cd-sidebar { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; overflow: hidden; position: sticky; top: 82px; }
        .cd-sb-head { background: #0C0C0B; padding: 20px 24px; }
        .cd-sb-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; color: #BF7B2E; text-transform: uppercase; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .cd-sb-title { font-size: 16px; font-weight: 700; color: #F4EEE3; margin-bottom: 4px; letter-spacing: -0.01em; font-family: 'Inter', sans-serif; }
        .cd-sb-sub { font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }
        .cd-sb-body { padding: 20px 24px; }
        .cd-sb-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(12,12,11,0.09); }
        .cd-sb-row:last-of-type { border-bottom: none; }
        .cd-sb-label { font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }
        .cd-sb-val { font-size: 13px; font-weight: 600; color: #0C0C0B; font-family: 'Inter', sans-serif; }
        .cd-sb-val.amber { color: #BF7B2E; }
        .cd-sb-divider { height: 1px; background: rgba(12,12,11,0.09); margin: 16px 0; }
        .cd-sb-join-btn { display: block; width: 100%; background: #BF7B2E; color: #0C0C0B; border: none; border-radius: 2px; padding: 14px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; text-align: center; transition: background 0.15s; margin-bottom: 10px; }
        .cd-sb-join-btn:hover { background: #d48c37; }
        .cd-sb-login-link { display: block; text-align: center; font-size: 12px; color: #847C72; text-decoration: none; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .cd-sb-login-link:hover { color: #0C0C0B; }
        .cd-sb-trust { margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(12,12,11,0.09); display: flex; flex-direction: column; gap: 8px; }
        .cd-sb-trust-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }
        .cd-sb-trust-item svg { flex-shrink: 0; color: #BF7B2E; }

        .cd-related { max-width: 1280px; margin: 0 auto; padding: 0 40px 60px; }
        .cd-related-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #847C72; text-transform: uppercase; margin-bottom: 16px; font-family: 'Inter', sans-serif; }
        .cd-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .cd-related-card { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; overflow: hidden; text-decoration: none; color: #0C0C0B; transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column; }
        .cd-related-card:hover { box-shadow: 0 6px 24px rgba(12,12,11,0.08); transform: translateY(-2px); }
        .cd-related-photo { height: 140px; overflow: hidden; background: #E5DDD3; position: relative; }
        .cd-related-img { object-fit: cover; transition: transform 0.3s; }
        .cd-related-card:hover .cd-related-img { transform: scale(1.04); }
        .cd-related-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,12,11,0.4) 0%, transparent 60%); }
        .cd-related-credit { position: absolute; bottom: 10px; left: 10px; background: #BF7B2E; color: #0C0C0B; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 2px; text-transform: uppercase; font-family: 'Inter', sans-serif; }
        .cd-related-body { padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1; }
        .cd-related-name { font-size: 13px; font-weight: 700; color: #0C0C0B; margin-bottom: 4px; letter-spacing: -0.01em; font-family: 'Inter', sans-serif; }
        .cd-related-loc { font-size: 11px; color: #847C72; margin-bottom: 12px; font-family: 'Inter', sans-serif; }
        .cd-related-btn { display: block; width: 100%; background: transparent; border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 9px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #847C72; text-transform: uppercase; text-decoration: none; text-align: center; transition: all 0.15s; margin-top: auto; }
        .cd-related-btn:hover { border-color: #BF7B2E; color: #BF7B2E; background: rgba(191,123,46,0.10); }

        .cd-footer { background: #0C0C0B; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .cd-footer-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 20px; color: #F4EEE3; letter-spacing: -0.02em; text-decoration: none; }
        .cd-footer-links { display: flex; gap: 24px; }
        .cd-footer-links a { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .cd-footer-links a:hover { color: #F4EEE3; }
        .cd-footer-copy { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }

        @media (max-width: 960px) { .cd-body-wrap { grid-template-columns: 1fr; } .cd-related-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 768px) {
          .cd-hero-content { flex-direction: column; align-items: flex-start; padding: 24px 20px; }
          .cd-hero-cta { text-align: left; }
          .cd-body-wrap { padding: 24px 20px 40px; }
          .cd-stats-row { grid-template-columns: repeat(2, 1fr); }
          .cd-photo-strip { grid-template-columns: 1fr 1fr; }
          .cd-related { padding: 0 20px 40px; }
          .cd-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; gap: 16px; }
        }
        @media (max-width: 500px) { .cd-related-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}
