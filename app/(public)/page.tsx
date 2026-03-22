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
      .limit(3)
  } catch {
    // DB unavailable at build time — homepage renders with fallback content
  }

  // Fallback imagery for course cards when no DB courses exist
  const fallbackCourses = [
    { id: '1', name: 'Pebble Creek Municipal', meta: '18 holes · Par 72 · 85 credits', tag: 'Open today', img: '/imagery/a7c0df0d48e8a2a2dc99cb9becff023e.jpg' },
    { id: '2', name: 'Ridgeline Public Golf', meta: '18 holes · Par 70 · 95 credits', tag: 'Featured', img: '/imagery/21d4fdcfc2f31a89f9581a849acd240b.jpg' },
    { id: '3', name: 'Sundown Valley Links', meta: '9/18 holes · Par 35 · 45 credits', tag: '9-hole option', img: '/imagery/6c701e5e1e8aafdf9333a11faeec14b9.jpg' },
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
        <div className="hero-content">
          <div className="label hero-eyebrow">One membership</div>
          <h1 className="hl hero-headline">Golf,<br />on your<br />terms.</h1>
          <p className="hero-sub">Book tee times at any partner course using monthly credits. No fees, no phone calls. Pick a time, show up, play.</p>
          <div className="hero-actions">
            <Link href="/signup" className="btn-primary">
              Get started <span className="btn-arrow">→</span>
            </Link>
            <Link href="/pricing" className="btn-secondary">See plans</Link>
            <Link href="#how-it-works" className="btn-text-link">How it works ↓</Link>
          </div>
        </div>
        <div className="hero-course-tag">
          <span>Pebble Creek · Sat 8:30am</span>
          <strong>85 credits</strong>
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
          <Link href="/courses" className="link-amber">See all courses →</Link>
        </div>
        <div className="courses-grid">
          {displayCourses.map((course) => (
            <div key={course.id} className="course-card">
              <img src={course.img} alt={course.name} />
              <div className="course-card-grad" />
              <div className="course-card-tag">{course.tag}</div>
              <div className="course-card-body">
                <h3 className="hl course-card-title">{course.name}</h3>
                <div className="course-card-meta">{course.meta}</div>
                <Link href="/courses" className="course-card-cta">Book tee time →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="comparison-section">
        <div className="comparison-headline">
          <span className="label">The math</span>
          <h2 className="hl">Play more. <span>Spend less.</span></h2>
        </div>
        <div className="comparison-table">
          <div className="comp-col">
            <div className="comp-tag">Without Gimmelab / year</div>
            <div className="comp-line"><span>36 rounds × $85</span><span className="comp-line-value">$3,060</span></div>
            <div className="comp-line"><span>Booking fees</span><span className="comp-line-value">$180</span></div>
            <div className="comp-line"><span>Phone calls to pro shop</span><span className="comp-line-value" style={{ color: 'var(--stone)' }}>Endless</span></div>
            <div className="comp-total">
              <span className="comp-total-label">Per year</span>
              <span className="comp-total-value">$3,240</span>
            </div>
          </div>
          <div className="comp-col-dark">
            <div className="comp-tag-dark">With Gimmelab Core / year</div>
            <div className="comp-line-dark"><span>$149/mo × 12</span><span className="comp-line-value-dark">$1,788</span></div>
            <div className="comp-line-dark"><span>Booking fees</span><span className="comp-line-value-dark" style={{ color: 'var(--amber)' }}>$0</span></div>
            <div className="comp-line-dark"><span>Phone calls</span><span className="comp-line-value-dark" style={{ color: 'var(--amber)' }}>Zero</span></div>
            <div className="comp-total-dark">
              <span className="comp-total-label">Per year</span>
              <span className="comp-total-value-dark">$1,788</span>
            </div>
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

      {/* ── PRICING ── */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-header">
          <div>
            <div className="label" style={{ color: 'var(--amber)', marginBottom: 10 }}>Membership plans</div>
            <h2 className="hl" style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--linen)' }}>Choose your plan.</h2>
            <div className="pricing-subline">Credits refresh monthly · Any partner course · Zero booking fees</div>
          </div>
        </div>
        <div className="pricing-grid">
          <div className="pricing-tier">
            <div className="tier-label">Casual</div>
            <div className="tier-credits">100</div>
            <div className="tier-credits-label">credits / month</div>
            <div className="tier-price">$99 / mo</div>
            <div className="tier-price-note">~2–3 rounds per month</div>
            <ul className="tier-features">
              <li>Any partner course</li>
              <li>Zero booking fees</li>
              <li>Credits refresh monthly</li>
              <li>QR code booking</li>
            </ul>
            <Link href="/signup?plan=casual" className="tier-cta tier-cta-default">Join Casual →</Link>
          </div>
          <div className="pricing-tier featured">
            <div className="tier-label">
              Core
              <span className="tier-badge">Recommended</span>
            </div>
            <div className="tier-credits">150</div>
            <div className="tier-credits-label">credits / month</div>
            <div className="tier-price">$149 / mo</div>
            <div className="tier-price-note">~3–4 rounds per month</div>
            <ul className="tier-features">
              <li>Everything in Casual</li>
              <li>Credits refresh monthly</li>
              <li>Priority tee time access</li>
              <li>Best value per credit</li>
            </ul>
            <Link href="/signup?plan=core" className="tier-cta tier-cta-featured">Join Core →</Link>
          </div>
          <div className="pricing-tier">
            <div className="tier-label">Heavy</div>
            <div className="tier-credits">210</div>
            <div className="tier-credits-label">credits / month</div>
            <div className="tier-price">$199 / mo</div>
            <div className="tier-price-note">~5+ rounds per month</div>
            <ul className="tier-features">
              <li>Everything in Core</li>
              <li>Credits refresh monthly</li>
              <li>Early access to new courses</li>
              <li>For the serious player</li>
            </ul>
            <Link href="/signup?plan=heavy" className="tier-cta tier-cta-default">Join Heavy →</Link>
          </div>
        </div>
        <div className="pricing-footer">
          <span>Cancel anytime · No contracts</span>
          <span>Credits refresh monthly</span>
          <span>Zero booking fees on all plans</span>
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
            <div className="review-footer">
              <div>
                <div className="review-name">Marcus T.</div>
                <div className="review-meta">14 hcp · Core member</div>
              </div>
              <span className="review-tag">Verified</span>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-body">&ldquo;I play 3–4 times a week. The Heavy plan basically pays for itself in the first two rounds. Booking without calling the pro shop alone is worth it.&rdquo;</p>
            <div className="review-footer">
              <div>
                <div className="review-name">Diane K.</div>
                <div className="review-meta">6.2 hcp · Heavy member</div>
              </div>
              <span className="review-tag">Verified</span>
            </div>
          </div>
          <div className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-body">&ldquo;Finally. A golf app that doesn&apos;t feel like it was built for retirees at a private club. Clean, fast, does what it says. The QR code at the course just works.&rdquo;</p>
            <div className="review-footer">
              <div>
                <div className="review-name">Jordan S.</div>
                <div className="review-meta">22 hcp · Casual member</div>
              </div>
              <span className="review-tag">Verified</span>
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

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-top">
          <div>
            <Link href="/" className="wm footer-wordmark">gimmelab</Link>
            <p className="footer-blurb">Golf for real players. All ages, all skill levels, no gatekeeping.</p>
          </div>
          <div>
            <div className="footer-col-title">Platform</div>
            <ul className="footer-links">
              <li><Link href="/courses">Find a course</Link></li>
              <li><Link href="/courses">Book a tee time</Link></li>
              <li><Link href="/#how-it-works">How it works</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Account</div>
            <ul className="footer-links">
              <li><Link href="/login">Log in</Link></li>
              <li><Link href="/dashboard">My account</Link></li>
              <li><Link href="/signup">Sign up</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-links">
              <li><Link href="/privacy">Privacy policy</Link></li>
              <li><Link href="/terms">Terms of service</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-legal">© 2026 Gimmelab. All rights reserved.</span>
          <span className="footer-domain">gimmelab.com</span>
        </div>
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
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          letter-spacing: -0.025em;
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
          height: calc(100vh - 58px - 32px);
          min-height: 580px;
          overflow: hidden;
        }
        .hero-img {
          object-fit: cover;
          object-position: center 35%;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(12,12,11,0.78) 0%, rgba(12,12,11,0.4) 55%, rgba(12,12,11,0.12) 100%);
        }
        .hero-content {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          justify-content: flex-end;
          padding: 64px 72px;
        }
        .hero-eyebrow { color: var(--amber); margin-bottom: 14px; }
        .hero-headline {
          font-size: clamp(34px, 5.5vw, 72px);
          color: var(--linen);
          max-width: 680px;
          margin-bottom: 16px;
        }
        .hero-sub {
          font-size: 15px; line-height: 1.7;
          color: var(--stone); max-width: 380px;
          margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 10px;
          background: var(--amber); color: var(--off-white);
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 14px 24px; border-radius: 2px;
          transition: background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .btn-primary:hover { background: #a86b27; }
        .btn-arrow {
          width: 18px; height: 18px;
          border: 1px solid rgba(253,250,246,0.4); border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; flex-shrink: 0;
        }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--linen);
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 13px 24px;
          border: 1px solid rgba(244,238,227,0.25); border-radius: 2px;
          transition: border-color 0.2s, color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .btn-secondary:hover { border-color: rgba(244,238,227,0.6); color: var(--off-white); }
        .btn-text-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--stone);
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          transition: color 0.15s; padding: 14px 0;
          font-family: 'Inter', sans-serif;
        }
        .btn-text-link:hover { color: var(--linen); }
        .hero-course-tag {
          position: absolute; bottom: 28px; right: 56px;
          background: rgba(12,12,11,0.6);
          padding: 8px 16px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .hero-course-tag span {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--stone);
          font-family: 'Inter', sans-serif;
        }
        .hero-course-tag strong {
          font-size: 13px; font-weight: 700; color: var(--linen);
          font-family: 'Inter', sans-serif;
        }

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
        .courses-section { background: var(--off-white); padding: 72px 48px; }
        .courses-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 36px; gap: 16px; flex-wrap: wrap;
        }
        .courses-header .hl { font-size: clamp(26px, 3vw, 38px); color: var(--midnight); }
        .link-amber {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--amber); transition: opacity 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .link-amber:hover { opacity: 0.7; }
        .courses-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .course-card { position: relative; height: 380px; overflow: hidden; cursor: pointer; }
        .course-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
        .course-card:hover img { transform: scale(1.03); }
        .course-card-grad {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(12,12,11,0.88) 0%, transparent 55%);
        }
        .course-card-tag {
          position: absolute; top: 18px; left: 18px;
          background: var(--amber); padding: 4px 10px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--off-white); font-family: 'Inter', sans-serif;
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
        .comparison-table { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--smoke); }
        .comp-col { padding: 36px 40px; border-right: 1px solid var(--smoke); }
        .comp-col-dark { background: var(--midnight); padding: 36px 40px; }
        .comp-tag {
          display: inline-block; border: 1px solid var(--smoke);
          padding: 5px 14px; margin-bottom: 28px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--stone); font-family: 'Inter', sans-serif;
        }
        .comp-tag-dark {
          display: inline-block; border: 1px solid rgba(255,255,255,0.1);
          padding: 5px 14px; margin-bottom: 28px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(132,124,114,0.6); font-family: 'Inter', sans-serif;
        }
        .comp-line {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--smoke);
          font-size: 14px; color: var(--stone); font-family: 'Inter', sans-serif;
        }
        .comp-line:last-of-type { border-bottom: none; }
        .comp-line-value { font-weight: 700; color: var(--midnight); font-size: 14px; }
        .comp-line-dark {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 16px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 14px; color: var(--stone); font-family: 'Inter', sans-serif;
        }
        .comp-line-dark:last-of-type { border-bottom: none; }
        .comp-line-value-dark { font-weight: 700; color: var(--linen); font-size: 14px; }
        .comp-total {
          display: flex; justify-content: space-between; align-items: baseline;
          padding-top: 20px; margin-top: 4px; border-top: 1px solid var(--smoke);
        }
        .comp-total-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--stone); font-family: 'Inter', sans-serif;
        }
        .comp-total-value {
          font-size: 32px; font-weight: 900; letter-spacing: -0.02em;
          color: var(--midnight);
          font-family: var(--font-nunito), 'Nunito', sans-serif;
        }
        .comp-total-dark {
          display: flex; justify-content: space-between; align-items: baseline;
          padding-top: 20px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .comp-total-value-dark {
          font-size: 32px; font-weight: 900; letter-spacing: -0.02em;
          color: var(--linen);
          font-family: var(--font-nunito), 'Nunito', sans-serif;
        }
        .comparison-savings {
          background: var(--midnight); padding: 28px 40px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
        }
        .savings-left .label { color: var(--amber); margin-bottom: 6px; display: block; }
        .savings-amount {
          font-size: 40px; font-weight: 900; letter-spacing: -0.03em; color: var(--linen);
          font-family: var(--font-nunito), 'Nunito', sans-serif;
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
        .pricing-section { background: var(--midnight); padding: 80px 48px; }
        .pricing-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px; flex-wrap: wrap; gap: 16px;
        }
        .pricing-subline {
          font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--stone); margin-top: 6px; font-family: 'Inter', sans-serif;
        }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; border: 1px solid rgba(255,255,255,0.06);
        }
        .pricing-tier {
          padding: 36px 32px; background: var(--graphite);
          display: flex; flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .pricing-tier:last-child { border-right: none; }
        .pricing-tier.featured {
          background: var(--midnight);
          outline: 1px solid var(--linen); outline-offset: -1px;
        }
        .tier-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--stone); margin-bottom: 24px;
          display: flex; justify-content: space-between; align-items: center;
          font-family: 'Inter', sans-serif;
        }
        .tier-badge {
          font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--linen); border: 1px solid rgba(255,255,255,0.2);
          padding: 3px 8px; font-family: 'Inter', sans-serif;
        }
        .tier-credits {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-size: 64px; font-weight: 900; letter-spacing: -0.04em; color: var(--linen); line-height: 1;
        }
        .tier-credits-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--stone); margin-top: 6px; margin-bottom: 24px; font-family: 'Inter', sans-serif;
        }
        .tier-price {
          font-size: 28px; font-weight: 900; letter-spacing: -0.02em;
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          color: var(--linen); margin-bottom: 8px;
        }
        .tier-price-note { font-size: 11px; color: var(--stone); letter-spacing: 0.06em; margin-bottom: 28px; font-family: 'Inter', sans-serif; }
        .tier-features {
          list-style: none; flex: 1; display: flex; flex-direction: column;
          gap: 10px; margin-bottom: 32px; padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .tier-features li {
          font-size: 13px; color: var(--stone);
          display: flex; align-items: flex-start; gap: 10px;
          font-family: 'Inter', sans-serif;
        }
        .tier-features li::before { content: '→'; color: var(--amber); flex-shrink: 0; }
        .tier-cta {
          display: block; text-align: center;
          font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 13px 24px; border-radius: 2px; transition: all 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .tier-cta-default { border: 1px solid rgba(255,255,255,0.15); color: var(--linen); }
        .tier-cta-default:hover { border-color: var(--linen); }
        .tier-cta-featured { background: var(--linen); color: var(--midnight); }
        .tier-cta-featured:hover { background: var(--off-white); }
        .pricing-footer {
          margin-top: 28px; padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
        }
        .pricing-footer span { font-size: 11px; color: rgba(132,124,114,0.45); letter-spacing: 0.08em; font-family: 'Inter', sans-serif; }

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
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .review-card { background: var(--linen); padding: 36px 32px; display: flex; flex-direction: column; gap: 20px; }
        .review-card:nth-child(2) { background: var(--midnight); }
        .review-card:nth-child(2) .review-body { color: var(--stone); }
        .review-card:nth-child(2) .review-name { color: var(--linen); }
        .review-card:nth-child(2) .review-meta { color: rgba(132,124,114,0.6); }
        .review-card:nth-child(2) .review-stars { color: var(--amber); }
        .review-card:nth-child(2) .review-tag { border-color: rgba(255,255,255,0.1); color: rgba(132,124,114,0.5); }
        .review-stars { color: var(--amber); font-size: 14px; letter-spacing: 2px; }
        .review-body { font-size: 15px; line-height: 1.7; color: var(--stone); flex: 1; font-style: italic; font-family: 'Inter', sans-serif; }
        .review-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .review-name { font-size: 13px; font-weight: 700; color: var(--midnight); letter-spacing: 0.02em; font-family: 'Inter', sans-serif; }
        .review-meta { font-size: 11px; color: var(--stone); letter-spacing: 0.04em; margin-top: 2px; font-family: 'Inter', sans-serif; }
        .review-tag {
          font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--stone); border: 1px solid var(--smoke); padding: 4px 10px; flex-shrink: 0;
          font-family: 'Inter', sans-serif;
        }
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
        footer { background: var(--midnight); padding: 56px 48px 32px; border-top: 1px solid rgba(255,255,255,0.04); }
        .footer-top {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 40px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .footer-wordmark { font-size: 24px; color: var(--linen); display: block; margin-bottom: 12px; }
        .footer-blurb { font-size: 13px; line-height: 1.7; color: var(--stone); max-width: 220px; font-family: 'Inter', sans-serif; }
        .footer-col-title {
          font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--stone); margin-bottom: 18px; font-family: 'Inter', sans-serif;
        }
        .footer-links { list-style: none; display: flex; flex-direction: column; gap: 11px; padding: 0; }
        .footer-links a { font-size: 13px; color: var(--stone); transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .footer-links a:hover { color: var(--linen); }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 24px; flex-wrap: wrap; gap: 10px; }
        .footer-legal { font-size: 11px; color: rgba(132,124,114,0.4); font-family: 'Inter', sans-serif; }
        .footer-domain { font-size: 11px; color: var(--amber); font-family: 'Inter', sans-serif; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-content { padding: 40px 36px; }
          .hero-course-tag { right: 28px; }
          .how-grid { grid-template-columns: 1fr; }
          .how-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .courses-section, .comparison-section, .pricing-section, .voice-section, footer { padding-left: 28px; padding-right: 28px; }
          .courses-grid { grid-template-columns: 1fr 1fr; }
          .courses-grid .course-card:nth-child(3) { display: none; }
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
          .courses-grid { grid-template-columns: 1fr; }
          .courses-grid .course-card:nth-child(3) { display: block; }
          .editorial { grid-template-columns: 1fr; }
          .editorial-item:nth-child(3) { display: block; }
          .footer-top { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
