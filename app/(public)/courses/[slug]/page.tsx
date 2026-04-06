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
import CreditDollarHint from '@/components/credit-dollar-hint'

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
    lat?: number | null
    lng?: number | null
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
      lat: c.lat != null ? parseFloat(c.lat as unknown as string) : null,
      lng: c.lng != null ? parseFloat(c.lng as unknown as string) : null,
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
            <div className="cd-hero-eyebrow">Public course</div>
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
            <CreditDollarHint credits={course.baseCreditCost} />
            {isLoggedIn ? (
              <Link href={`/book?course=${course.id}`} className="cd-hero-join-btn">
                Book Now
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7 3 10 6 7 9"/>
                </svg>
              </Link>
            ) : (
              <Link
                href={`/login?redirectTo=${encodeURIComponent(`/courses/${slug}`)}`}
                className="cd-hero-join-btn"
              >
                Sign in to Book
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
              <CreditDollarHint credits={course.baseCreditCost} />
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

          {/* How Gimmelab works at this course */}
          <div className="cd-host-eyebrow">The Experience</div>
          <div className="cd-host-heading">How Gimmelab works at {course.name}.</div>
          <div className="cd-host-grid">
            <div className="cd-host-card">
              <svg className="cd-host-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="3.5" width="15" height="11" rx="1.5"/>
                <path d="M2.5 7h15"/>
                <path d="M7 17h6"/>
              </svg>
              <div className="cd-host-num">01</div>
              <div className="cd-host-title">Browse & book in under a minute.</div>
              <div className="cd-host-body">Real-time availability right here on this page. Use monthly credits — no green fees, no booking fees, no phone calls. Need to bring friends? Add them when you book, one credit pool covers the whole foursome.</div>
            </div>
            <div className="cd-host-card">
              <svg className="cd-host-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="2.5" width="6" height="6" rx="0.5"/>
                <rect x="11.5" y="2.5" width="6" height="6" rx="0.5"/>
                <rect x="2.5" y="11.5" width="6" height="6" rx="0.5"/>
                <path d="M11.5 11.5h2.5v2.5M17.5 11.5v2.5M11.5 17.5h2.5M15.5 15.5h2v2"/>
              </svg>
              <div className="cd-host-num">02</div>
              <div className="cd-host-title">Show your QR at the pro shop.</div>
              <div className="cd-host-body">On your tee time, walk into the pro shop and show the QR code from your confirmation. No card swipe, no payment back-and-forth. Scan and play.</div>
            </div>
            <div className="cd-host-card">
              <svg className="cd-host-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17V3"/>
                <path d="M5 3h10l-2.5 3L15 9H5"/>
              </svg>
              <div className="cd-host-num">03</div>
              <div className="cd-host-title">Tee off. Come back whenever.</div>
              <div className="cd-host-body">Credits roll over on Core and Heavy plans, so a rainout doesn&apos;t mean you lose the round. Rate the course after your round to unlock better recommendations across the network.</div>
            </div>
          </div>

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
          <TeeTimes courseId={course.id} slug={slug} isLoggedIn={isLoggedIn} />
        </div>

        {/* Sidebar */}
        <div className="cd-sidebar-col">
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
                <Link href={`/book?course=${course.id}`} className="cd-sb-join-btn">Book a Tee Time</Link>
              ) : (
                <>
                  <Link
                    href={`/signup?redirectTo=${encodeURIComponent(`/courses/${slug}`)}`}
                    className="cd-sb-join-btn"
                  >
                    Choose a Plan — From $99/mo
                  </Link>
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent(`/courses/${slug}`)}`}
                    className="cd-sb-login-link"
                  >
                    Already a member? Log in →
                  </Link>
                </>
              )}

              <div className="cd-sb-trust">
                {['No booking fees, ever', 'Monthly credits included', 'Cancel anytime', 'Access all member courses'].map(item => (
                  <div key={item} className="cd-sb-trust-item">
                    {CHECK_ICON}
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="cd-map-card">
            <div className="cd-map-embed">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(course.name + ', ' + course.address)}&zoom=14`}
                title={`Map of ${course.name}`}
              />
            </div>
            <div className="cd-map-info">
              <div className="cd-map-address">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 2C7.24 2 5 4.24 5 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5Z"/>
                  <circle cx="10" cy="7" r="1.8"/>
                </svg>
                {course.address}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(course.name + ', ' + course.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cd-map-directions"
              >
                Get Directions →
              </a>
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

        .cd-body-wrap { max-width: 1280px; margin: 0 auto; padding: 40px 40px 60px; display: grid; grid-template-columns: 1fr 360px; gap: 48px; align-items: start; }

        .cd-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; margin-bottom: 32px; }
        .cd-stat-box { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); padding: 18px 20px; }
        .cd-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #847C72; text-transform: uppercase; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .cd-stat-value { font-size: 22px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; line-height: 1; font-family: 'Inter', sans-serif; }
        .cd-stat-sub { font-size: 11px; color: #847C72; margin-top: 2px; font-family: 'Inter', sans-serif; }

        .cd-section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #847C72; text-transform: uppercase; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .cd-about-text { font-size: 14px; color: #1E1D1B; line-height: 1.75; margin-bottom: 32px; font-family: 'Inter', sans-serif; }

        .cd-host-eyebrow { font-family: var(--font-space-mono), 'Space Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; color: #C4893A; text-transform: uppercase; margin-bottom: 10px; }
        .cd-host-heading { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #847C72; text-transform: uppercase; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .cd-host-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 32px; }
        .cd-host-card { background: #F4F0EA; border: 1px solid #DDD7CC; border-radius: 14px; padding: 28px 28px; display: flex; flex-direction: column; }
        .cd-host-icon { color: #C4893A; opacity: 0.85; margin-bottom: 14px; }
        .cd-host-num { font-family: var(--font-inter), 'Inter', sans-serif; font-size: 32px; font-weight: 700; letter-spacing: -0.03em; color: #C4893A; line-height: 1; }
        .cd-host-title { font-size: 18px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; margin-top: 12px; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .cd-host-body { font-size: 13px; line-height: 1.6; color: #847C72; font-family: 'Inter', sans-serif; }

        .cd-photo-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 32px; }
        .cd-photo-item { height: 160px; overflow: hidden; border-radius: 2px; background: #E5DDD3; position: relative; }
        .cd-photo-img { object-fit: cover; transition: transform 0.3s; }
        .cd-photo-item:hover .cd-photo-img { transform: scale(1.04); }

        .cd-sidebar-col { position: sticky; top: 82px; display: flex; flex-direction: column; gap: 16px; }
        .cd-sidebar { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; overflow: hidden; }
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

        .cd-map-card { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); border-radius: 2px; overflow: hidden; }
        .cd-map-embed { background: #E5DDD3; }
        .cd-map-embed iframe { display: block; }
        .cd-map-info { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .cd-map-address { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #847C72; font-family: 'Inter', sans-serif; }
        .cd-map-directions { font-size: 12px; font-weight: 700; color: #BF7B2E; text-decoration: none; white-space: nowrap; font-family: 'Inter', sans-serif; transition: opacity 0.15s; }
        .cd-map-directions:hover { opacity: 0.75; }

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
          .cd-hero { height: auto; min-height: 420px; }
          .cd-hero-content { flex-direction: column; align-items: flex-start; padding: 32px 20px 28px; gap: 18px; position: relative; }
          .cd-hero-eyebrow { margin-bottom: 10px; white-space: normal; word-break: break-word; }
          .cd-hero-title { font-size: clamp(26px, 7.5vw, 34px); margin-bottom: 12px; word-break: break-word; }
          .cd-hero-location { font-size: 12px; word-break: break-word; }
          .cd-hero-cta { text-align: left; width: 100%; }
          .cd-body-wrap { padding: 24px 20px 40px; }
          .cd-stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .cd-stat-value { font-size: clamp(20px, 6vw, 22px); word-break: break-word; }
          .cd-photo-strip { grid-template-columns: 1fr 1fr; }
          .cd-host-grid { grid-template-columns: 1fr; }
          .cd-related { padding: 0 20px 40px; }
          .cd-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; gap: 16px; }
        }
        @media (max-width: 500px) { .cd-related-grid { grid-template-columns: 1fr; } }
        @media (max-width: 480px) {
          .cd-hero-content { padding: 28px 16px 24px; }
          .cd-hero-title { font-size: clamp(24px, 8vw, 30px); line-height: 1.15; }
          .cd-stat-box { padding: 14px 12px; }
          .cd-stat-label { font-size: 9px; }
          .cd-stat-value { font-size: clamp(18px, 6.2vw, 22px); }
          .cd-stat-sub { font-size: 10px; }
        }
      `}</style>
    </>
  )
}
