import Link from 'next/link'
import Image from 'next/image'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'

export const metadata = {
  title: 'gimmelab — One membership. Every course.',
  description: 'Book tee times at any partner course using monthly credits. No booking fees, no phone calls.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let topCourses: { id: string; name: string; address: string; holes: number | null; baseCreditCost: number; photos: string[] | null }[] = []
  try {
    topCourses = await db
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
      .limit(9)
  } catch {
    // DB unavailable at build time — homepage renders with fallback content
  }

  // Fallback imagery for course cards when no DB courses exist
  const fallbackCourses = [
    { id: '1', name: 'Pebble Creek Municipal', meta: '18 holes · Par 72 · 85 credits', tag: 'Open today', img: '/imagery/course-1.jpeg' },
    { id: '2', name: 'Ridgeline Public Golf', meta: '18 holes · Par 70 · 95 credits', tag: 'Featured', img: '/imagery/course-2.png' },
    { id: '3', name: 'Sundown Valley Links', meta: '9/18 holes · Par 35 · 45 credits', tag: '9-hole option', img: '/imagery/course-3.jpeg' },
    { id: '4', name: 'Westchase Golf Club', meta: '18 holes · Par 72 · 90 credits', tag: 'New', img: '/imagery/course-4.png' },
    { id: '5', name: 'Bayou Oaks at City Park', meta: '18 holes · Par 72 · 75 credits', tag: 'Popular', img: '/imagery/course-5.png' },
    { id: '6', name: 'Palm Harbor Golf Club', meta: '18 holes · Par 71 · 110 credits', tag: 'Top rated', img: '/imagery/course-6.jpeg' },
  ]

  const displayCourses = topCourses.length > 0
    ? topCourses.map((c, i) => ({
        id: c.id,
        name: c.name,
        meta: `${c.holes} holes · ${c.baseCreditCost} credits`,
        tag: i === 1 ? 'Featured' : 'Open today',
        img: (c.photos as string[])?.[0] ?? fallbackCourses[i]?.img ?? fallbackCourses[0].img,
      }))
    : fallbackCourses

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <Image
          src="/imagery/ec840ae06489fb0b720fce0607e3ffcd.jpg"
          alt="Golf course at golden hour"
          fill
          priority
          className="hero-img"
          sizes="100vw"
        />
        <div className="hero-overlay" />
        <div className="hero-word">GIMMELAB</div>
        <div className="hero-content">
          <div className="hero-left">
            <div className="label hero-eyebrow">Credit-based tee times</div>
            <h1 className="hl hero-headline">Golf,<br />on your<br /><em>terms.</em></h1>
            <p className="hero-sub">Book any course with monthly credits. No phone calls, no rate anxiety, no blackout dates.</p>
            <div className="hero-actions">
              <Link href="/signup" className="btn-hero-coral">Get started →</Link>
              <Link href="/pricing" className="btn-hero-outline">See plans</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-label">Now available</div>
            <div className="hero-card-course">Westchase Golf Club</div>
            <div className="hero-card-meta">Tampa Bay · Sat 8:30am · 4 spots</div>
            <div className="hero-card-creds">
              <span className="hero-card-creds-label">Cost</span>
              <span className="hero-card-creds-val">85 credits</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how-section" id="how-it-works">
        <div className="section-bar">
          <span className="label" style={{ color: 'rgba(132,124,114,0.45)' }}>How it works</span>
          <span className="label" style={{ color: 'rgba(132,124,114,0.45)' }}>03 steps</span>
        </div>
        <div className="how-grid">
          <div className="how-item">
            <div className="how-num">01</div>
            <h3 className="hl how-title">Choose your membership.</h3>
            <p className="how-body">Casual, Core, or Heavy. Credits refresh every month. Pick the plan that fits how often you play.</p>
          </div>
          <div className="how-item">
            <div className="how-num">02</div>
            <h3 className="hl how-title">Browse partner courses.</h3>
            <p className="how-body">Find courses near you. View live availability. Filter by date, time, and players. No phone calls. No waiting on hold.</p>
          </div>
          <div className="how-item">
            <div className="how-num">03</div>
            <h3 className="hl how-title">Book with credits, show QR.</h3>
            <p className="how-body">Confirm in seconds. Show your QR code at the course. Zero surprise fees. Every time.</p>
          </div>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section className="courses-section" id="courses">
        <div className="courses-header">
          <div>
            <div className="label" style={{ color: 'var(--amber)', marginBottom: 8 }}>Courses near you</div>
            <h2 className="hl">Book your next round.</h2>
          </div>
          <div className="courses-header-right">
            <div className="carousel-arrows">
              <button className="carousel-arrow carousel-arrow-prev" aria-label="Previous courses">←</button>
              <button className="carousel-arrow carousel-arrow-next" aria-label="Next courses">→</button>
            </div>
            <Link href="/courses" className="link-amber">See all courses →</Link>
          </div>
        </div>
        <div className="courses-carousel-wrap">
          <div className="courses-carousel">
            {displayCourses.map((course) => (
              <Link key={course.id} href="/courses" className="course-card" style={{ textDecoration: 'none' }}>
                <img src={course.img} alt={course.name} />
                <div className="course-card-grad" />
                <div className="course-card-tag">{course.tag}</div>
                <div className="course-card-body">
                  <h3 className="hl course-card-title">{course.name}</h3>
                  <div className="course-card-meta">{course.meta}</div>
                  <div className="course-card-cta">Book tee time →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-header">
          <div>
            <div className="label" style={{ color: 'var(--amber)', marginBottom: 10 }}>Membership plans</div>
            <h2 className="hl" style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--midnight)' }}>Choose your plan.</h2>
            <div className="pricing-subline">Credits refresh monthly · Any partner course · Zero booking fees</div>
          </div>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pc-badge">Casual</div>
            <div className="pc-name">Casual</div>
            <div className="pc-price"><span className="pc-price-n">$99</span><span className="pc-price-mo">/mo</span></div>
            <div className="pc-credits">100 credits / month</div>
            <ul className="pc-features">
              <li>Any partner course</li>
              <li>Zero booking fees</li>
              <li>Credits refresh monthly</li>
              <li>QR code booking</li>
            </ul>
            <Link href="/signup?plan=casual" className="pc-cta pc-cta-default">Join Casual →</Link>
          </div>
          <div className="pricing-card pc-featured">
            <div className="pc-badge">Most popular</div>
            <div className="pc-name">Core</div>
            <div className="pc-price"><span className="pc-price-n">$149</span><span className="pc-price-mo">/mo</span></div>
            <div className="pc-credits">150 credits / month</div>
            <ul className="pc-features">
              <li>Everything in Casual</li>
              <li>Priority tee time access</li>
              <li>Guest passes (2/mo)</li>
              <li>Best value per credit</li>
            </ul>
            <Link href="/signup?plan=core" className="pc-cta pc-cta-featured">Join Core →</Link>
          </div>
          <div className="pricing-card">
            <div className="pc-badge">Heavy</div>
            <div className="pc-name">Heavy</div>
            <div className="pc-price"><span className="pc-price-n">$199</span><span className="pc-price-mo">/mo</span></div>
            <div className="pc-credits">210 credits / month</div>
            <ul className="pc-features">
              <li>Everything in Core</li>
              <li>Unlimited guest passes</li>
              <li>Early access to new courses</li>
              <li>Credits never expire</li>
            </ul>
            <Link href="/signup?plan=heavy" className="pc-cta pc-cta-default">Join Heavy →</Link>
          </div>
        </div>
        <div className="pricing-footer">
          <span>Cancel anytime · No contracts</span>
          <span>Credits refresh monthly</span>
          <span>Zero booking fees on all plans</span>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section className="stats-section">
        <Image
          src="/imagery/ec840ae06489fb0b720fce0607e3ffcd.jpg"
          alt="Golf course"
          fill
          className="stats-bg-img"
          sizes="100vw"
        />
        <div className="stats-overlay" />
        <div className="stats-grid">
          <div className="stat-block">
            <div className="stat-label">Partner courses</div>
            <div className="stat-number">50+</div>
            <div className="stat-desc">And growing every month across Florida</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">Avg. booking time</div>
            <div className="stat-number">3 min</div>
            <div className="stat-desc">vs. 20+ minutes on hold with the pro shop</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">You save per year</div>
            <div className="stat-number">$1,452</div>
            <div className="stat-desc">On Core vs. paying rack rate every round</div>
          </div>
          <div className="stat-block">
            <div className="stat-label">Booking fees charged</div>
            <div className="stat-number">$0</div>
            <div className="stat-desc">On every booking. Ever. No exceptions.</div>
          </div>
        </div>
        <div className="stats-quote">
          <div className="stats-quote-text">&ldquo;The Heavy plan <strong>basically paid for itself</strong> <em>in the first two rounds. Booking without calling the pro shop alone is worth it.</em>&rdquo;</div>
          <div className="stats-quote-attr">Diane K. — Heavy member<br />6.2 hcp</div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="comparison-section">
        <div className="comparison-headline">
          <span className="label">The math</span>
          <h2 className="hl">Play more. <span>Spend less.</span></h2>
          <p className="comparison-sub">Here&apos;s what a typical golfer playing twice a month actually spends.</p>
        </div>
        <div className="cmp-table">
          <div className="cmp-table-head">
            <span>Line item</span>
            <span>Without Gimmelab</span>
            <span style={{ color: 'var(--amber)' }}>With Gimmelab</span>
          </div>
          <div className="cmp-table-row">
            <span className="cmp-row-label">Green fees (avg $135/round)</span>
            <span className="cmp-row-val">$3,240 / yr</span>
            <span className="cmp-row-good">Included</span>
          </div>
          <div className="cmp-table-row">
            <span className="cmp-row-label">Booking fees</span>
            <span className="cmp-row-val">$4–8 per round</span>
            <span className="cmp-row-good">$0</span>
          </div>
          <div className="cmp-table-row">
            <span className="cmp-row-label">Phone calls to pro shop</span>
            <span className="cmp-row-val">Endless</span>
            <span className="cmp-row-good">Zero</span>
          </div>
          <div className="cmp-table-row">
            <span className="cmp-row-label">Annual membership cost</span>
            <span className="cmp-row-val">—</span>
            <span className="cmp-row-good">$1,788 / yr</span>
          </div>
          <div className="cmp-table-row cmp-table-total">
            <span className="cmp-row-label" style={{ fontWeight: 700 }}>Total yearly spend</span>
            <span className="cmp-row-val" style={{ fontWeight: 700, color: 'var(--midnight)', fontSize: 17 }}>$3,240+</span>
            <span className="cmp-row-good" style={{ fontSize: 18 }}>$1,788</span>
          </div>
        </div>
        <div className="comparison-savings">
          <div className="savings-left">
            <span className="label">You save</span>
            <div className="savings-amount">$1,452 / year</div>
            <div className="savings-note">That&apos;s a new driver. New irons. Both.</div>
          </div>
          <Link href="/signup" className="btn-savings">Start saving today →</Link>
        </div>
      </section>

      {/* ── EDITORIAL PHOTO STRIP ── */}
      <section className="editorial">
        <div className="editorial-item">
          <img src="/imagery/b124cb1f186169993c1b8198de403ae1.jpg" alt="The round" />
          <div className="editorial-grad" />
          <div className="editorial-body">
            <h3 className="hl editorial-title">The round</h3>
            <div className="editorial-sub">Morning light · On course</div>
          </div>
        </div>
        <div className="editorial-item">
          <img src="/imagery/a7ad9f79924f885fe8c6a8c3b35bded2.jpg" alt="The moment" />
          <div className="editorial-grad" />
          <span className="wm" style={{ position: 'absolute', top: 20, left: 20, fontSize: 15, color: '#F4EEE3', opacity: 0.8 }}>gimmelab</span>
          <div className="editorial-body">
            <h3 className="hl editorial-title">The moment</h3>
            <div className="editorial-sub">Sundown · Golden hour</div>
          </div>
        </div>
        <div className="editorial-item">
          <img src="/imagery/e015d14dec4bf78a78dbc852e3e01984.jpg" alt="The course" />
          <div className="editorial-grad" />
          <div className="editorial-body">
            <h3 className="hl editorial-title">The course</h3>
            <div className="editorial-sub">Wide open · No fences</div>
          </div>
        </div>
      </section>

      {/* ── VOICE ── */}
      <section className="voice-section">
        <div>
          <div className="label" style={{ color: 'var(--amber)', marginBottom: 16 }}>What we&apos;re about</div>
          <h2 className="hl voice-headline">Serious.<br />Not stuffy.<br />Bold.<br />Not loud.</h2>
        </div>
        <div>
          <p className="voice-copy">Golf has a gatekeeping problem. Gimmelab doesn&apos;t. Built for the player who loves the game without needing to perform it — all ages, all handicaps, all welcome.</p>
          <ul className="voice-list">
            <li>No country club membership required</li>
            <li>No hidden fees, no upsells</li>
            <li>Book in under two minutes</li>
            <li>Credits that work for your schedule</li>
          </ul>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="reviews-section">
        <div className="reviews-header">
          <div>
            <div className="label" style={{ color: 'var(--amber)', marginBottom: 8 }}>What players say</div>
            <h2 className="hl">Real golfers.<br />Real rounds.</h2>
          </div>
        </div>
        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-body">&ldquo;Booked a tee time in literally 90 seconds on a Saturday morning. Used to spend 20 minutes on hold with the pro shop. Never going back.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">M</div>
              <div>
                <div className="review-name">Marcus T.</div>
                <div className="review-meta">14 hcp · Core member</div>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-body">&ldquo;I play 3–4 times a week. The Heavy plan basically pays for itself in the first two rounds. Booking without calling the pro shop alone is worth it.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">D</div>
              <div>
                <div className="review-name">Diane K.</div>
                <div className="review-meta">6.2 hcp · Heavy member</div>
              </div>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-body">&ldquo;Finally. A golf app that doesn&apos;t feel like it was built for retirees at a private club. Clean, fast, does what it says. The QR code at the course just works.&rdquo;</p>
            <div className="review-author">
              <div className="review-avatar">J</div>
              <div>
                <div className="review-name">Jordan S.</div>
                <div className="review-meta">22 hcp · Casual member</div>
              </div>
            </div>
          </div>
        </div>
        <div className="reviews-aggregate">
          <div>
            <div className="agg-stars">★★★★★</div>
            <div className="agg-score">4.9</div>
            <div className="agg-label">Average rating</div>
          </div>
          <div style={{ width: 1, height: 48, background: '#847C72', opacity: 0.2, flexShrink: 0 }} />
          <div className="agg-stat">
            <div className="agg-stat-value">1,200+</div>
            <div className="agg-stat-label">Rounds booked</div>
          </div>
          <div style={{ width: 1, height: 48, background: '#847C72', opacity: 0.2, flexShrink: 0 }} />
          <div className="agg-stat">
            <div className="agg-stat-value">98%</div>
            <div className="agg-stat-label">Would recommend</div>
          </div>
          <div style={{ width: 1, height: 48, background: '#847C72', opacity: 0.2, flexShrink: 0 }} />
          <div className="agg-stat">
            <div className="agg-stat-value">Zero</div>
            <div className="agg-stat-label">Booking fees charged</div>
          </div>
        </div>
      </section>

      {/* ── SAVINGS CTA ── */}
      <section className="savings-section-new">
        <div className="savings-new-left">
          <div className="label" style={{ color: '#E8402A', marginBottom: 20 }}>The math</div>
          <h2 className="hl savings-new-h2">Stop paying<br /><span>rack rate.</span></h2>
          <p className="savings-new-p">A typical golfer playing twice a month saves over $1,400 a year switching to Gimmelab Core. That&apos;s a new set of irons.</p>
          <Link href="/signup" className="btn-savings-new">Start saving today →</Link>
        </div>
        <div className="savings-new-right">
          <div className="savings-stat-card">
            <div className="savings-stat-card-n">$3,240<span>+</span></div>
            <div className="savings-stat-card-l">What you&apos;re paying now per year at rack rate</div>
          </div>
          <div className="savings-stat-card">
            <div className="savings-stat-card-n">$1,788</div>
            <div className="savings-stat-card-l">Gimmelab Core — all-in, no hidden fees</div>
          </div>
          <div className="savings-stat-card savings-stat-card-big">
            <div className="savings-stat-card-n">$1,452</div>
            <div className="savings-stat-card-l">Average yearly savings with Core</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-top">
          <div>
            <span className="wm footer-brand-name">gimmelab</span>
            <p className="footer-brand-p">Credit-based golf memberships. No blackout dates, no rate games, no gatekeeping. Just the game you love.</p>
          </div>
          <div>
            <div className="footer-col-h">Product</div>
            <ul className="footer-links">
              <li><Link href="/#how-it-works">How it works</Link></li>
              <li><Link href="/courses">Courses</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/pricing">Credits explained</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-h">Company</div>
            <ul className="footer-links">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/about">Blog</Link></li>
              <li><Link href="/about">Press</Link></li>
              <li><Link href="/about">Careers</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-h">Support</div>
            <ul className="footer-links">
              <li><Link href="/about">Help center</Link></li>
              <li><Link href="/about">Contact us</Link></li>
              <li><Link href="/partner/apply">Partner courses</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2025 Gimmelab, Inc. All rights reserved.</span>
          <div className="footer-legal-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/terms">Cookies</Link>
          </div>
        </div>
        <span className="footer-big-word">GIMMELAB</span>
      </footer>

      {/* ── STYLES ── */}
      <style>{`
        :root {
          --midnight:  #0C0C0B;
          --linen:     #F4EEE3;
          --amber:     #BF7B2E;
          --stone:     #847C72;
          --off-white: #FDFAF6;
          --smoke:     #E5DDD3;
          --graphite:  #1E1D1B;
        }
        .hl {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }
        .wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        a { text-decoration: none; }

        /* ── HERO ── */
        .hero {
          position: relative;
          width: 100%;
          height: calc(100vh - 58px - 36px);
          min-height: 500px;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
        }
        .hero-img {
          object-fit: cover;
          object-position: center 35%;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(12,12,11,0.78) 0%, rgba(12,12,11,0.4) 55%, rgba(12,12,11,0.12) 100%);
        }
        .hero-word {
          position: absolute;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-size: clamp(100px, 18vw, 240px);
          font-weight: 700; letter-spacing: -0.06em;
          color: rgba(255,255,255,0.07);
          white-space: nowrap; pointer-events: none; user-select: none;
          z-index: 1; line-height: 1;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .hero-content {
          position: relative; z-index: 2;
          padding: 0 56px 72px; width: 100%;
          display: flex; align-items: flex-end; justify-content: space-between; gap: 40px;
        }
        .hero-left { max-width: 600px; }
        .hero-eyebrow {
          display: inline-block;
          color: #E8402A; background: rgba(232,64,42,0.15);
          border: 1px solid rgba(232,64,42,0.3); border-radius: 4px;
          padding: 4px 12px; margin-bottom: 20px;
        }
        .hero-headline {
          font-size: clamp(44px, 7vw, 88px);
          color: #fff;
          line-height: 0.97;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
        }
        .hero-headline em { font-style: normal; color: #E8402A; }
        .hero-sub {
          font-size: 17px; line-height: 1.65;
          color: rgba(255,255,255,0.6); max-width: 400px;
          margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .btn-hero-coral {
          display: inline-block;
          font-size: 14px; font-weight: 700;
          color: #fff; background: #E8402A;
          border: none; border-radius: 999px;
          padding: 14px 32px; cursor: pointer; transition: opacity 0.2s;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .btn-hero-coral:hover { opacity: 0.85; }
        .btn-hero-outline {
          display: inline-block;
          font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25);
          border-radius: 999px; padding: 13px 28px; cursor: pointer; transition: background 0.2s;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .btn-hero-outline:hover { background: rgba(255,255,255,0.18); }
        .hero-card {
          background: rgba(14,14,13,0.72); backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          padding: 20px 24px; min-width: 220px; flex-shrink: 0;
        }
        .hero-card-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #E8402A; margin-bottom: 10px;
          font-family: 'Inter', sans-serif;
        }
        .hero-card-course { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .hero-card-meta { font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 16px; font-family: 'Inter', sans-serif; }
        .hero-card-creds {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 14px;
        }
        .hero-card-creds-label { font-size: 11px; color: rgba(255,255,255,0.4); font-family: 'Inter', sans-serif; }
        .hero-card-creds-val { font-size: 18px; font-weight: 700; color: #fff; }

        /* ── HOW IT WORKS ── */
        .how-section { background: var(--midnight); }
        .section-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
        .how-item {
          padding: 52px 48px;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .how-item:last-child { border-right: none; }
        .how-num {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; color: var(--amber);
          margin-bottom: 24px; font-family: 'Inter', sans-serif;
        }
        .how-title { font-size: 22px; color: var(--linen); margin-bottom: 12px; }
        .how-body { font-size: 14px; line-height: 1.7; color: var(--stone); }

        /* ── COURSES ── */
        .courses-section { background: var(--off-white); padding: 72px 48px; overflow: hidden; }
        .courses-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 36px; gap: 16px; flex-wrap: wrap;
        }
        .courses-header .hl { font-size: clamp(26px, 3vw, 38px); color: var(--midnight); }
        .courses-header-right { display: flex; align-items: center; gap: 20px; }
        .carousel-arrows { display: flex; gap: 8px; }
        .carousel-arrow {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1.5px solid var(--smoke); background: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: var(--midnight); cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .carousel-arrow:hover { border-color: var(--midnight); background: var(--midnight); color: #fff; }
        .link-amber {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--amber); transition: opacity 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .link-amber:hover { opacity: 0.7; }
        .courses-carousel-wrap { position: relative; }
        .courses-carousel {
          display: flex; gap: 16px;
          overflow-x: auto; scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .courses-carousel::-webkit-scrollbar { display: none; }
        .course-card {
          position: relative; height: 380px; overflow: hidden; cursor: pointer;
          flex: 0 0 calc((100% - 32px) / 3);
          scroll-snap-align: start;
          border-radius: 8px;
        }
        .course-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
        .course-card:hover img { transform: scale(1.03); }
        .course-card-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(12,12,11,0.88) 0%, transparent 55%);
          border-radius: 8px;
        }
        .course-card-tag {
          position: absolute; top: 18px; left: 18px;
          background: var(--amber); padding: 4px 10px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--off-white); font-family: 'Inter', sans-serif;
          border-radius: 2px;
        }
        .course-card-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 24px; }
        .course-card-title { font-size: 20px; color: var(--linen); margin-bottom: 4px; }
        .course-card-meta {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--stone);
          font-family: 'Inter', sans-serif;
        }
        .course-card-cta {
          display: inline-block; margin-top: 12px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--amber);
          font-family: 'Inter', sans-serif;
        }

        /* ── COMPARISON ── */
        .comparison-section { background: var(--off-white); padding: 0 48px 80px; }
        .comparison-headline { padding: 64px 0 48px; }
        .comparison-headline .label { color: var(--amber); margin-bottom: 12px; display: block; }
        .comparison-headline .hl { font-size: clamp(30px, 4vw, 48px); color: var(--midnight); }
        .comparison-headline .hl span { color: var(--amber); }
        .comparison-sub { font-size: 15px; color: var(--stone); margin-top: 12px; font-family: 'Inter', sans-serif; line-height: 1.6; }
        .cmp-table { border-radius: 10px; overflow: hidden; border: 1px solid var(--smoke); background: #fff; }
        .cmp-table-head {
          display: grid; grid-template-columns: 2fr 1fr 1fr;
          background: var(--midnight); padding: 18px 32px; gap: 16px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(132,124,114,0.55); font-family: 'Inter', sans-serif;
        }
        .cmp-table-head span:not(:first-child) { text-align: center; }
        .cmp-table-row {
          display: grid; grid-template-columns: 2fr 1fr 1fr;
          padding: 18px 32px; gap: 16px;
          border-bottom: 1px solid var(--smoke);
          align-items: center; font-size: 15px;
          font-family: 'Inter', sans-serif;
        }
        .cmp-table-row:last-child { border-bottom: none; }
        .cmp-table-row:nth-child(odd) { background: var(--off-white); }
        .cmp-table-total { background: #fff !important; }
        .cmp-row-label { font-weight: 500; color: var(--midnight); }
        .cmp-row-val { text-align: center; color: var(--stone); }
        .cmp-row-good { text-align: center; color: var(--amber); font-weight: 700; }
        .comparison-savings {
          background: var(--midnight); padding: 28px 40px; margin-top: 20px; border-radius: 8px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
        }
        .savings-left .label { color: var(--amber); margin-bottom: 6px; display: block; }
        .savings-amount {
          font-size: 40px; font-weight: 700; letter-spacing: -0.03em; color: var(--linen);
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .savings-note { font-size: 12px; color: var(--stone); margin-top: 4px; font-family: 'Inter', sans-serif; }
        .btn-savings {
          display: inline-block;
          background: var(--amber); color: var(--off-white);
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 2px;
          white-space: nowrap; transition: background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .btn-savings:hover { background: #a86b27; }

        /* ── PRICING ── */
        .pricing-section { background: var(--off-white); padding: 80px 48px; }
        .pricing-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px; flex-wrap: wrap; gap: 16px;
        }
        .pricing-subline {
          font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--stone); margin-top: 6px; font-family: 'Inter', sans-serif;
        }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
          max-width: 960px; margin: 0 auto;
        }
        .pricing-card {
          background: #fff; border: 1.5px solid var(--smoke);
          border-radius: 14px; padding: 40px 34px;
          display: flex; flex-direction: column; gap: 20px;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 56px rgba(0,0,0,0.07); }
        .pc-featured {
          background: var(--midnight);
          border-color: var(--midnight);
          transform: scale(1.04);
        }
        .pc-featured:hover { transform: scale(1.04) translateY(-4px); }
        .pc-badge {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--amber); background: #F9F4EA;
          border-radius: 4px; padding: 4px 10px; width: fit-content;
          font-family: 'Inter', sans-serif;
        }
        .pc-featured .pc-badge { color: var(--linen); background: rgba(191,123,46,0.25); }
        .pc-name {
          font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
          color: var(--midnight);
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .pc-featured .pc-name { color: var(--linen); }
        .pc-price { display: flex; align-items: baseline; gap: 4px; }
        .pc-price-n {
          font-size: 52px; font-weight: 700; letter-spacing: -0.035em; line-height: 1;
          color: var(--midnight);
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .pc-featured .pc-price-n { color: var(--linen); }
        .pc-price-mo { font-size: 15px; color: var(--stone); }
        .pc-featured .pc-price-mo { color: rgba(132,124,114,0.6); }
        .pc-credits {
          font-size: 13px; font-weight: 600; color: var(--amber);
          background: #F9F4EA; border-radius: 6px; padding: 8px 14px;
          font-family: 'Inter', sans-serif;
        }
        .pc-featured .pc-credits { background: rgba(191,123,46,0.18); }
        .pc-features {
          list-style: none; flex: 1; display: flex; flex-direction: column;
          gap: 12px; padding: 0;
        }
        .pc-features li {
          font-size: 14px; color: var(--stone);
          display: flex; align-items: flex-start; gap: 10px;
          font-family: 'Inter', sans-serif;
        }
        .pc-featured .pc-features li { color: rgba(132,124,114,0.7); }
        .pc-features li::before { content: '✓'; color: var(--amber); font-weight: 700; flex-shrink: 0; }
        .pc-cta {
          display: block; text-align: center;
          font-size: 14px; font-weight: 600; letter-spacing: 0.02em;
          padding: 14px; border-radius: 8px; transition: all 0.15s;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .pc-cta-default { background: var(--off-white); color: var(--midnight); border: 1.5px solid var(--smoke); }
        .pc-cta-default:hover { border-color: var(--midnight); }
        .pc-cta-featured { background: var(--amber); color: #fff; border: none; }
        .pc-cta-featured:hover { opacity: 0.88; }
        .pricing-footer {
          margin-top: 28px; padding-top: 20px;
          border-top: 1px solid var(--smoke);
          display: flex; justify-content: center; flex-wrap: wrap; gap: 32px;
        }
        .pricing-footer span { font-size: 11px; color: var(--stone); letter-spacing: 0.08em; font-family: 'Inter', sans-serif; }

        /* ── STATS BANNER ── */
        .stats-section {
          position: relative; overflow: hidden;
          padding: 80px 56px 48px;
        }
        .stats-bg-img { object-fit: cover; }
        .stats-overlay {
          position: absolute; inset: 0;
          background: rgba(14,14,13,0.75);
          z-index: 1;
        }
        .stats-grid {
          position: relative; z-index: 2;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .stat-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: #E8402A; margin-bottom: 12px;
          font-family: 'Inter', sans-serif;
        }
        .stat-number {
          font-size: clamp(40px, 5vw, 64px); font-weight: 700;
          letter-spacing: -0.04em; color: #fff; line-height: 1; margin-bottom: 8px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .stat-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.5; font-family: 'Inter', sans-serif; }
        .stats-quote {
          position: relative; z-index: 2;
          padding: 48px 0 0;
          display: flex; align-items: flex-end; justify-content: space-between; gap: 40px;
        }
        .stats-quote-text {
          font-size: clamp(20px, 2.5vw, 32px); font-weight: 400;
          letter-spacing: -0.02em; color: rgba(255,255,255,0.85);
          line-height: 1.4; max-width: 700px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-style: italic;
        }
        .stats-quote-text strong { font-weight: 700; font-style: normal; }
        .stats-quote-attr {
          font-size: 13px; color: rgba(255,255,255,0.4); text-align: right;
          white-space: nowrap; font-family: 'Inter', sans-serif;
        }

        /* ── SAVINGS SECTION (NEW) ── */
        .savings-section-new {
          padding: 120px 56px; background: var(--midnight);
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 80px; align-items: center;
        }
        .savings-new-h2 {
          font-size: clamp(40px, 6vw, 80px);
          letter-spacing: -0.04em; line-height: 0.97; color: #fff; margin-bottom: 28px;
        }
        .savings-new-h2 span { color: #E8402A; }
        .savings-new-p {
          font-size: 16px; color: rgba(255,255,255,0.45); line-height: 1.7;
          max-width: 400px; margin-bottom: 40px; font-family: 'Inter', sans-serif;
        }
        .btn-savings-new {
          display: inline-block;
          font-size: 15px; font-weight: 700; color: var(--midnight);
          background: #fff; border-radius: 999px;
          padding: 16px 40px; transition: background 0.2s;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .btn-savings-new:hover { background: var(--linen); }
        .savings-new-right {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .savings-stat-card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 28px 24px;
        }
        .savings-stat-card-n {
          font-size: 40px; font-weight: 700; letter-spacing: -0.04em;
          color: #fff; line-height: 1; margin-bottom: 8px;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .savings-stat-card-n span { color: #E8402A; }
        .savings-stat-card-l { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.5; font-family: 'Inter', sans-serif; }
        .savings-stat-card-big {
          grid-column: span 2;
          background: #E8402A; border: none; text-align: center;
          padding: 32px; border-radius: 12px;
        }
        .savings-stat-card-big .savings-stat-card-n { font-size: 56px; color: #fff; }
        .savings-stat-card-big .savings-stat-card-l { color: rgba(255,255,255,0.7); font-size: 14px; }

        /* ── EDITORIAL STRIP ── */
        .editorial { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .editorial-item { position: relative; height: 440px; overflow: hidden; }
        .editorial-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; display: block; }
        .editorial-item:hover img { transform: scale(1.04); }
        .editorial-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(12,12,11,0.88) 0%, rgba(12,12,11,0.1) 50%, transparent 100%);
        }
        .editorial-body { position: absolute; bottom: 0; left: 0; right: 0; padding: 28px 24px; }
        .editorial-title { font-size: 22px; color: var(--linen); margin-bottom: 5px; }
        .editorial-sub {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--stone); font-family: 'Inter', sans-serif;
        }

        /* ── VOICE ── */
        .voice-section {
          background: var(--linen); padding: 80px 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .voice-headline { font-size: clamp(30px, 4vw, 52px); color: var(--midnight); line-height: 1.02; }
        .voice-copy { font-size: 15px; line-height: 1.75; color: var(--stone); margin-bottom: 24px; font-family: 'Inter', sans-serif; }
        .voice-list { list-style: none; display: flex; flex-direction: column; gap: 12px; padding: 0; }
        .voice-list li {
          font-size: 14px; color: var(--midnight);
          display: flex; align-items: flex-start; gap: 12px; line-height: 1.5;
          font-family: 'Inter', sans-serif;
        }
        .voice-list li::before { content: '→'; color: var(--amber); flex-shrink: 0; }

        /* ── REVIEWS ── */
        .reviews-section { background: var(--off-white); padding: 80px 48px; border-top: 1px solid var(--smoke); }
        .reviews-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 44px; flex-wrap: wrap; gap: 16px; }
        .reviews-header .hl { font-size: clamp(26px, 3vw, 38px); color: var(--midnight); }
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .review-card {
          background: #fff; border: 1.5px solid var(--smoke);
          border-radius: 14px; padding: 36px 32px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .review-stars { color: var(--amber); font-size: 15px; letter-spacing: 3px; }
        .review-body { font-size: 15px; line-height: 1.72; color: var(--stone); flex: 1; font-family: 'Inter', sans-serif; }
        .review-author {
          display: flex; align-items: center; gap: 14px;
          padding-top: 20px; border-top: 1px solid var(--smoke);
        }
        .review-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: #F9F4EA; border: 2px solid var(--amber);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700; color: var(--amber);
          flex-shrink: 0; font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }
        .review-name { font-size: 14px; font-weight: 700; color: var(--midnight); font-family: 'Inter', sans-serif; }
        .review-meta { font-size: 11px; color: var(--stone); letter-spacing: 0.04em; margin-top: 2px; font-family: 'Inter', sans-serif; }
        .reviews-aggregate {
          margin-top: 2px; background: var(--smoke);
          padding: 20px 32px; display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
        }
        .agg-score {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-size: 40px; font-weight: 900; letter-spacing: -0.03em; color: var(--midnight); line-height: 1;
        }
        .agg-stars { font-size: 16px; color: var(--amber); letter-spacing: 2px; margin-bottom: 3px; }
        .agg-label { font-size: 11px; color: var(--stone); letter-spacing: 0.08em; font-family: 'Inter', sans-serif; }
        .agg-stat-value { font-size: 20px; font-weight: 700; color: var(--midnight); font-family: 'Inter', sans-serif; }
        .agg-stat-label { font-size: 11px; color: var(--stone); letter-spacing: 0.06em; margin-top: 2px; font-family: 'Inter', sans-serif; }

        /* ── FOOTER ── */
        footer { background: var(--midnight); padding: 72px 56px 48px; position: relative; overflow: hidden; }
        .footer-top {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px; padding-bottom: 56px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .footer-brand-name { font-size: 22px; color: #fff; display: block; margin-bottom: 16px; }
        .footer-brand-p { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.7; max-width: 260px; font-family: 'Inter', sans-serif; }
        .footer-col-h {
          font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.25); margin-bottom: 20px; font-family: 'Inter', sans-serif;
        }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; padding: 0; }
        .footer-links a { font-size: 13px; color: rgba(255,255,255,0.45); transition: color 0.2s; font-family: 'Inter', sans-serif; }
        .footer-links a:hover { color: #fff; }
        .footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 32px; flex-wrap: wrap; gap: 12px;
        }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.2); font-family: 'Inter', sans-serif; }
        .footer-legal-links { display: flex; gap: 20px; }
        .footer-legal-links a { font-size: 12px; color: rgba(255,255,255,0.2); transition: color 0.2s; font-family: 'Inter', sans-serif; }
        .footer-legal-links a:hover { color: rgba(255,255,255,0.6); }
        .footer-big-word {
          font-size: clamp(64px, 12vw, 160px); font-weight: 700;
          letter-spacing: -0.06em; color: rgba(255,255,255,0.05);
          display: block; text-align: center; line-height: 1;
          margin-top: 48px; user-select: none;
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-content { padding: 40px 36px; }
          .hero-course-tag { right: 28px; }
          .how-grid { grid-template-columns: 1fr; }
          .how-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .courses-section, .comparison-section, .pricing-section, .voice-section, footer { padding-left: 28px; padding-right: 28px; }
          .course-card { flex: 0 0 calc((100% - 16px) / 2); }
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-tier { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .editorial { grid-template-columns: 1fr 1fr; }
          .editorial-item:nth-child(3) { display: none; }
          .voice-section { grid-template-columns: 1fr; gap: 40px; }
          .reviews-section { padding-left: 28px; padding-right: 28px; }
          .reviews-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .hero-content { padding: 32px 24px; }
          .hero-course-tag { display: none; }
          .comparison-table { grid-template-columns: 1fr; }
          .comp-col { border-right: none; border-bottom: 1px solid var(--smoke); }
          .course-card { flex: 0 0 calc(100% - 16px); }
          .editorial { grid-template-columns: 1fr; }
          .editorial-item:nth-child(3) { display: block; }
          .footer-top { grid-template-columns: 1fr; }
        }
      `}</style>
      <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('DOMContentLoaded',function(){var c=document.querySelector('.courses-carousel');var p=document.querySelector('.carousel-arrow-prev');var n=document.querySelector('.carousel-arrow-next');if(!c||!p||!n)return;function g(){var d=c.querySelector('.course-card');return d?d.offsetWidth+16:400}p.addEventListener('click',function(){c.scrollBy({left:-g(),behavior:'smooth'})});n.addEventListener('click',function(){c.scrollBy({left:g(),behavior:'smooth'})})})" }} />
    </>
  )
}
