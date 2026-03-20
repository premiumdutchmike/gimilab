import Link from 'next/link'
import Image from 'next/image'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import { ReviewCarousel } from '@/components/homepage/review-carousel'
import { CourseScroll } from '@/components/homepage/course-scroll'

export const metadata = {
  title: 'OneGolf — One Membership. Every Course.',
  description: 'Monthly credit subscription for golf. Book tee times at top courses, no booking fees.',
}

// Flip to true once /public/hero-golf.jpg is placed
const HERO_IMAGE_READY = false
// Flip to true once /public/editorial-1.jpg, editorial-2.jpg, editorial-3.jpg are placed
const EDITORIAL_IMAGES_READY = false

const EDITORIAL_CARDS = [
  { src: '/editorial-1.jpg', label: 'Choose a plan', rotate: '-3deg', width: 230, height: 300, top: 0, left: 20 },
  { src: '/editorial-2.jpg', label: 'Browse courses', rotate: '2.5deg', width: 200, height: 270, top: 80, left: 220 },
  { src: '/editorial-3.jpg', label: 'Book & play', rotate: '-1.5deg', width: 180, height: 240, top: 10, left: 395 },
]

export default async function HomePage() {
  const topCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      address: courses.address,
      holes: courses.holes,
      baseCreditCost: courses.baseCreditCost,
      photos: courses.photos,
    })
    .from(courses)
    .where(eq(courses.status, 'active'))
    .limit(5)

  return (
    <main style={{ background: '#faf9f6', color: '#0d0d0d' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 640, overflow: 'hidden' }}>
        {/* Background */}
        {HERO_IMAGE_READY ? (
          <Image
            src="/hero-golf.jpg"
            alt=""
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 35%', filter: 'brightness(0.55)' }}
            className="hero-bg-img"
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
        )}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.1) 50%, rgba(0,0,0,.65))' }} />

        {/* Headline */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -54%)', textAlign: 'center', width: '100%', zIndex: 5 }}>
          {/* Live pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100,
            padding: '8px 18px', marginBottom: 24,
            fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)',
          }}>
            <span className="live-dot" />
            Now live in your area
          </div>
          {['ONE', 'GOLF'].map(word => (
            <span key={word} style={{
              display: 'block',
              fontSize: 'clamp(90px, 16vw, 220px)',
              fontWeight: 900, letterSpacing: '-5px', lineHeight: 0.88,
              color: '#fff', textTransform: 'uppercase',
            }}>
              {word}
            </span>
          ))}
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '32px 40px', gap: 24,
          background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', lineHeight: 2, margin: 0 }}>
            Monthly credits · Any partner course<br />No booking fees · Cancel anytime
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <Link href="/signup" style={{ background: '#fff', color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '13px 32px', textDecoration: 'none', borderRadius: 6 }}>
              GET STARTED
            </Link>
            <Link href="/pricing" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
              SEE PRICING →
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', overflow: 'hidden', padding: '14px 0' }}>
        <div className="marquee-track">
          {[
            'MONTHLY CREDITS', '✦ ANY COURSE', 'ZERO BOOKING FEES',
            '✦ CANCEL ANYTIME', 'FROM $99 / MO', '✦ 03 TIERS',
            'MONTHLY CREDITS', '✦ ANY COURSE', 'ZERO BOOKING FEES',
            '✦ CANCEL ANYTIME', 'FROM $99 / MO', '✦ 03 TIERS',
          ].map((item, i) => (
            <span key={i} className={item.startsWith('✦') ? 'marquee-item accent' : 'marquee-item'}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── EDITORIAL ── */}
      <section id="how-it-works" style={{ background: '#faf9f6', padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Ghost text */}
        <div style={{ position: 'absolute', top: 20, left: -10, fontSize: 'clamp(130px, 22vw, 280px)', fontWeight: 900, letterSpacing: '-8px', color: 'rgba(0,0,0,0.04)', textTransform: 'uppercase', userSelect: 'none', pointerEvents: 'none', lineHeight: 1 }}>
          PLAY
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 60px', gap: 60 }}>
          {/* Copy */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#1a5c38', marginBottom: 16 }}>
              One membership
            </p>
            <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#0d0d0d', textTransform: 'uppercase' }}>
              Golf,<br />on your<br />terms.
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75, marginTop: 20, maxWidth: 380 }}>
              Book tee times at any partner course using monthly credits. No fees, no phone calls. Pick a time, show up, play.
            </p>
            <div style={{ marginTop: 36, borderTop: '1px solid #e5e7eb' }}>
              {[
                { num: '01', title: 'Choose a membership tier' },
                { num: '02', title: 'Browse partner courses' },
                { num: '03', title: 'Book with credits, show QR' },
              ].map(step => (
                <div key={step.num} className="step-row">
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1a5c38', minWidth: 28 }}>{step.num}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0d0d0d', flex: 1 }}>{step.title}</span>
                  <span style={{ fontSize: 14, color: '#e5e7eb' }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating cards */}
          <div style={{ position: 'relative', height: 420 }}>
            {/* Badge: $0 fees */}
            <div className="float-badge" style={{ position: 'absolute', top: -10, left: 8, zIndex: 10, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', animationDelay: '.5s' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0d0d0d', lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginTop: 2 }}>Booking Fees</div>
            </div>

            {EDITORIAL_CARDS.map((card, i) => (
              <div
                key={i}
                className="float-card"
                style={{
                  position: 'absolute',
                  width: card.width, height: card.height,
                  top: card.top, left: card.left,
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                  transform: `rotate(${card.rotate})`,
                  transition: 'transform .3s, box-shadow .3s',
                }}
              >
                {EDITORIAL_IMAGES_READY ? (
                  <Image
                    src={`/editorial-${i + 1}.jpg`}
                    alt={card.label}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="300px"
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: `hsl(${140 + i * 20}, 20%, ${40 - i * 5}%)` }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {card.label}
                </div>
              </div>
            ))}

            {/* Badge: 3× tiers */}
            <div className="float-badge" style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', animationDelay: '1.5s' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0d0d0d', lineHeight: 1 }}>3×</div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b7280', marginTop: 2 }}>Tier options</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{ background: '#1a5c38', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { num: '03', label: 'Membership Tiers' },
          { num: '$99', label: 'Starting per month' },
          { num: '0', label: 'Booking Fees. Ever.' },
          { num: '∞', label: 'Partner courses' },
        ].map((stat, i) => (
          <div key={i} style={{ padding: '40px 36px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', color: '#fff', lineHeight: 1 }}>{stat.num}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── SAVINGS ── */}
      <section style={{ background: '#fff', padding: '100px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 60, gap: 40 }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, textTransform: 'uppercase' }}>
            Play more.<br /><span style={{ color: '#1a5c38' }}>Spend less.</span>
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', maxWidth: 280, lineHeight: 1.7, textAlign: 'right', flexShrink: 0 }}>
            The average golfer pays $85 per round. With OneGolf Core, 3 rounds a month costs $149. The math is a no-brainer.
          </p>
        </div>

        {/* Comparison grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, borderRadius: 16, overflow: 'hidden' }}>
          {/* Without */}
          <div style={{ background: '#f3f1ec', padding: 40 }}>
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(0,0,0,0.08)', color: '#666', marginBottom: 28 }}>
              Without OneGolf / year
            </div>
            {[
              { name: '36 rounds × $85', price: '$3,060' },
              { name: 'Booking fees', price: '$180' },
              { name: 'Phone calls to pro shop', price: 'Endless' },
            ].map(row => (
              <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 13, color: '#777' }}>{row.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0d0d0d' }}>{row.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, paddingTop: 20, borderTop: '2px solid rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#aaa' }}>Per year</span>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#0d0d0d' }}>$3,240</span>
            </div>
          </div>

          {/* With OneGolf */}
          <div style={{ background: '#1a5c38', padding: 40 }}>
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', marginBottom: 28 }}>
              With OneGolf Core / year
            </div>
            {[
              { name: '$149/mo × 12', price: '$1,788' },
              { name: 'Booking fees', price: '$0' },
              { name: 'Phone calls', price: 'Zero' },
            ].map(row => (
              <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{row.name}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{row.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, paddingTop: 20, borderTop: '2px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>Per year</span>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>$1,788</span>
            </div>
          </div>
        </div>

        {/* Callout */}
        <div style={{ background: '#0d0d0d', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#4ade80' }}>YOU SAVE</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>$1,452 / year</div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>That&apos;s a new driver. New irons. Both.</div>
          </div>
          <Link href="/signup" style={{ background: '#1a5c38', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '14px 32px', textDecoration: 'none', borderRadius: 8, flexShrink: 0 }}>
            START SAVING TODAY
          </Link>
        </div>
      </section>

      {/* ── TOP COURSES ── */}
      <section id="courses" style={{ background: '#faf9f6', padding: '80px 0 80px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, paddingRight: 60 }}>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
            Top Courses
          </h2>
          <Link href="/courses" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none', borderBottom: '1px solid #e5e7eb', paddingBottom: 2 }}>
            View all →
          </Link>
        </div>
        <CourseScroll courses={topCourses} />
      </section>

      {/* ── REVIEWS ── */}
      <ReviewCarousel />

      {/* ── DARK CTA ── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
        <div style={{ background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
          {/* Placeholder until golfer photo placed */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a3a28 0%, #0d1f16 100%)' }} />
        </div>
        <div style={{ background: '#0d0d0d', padding: '72px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#1a5c38', marginBottom: 20 }}>
            Join today
          </p>
          <h2 style={{ fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: '#fff', textTransform: 'uppercase', marginBottom: 16 }}>
            Ready<br />to play?
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, maxWidth: 340, marginBottom: 40 }}>
            Pick a plan, get your credits, book your first round. Setup takes 2 minutes. No contracts.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/signup" style={{ background: '#1a5c38', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '14px 32px', textDecoration: 'none', borderRadius: 8 }}>
              GET STARTED
            </Link>
            <Link href="/pricing" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '13px 28px', textDecoration: 'none', borderRadius: 6 }}>
              View pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000', padding: '40px 60px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 32, borderBottom: '1px solid #111' }}>
          <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '4px', color: '#fff' }}>ONEGOLF</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { href: '#how-it-works', label: 'How it works' },
              { href: '#courses', label: 'Courses' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/login', label: 'Log In' },
              { href: '/signup', label: 'Join' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#333', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 10, color: '#333' }}>© 2026 OneGolf</span>
        </div>
        <div style={{ fontSize: 'clamp(70px, 14vw, 190px)', fontWeight: 900, letterSpacing: '-8px', color: '#111', textTransform: 'uppercase', lineHeight: 0.82, overflow: 'hidden', userSelect: 'none' }}>
          ONEGOLF
        </div>
      </footer>

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes heroZoom { to { transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.3); } }

        .marquee-track { display: flex; white-space: nowrap; animation: marquee 22s linear infinite; }
        .marquee-item { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4c4c0; padding: 0 24px; border-right: 1px solid #f0f0f0; flex-shrink: 0; }
        .marquee-item.accent { color: #1a5c38; }

        .hero-bg-img { animation: heroZoom 8s ease-out forwards; transform: scale(1.04); }

        .live-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }

        .float-badge { animation: float 3s ease-in-out infinite; }

        .float-card:hover { transform: rotate(0deg) translateY(-6px) !important; box-shadow: 0 30px 80px rgba(0,0,0,0.2) !important; }

        .step-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid #e5e7eb; cursor: default; transition: padding-left .2s; }
        .step-row:last-child { border-bottom: none; }
        .step-row:hover { padding-left: 8px; }
      `}</style>

    </main>
  )
}
