import Link from 'next/link'
import Image from 'next/image'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses } from '@/lib/db/schema'
import CarouselArrows from '@/components/carousel-arrows'
import PuttAnimations from '@/components/putt-animations'
import HeroScrollEffect from '@/components/hero-scroll-effect'
import AnimatedButton from '@/components/animated-button'
import dynamic from 'next/dynamic'
import CreditDollarHint from '@/components/credit-dollar-hint'
import HeroWidget from '@/components/hero-widget'

const SavingsCalculator = dynamic(() => import('@/components/savings-calculator'), {
  loading: () => <div style={{ minHeight: 400 }} />,
})

export const metadata = {
  title: 'gimmelab — One membership. Every course.',
  description: 'Book tee times at any partner course using monthly credits. No booking fees, no phone calls.',
}

export const revalidate = 300 // revalidate every 5 minutes

export default async function HomePage() {
  let topCourses: { id: string; slug: string; name: string; address: string; holes: number | null; baseCreditCost: number; rackRateCents: number | null; photos: string[] | null }[] = []
  try {
    topCourses = await db
      .select({
        id: courses.id,
        slug: courses.slug,
        name: courses.name,
        address: courses.address,
        holes: courses.holes,
        baseCreditCost: courses.baseCreditCost,
        rackRateCents: courses.rackRateCents,
        photos: courses.photos,
      })
      .from(courses)
      .where(eq(courses.status, 'active'))
      .limit(9)
  } catch {
    // DB unavailable at build time — homepage renders with fallback content
  }

  // Fallback when DB is unavailable
  const fallbackCourses: Array<{
    id: string; slug: string; name: string; address: string; holes: number; credits: number; rack: number; img: string; featured: boolean;
  }> = [
    { id: '1', slug: 'walnut-lane-golf-club', name: 'Walnut Lane Golf Club', address: 'Philadelphia, PA', holes: 18, credits: 36, rack: 52, img: '/imagery/course-1.jpeg', featured: false },
    { id: '2', slug: 'cobbs-creek-golf-course', name: 'Cobbs Creek Golf Course', address: 'W. Philadelphia, PA', holes: 18, credits: 45, rack: 68, img: '/imagery/course-2.png', featured: true },
    { id: '3', slug: 'torresdale-frankford-cc', name: 'Torresdale-Frankford CC', address: 'NE Philadelphia, PA', holes: 18, credits: 55, rack: 85, img: '/imagery/course-3.jpeg', featured: false },
    { id: '4', slug: 'westchase-golf-club', name: 'Westchase Golf Club', address: 'Tampa Bay, FL', holes: 18, credits: 90, rack: 125, img: '/imagery/course-4.png', featured: false },
    { id: '5', slug: 'bayou-oaks', name: 'Bayou Oaks at City Park', address: 'New Orleans, LA', holes: 18, credits: 75, rack: 95, img: '/imagery/course-5.png', featured: false },
    { id: '6', slug: 'palm-harbor-golf-club', name: 'Palm Harbor Golf Club', address: 'Palm Harbor, FL', holes: 18, credits: 110, rack: 145, img: '/imagery/course-6.jpeg', featured: false },
  ]

  const displayCourses = topCourses.length > 0
    ? topCourses.map((c, i) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        address: c.address,
        holes: c.holes ?? 18,
        credits: c.baseCreditCost,
        rack: c.rackRateCents ? Math.round(c.rackRateCents / 100) : fallbackCourses[i % fallbackCourses.length].rack,
        img: (c.photos as string[])?.[0] ?? fallbackCourses[i % fallbackCourses.length].img,
        featured: i === 1,
      }))
    : fallbackCourses

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" id="hero-section">
        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/imagery/hero.png"
        >
          <source src="/imagery/hero_bunker.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <svg className="putt-canvas" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice">
          <path className="putt-path" id="pl1" d="M 80,740 C 160,640 280,560 420,480 C 560,400 680,360 820,300 C 940,248 1060,200 1180,160" />
          <path className="putt-path" id="pl2" d="M 300,760 C 360,700 420,650 500,590 C 590,524 690,480 800,440 C 900,404 1020,370 1120,330" />
          <path className="putt-path" id="pl3" d="M 550,760 C 590,710 630,668 680,620 C 740,562 810,520 880,480 C 950,440 1030,406 1120,370" />
          <path className="putt-path" id="pl4" d="M 920,740 C 940,700 960,666 990,630 C 1030,582 1080,548 1130,514 C 1180,480 1250,450 1340,426" />
          <path className="putt-path" id="pl5" d="M 160,760 C 220,706 290,658 380,606 C 480,548 590,504 720,462 C 840,422 980,390 1140,356" />
        </svg>
        <div className="hero-watermark">GIMMELAB</div>

        <div className="hero-left">
          <div className="hero-label">Credit-based tee times</div>
          <h1 className="hero-title">
            <span className="thin">its time to</span><br />
            reprice golf
          </h1>
          <p className="hero-body">Book any course with monthly credits. No phone calls, no rate anxiety, no blackout dates.</p>
          <div className="hero-actions">
            <AnimatedButton href="/waitlist" variant="primary">Join the Waitlist</AnimatedButton>
            <AnimatedButton href="/courses" variant="ghost">See Courses</AnimatedButton>
          </div>
        </div>

        <div className="hero-right" style={{ minWidth: 0, overflow: 'hidden' }}>
          <HeroWidget courses={displayCourses.slice(0, 6).map(c => ({
            name: c.name,
            loc: c.address,
            credits: c.credits,
            rack: c.rack,
            img: c.img,
          }))} />
        </div>
        <PuttAnimations />
        <HeroScrollEffect />
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
      <section className="courses" id="courses">
        <div className="courses-head">
          <h2>Book your<br />next round.</h2>
          <div className="courses-head-right">
            <CarouselArrows selector=".courses-carousel" />
            <Link href="/courses" className="see-all">See all courses →</Link>
          </div>
        </div>
        <div className="courses-carousel-wrap">
          <div className="courses-carousel c-grid">
            {displayCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className={`c-card${course.featured ? ' featured' : ''}`}
                data-card
              >
                <div className="c-thumb-wrap">
                  <Image className="c-thumb" src={course.img} alt={course.name} width={400} height={260} loading="lazy" />
                  <div className={`c-tag${course.featured ? ' featured-tag' : ''}`}>
                    {course.featured ? 'Featured' : 'Open today'}
                  </div>
                </div>
                <div className="c-body">
                  <div className="c-name">{course.name}</div>
                  <div className="c-meta">{course.holes} Holes · {course.address}</div>
                  <div className="c-divider" />
                  <div className="c-bottom-row">
                    <div className="c-credits-block">
                      <div className="c-credits-label">Credits</div>
                      <div className={`c-credits-num${course.featured ? ' featured-num' : ''}`}>{course.credits}</div>
                    </div>
                    <div className="c-right-col">
                      <div className="c-status"><span className="c-status-dot" />Live</div>
                      <span className="c-cta">Book tee time →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAVINGS CALCULATOR ── */}
      <SavingsCalculator />

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
            <Link href="/waitlist" className="pc-cta pc-cta-default">Join Waitlist →</Link>
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
            <Link href="/waitlist" className="pc-cta pc-cta-featured">Join Waitlist →</Link>
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
            <Link href="/waitlist" className="pc-cta pc-cta-default">Join Waitlist →</Link>
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
            <div className="stat-number">$1,812</div>
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

      {/* ── VIDEO HERO BANNER ── */}
      <section className="video-banner">
        <video
          className="video-banner-media"
          autoPlay
          loop
          muted
          playsInline
          poster="/imagery/b124cb1f186169993c1b8198de403ae1.jpg"
        >
          <source src="/imagery/b124cb1f186169993c1b8198de403ae1.jpg" />
        </video>
        <Image
          className="video-banner-fallback"
          src="/imagery/b124cb1f186169993c1b8198de403ae1.jpg"
          alt="Golf course"
          fill
          sizes="100vw"
          loading="lazy"
        />
        <div className="video-banner-overlay" />
        <div className="video-banner-content">
          <div className="video-banner-eyebrow">Play anywhere on the network</div>
          <h2 className="video-banner-title">One membership.<br />Every course.</h2>
          <p className="video-banner-sub">
            50+ partner courses. Zero booking fees. Monthly credits that work wherever you want to tee it up.
          </p>
          <div className="video-banner-cta">
            <AnimatedButton href="/waitlist" variant="primary">Join Gimmelab</AnimatedButton>
          </div>
        </div>
      </section>

      {/* ── VOICE ── */}
      {/* Voice + Reviews sections removed during waitlist phase */}

      {/* ── WAITLIST CTA ── */}
      <section className="waitlist-section">
        <div className="waitlist-inner">
          <div className="waitlist-eyebrow">Early access</div>
          <h2 className="hl waitlist-h2">Join the<br /><em>waitlist.</em></h2>
          <p className="waitlist-p">We&apos;re onboarding courses and members in the Philadelphia area. Get on the list — we&apos;ll let you know the moment your first round is ready to book.</p>
          <div className="waitlist-actions">
            <Link href="/waitlist" className="btn-waitlist">Request Early Access →</Link>
          </div>
          <div className="waitlist-footnote">
            <span>No commitment</span>
            <span className="waitlist-dot" />
            <span>No credit card</span>
            <span className="waitlist-dot" />
            <span>Philadelphia first</span>
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
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/press">Press</Link></li>
              <li><Link href="/careers">Careers</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-h">Support</div>
            <ul className="footer-links">
              <li><Link href="/help">Help center</Link></li>
              <li><Link href="/contact">Contact us</Link></li>
              <li><Link href="/partners">Partner courses</Link></li>
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
          font-family: var(--font-inter), 'Inter', sans-serif;
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

        /* ── HERO (redesign v2) ── */
        .hero {
          position: relative;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 0;
          overflow: hidden;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .hero-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(12,10,8,0.82) 0%,
            rgba(12,10,8,0.60) 50%,
            rgba(12,10,8,0.28) 100%
          );
          z-index: 1;
        }
        .putt-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }
        .putt-path {
          fill: none;
          stroke: #fff;
          stroke-width: 1.5;
          stroke-linecap: round;
          opacity: 0;
        }
        .hero-watermark {
          position: absolute;
          bottom: -10px;
          right: -10px;
          font-size: clamp(80px, 12vw, 160px);
          font-weight: 700;
          letter-spacing: -0.07em;
          color: rgba(255,255,255,0.04);
          z-index: 2;
          pointer-events: none;
          user-select: none;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .hero-left {
          position: relative;
          z-index: 3;
          padding: 160px 72px 100px 72px;
        }
        .hero-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 5px;
          margin-bottom: 36px;
          background: rgba(255,255,255,0.06);
        }
        .hero-label::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #C84B2A;
          border-radius: 50%;
        }
        h1.hero-title {
          font-size: clamp(48px, 6.2vw, 92px);
          font-weight: 700;
          line-height: 0.92;
          letter-spacing: -0.045em;
          margin-bottom: 36px;
          color: #fff;
          font-family: var(--font-inter), 'Inter', sans-serif;
          transform: scale(var(--hero-scale, 1));
          filter: blur(var(--hero-blur, 0px));
          opacity: var(--hero-opacity, 1);
          transform-origin: left center;
          transition: transform 0.05s linear, filter 0.05s linear, opacity 0.05s linear;
          will-change: transform, filter, opacity;
        }
        .hero-title .thin { font-weight: 300; color: #fff; }
        .hero-title .red  { color: #fff; }
        .hero-body {
          font-size: 16px;
          font-weight: 400;
          color: rgba(255,255,255,0.85);
          line-height: 1.65;
          max-width: 420px;
          margin-bottom: 44px;
        }
        .hero-actions { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
        .btn-primary {
          background: #C84B2A;
          color: #fff;
          text-decoration: none;
          padding: 14px 30px;
          border-radius: 7px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.01em;
          transition: background 0.18s, transform 0.12s;
        }
        .btn-primary:hover { background: #b03d21; transform: translateY(-1px); }
        .btn-outline {
          color: rgba(255,255,255,0.75);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          padding-bottom: 2px;
          transition: color 0.18s, border-color 0.18s;
        }
        .btn-outline:hover { color: #fff; border-color: #fff; }

        /* hero-right styles in globals.css */
        /* Lab widget styles in globals.css */

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

        /* ── COURSES (redesign) ── */
        .courses { background: #EDE8DF; padding: 96px 48px; overflow: hidden; }
        .courses-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px; gap: 16px; flex-wrap: wrap;
        }
        .courses-head h2 {
          font-size: clamp(38px, 5vw, 60px);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: #131110;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .courses-head-right { display: flex; align-items: center; gap: 20px; }
        .see-all {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4A4540;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 14px;
          border-bottom: 1px solid transparent;
          transition: color 0.18s, border-color 0.18s;
        }
        .see-all:hover { color: #131110; border-color: #4A4540; }

        .carousel-arrows { display: flex; gap: 8px; }
        .carousel-arrow {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1.5px solid #DDD7CC; background: transparent;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #131110; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .carousel-arrow:hover { border-color: #131110; background: #131110; color: #EDE8DF; }

        .courses-carousel-wrap { position: relative; }
        .courses-carousel.c-grid {
          display: flex; gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .courses-carousel.c-grid::-webkit-scrollbar { display: none; }

        .c-card {
          background: #F4F0EA;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #DDD7CC;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.22s, transform 0.22s;
          position: relative;
          text-decoration: none;
          flex: 0 0 calc((100% - 40px) / 3);
          scroll-snap-align: start;
          min-width: 300px;
        }
        .c-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.12);
          transform: translateY(-3px);
        }
        .c-card.featured {
          border-color: #C4893A;
          box-shadow: 0 4px 24px rgba(196,137,58,0.15);
        }
        .c-thumb-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .c-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 30%;
          display: block;
          transition: transform 0.4s ease;
        }
        .c-card:hover .c-thumb { transform: scale(1.04); }
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
        .c-tag.featured-tag {
          background: #C4893A;
          color: #fff;
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
          color: #131110;
          margin-bottom: 6px;
          line-height: 1.1;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .c-meta {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8A847C;
          margin-bottom: 18px;
        }
        .c-divider {
          height: 1px;
          background: #DDD7CC;
          margin-bottom: 18px;
        }
        .c-bottom-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 22px;
        }
        .c-credits-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8A847C;
          margin-bottom: 2px;
        }
        .c-credits-num {
          font-size: 38px;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: #131110;
          line-height: 1;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .c-credits-num.featured-num { color: #C4893A; }
        .c-right-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .c-status {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #1FC76A;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        @keyframes bc-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .c-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1FC76A;
          animation: bc-pulse 2s infinite;
          flex-shrink: 0;
        }
        .c-cta {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C4893A;
          border-bottom: 1px solid #C4893A;
          padding-bottom: 2px;
          transition: color 0.18s, border-color 0.18s;
        }
        .c-card:hover .c-cta { color: #C84B2A; border-color: #C84B2A; }

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
          font-family: var(--font-inter), 'Inter', sans-serif;
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
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
          width: 100%;
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
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .pc-featured .pc-name { color: var(--linen); }
        .pc-price { display: flex; align-items: baseline; gap: 4px; }
        .pc-price-n {
          font-size: 52px; font-weight: 700; letter-spacing: -0.035em; line-height: 1;
          color: var(--midnight);
          font-family: var(--font-inter), 'Inter', sans-serif;
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
          font-family: var(--font-inter), 'Inter', sans-serif;
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
          font-family: var(--font-inter), 'Inter', sans-serif;
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
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-style: italic;
        }
        .stats-quote-text strong { font-weight: 700; font-style: normal; }
        .stats-quote-attr {
          font-size: 13px; color: rgba(255,255,255,0.85); text-align: right;
          white-space: nowrap; font-family: 'Inter', sans-serif;
        }

        /* ── WAITLIST CTA ── */
        .waitlist-section {
          padding: clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px);
          background: var(--midnight);
          text-align: center;
        }
        .waitlist-inner {
          max-width: 680px;
          margin: 0 auto;
        }
        .waitlist-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 28px;
          font-family: 'Inter', sans-serif;
        }
        .waitlist-h2 {
          font-size: clamp(48px, 8vw, 92px);
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: #fff;
          margin-bottom: 28px;
        }
        .waitlist-h2 em {
          font-style: italic;
          color: var(--amber);
        }
        .waitlist-p {
          font-size: clamp(16px, 1.4vw, 19px);
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 40px;
          font-family: 'Inter', sans-serif;
        }
        .waitlist-actions {
          margin-bottom: 32px;
        }
        .btn-waitlist {
          display: inline-block;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--midnight);
          background: #fff;
          border: 1px solid #fff;
          padding: 18px 44px;
          transition: background 0.2s, color 0.2s;
          font-family: 'Inter', sans-serif;
          text-decoration: none;
        }
        .btn-waitlist:hover {
          background: transparent;
          color: #fff;
        }
        .waitlist-footnote {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.04em;
        }
        .waitlist-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        /* ── VIDEO HERO BANNER ── */
        .video-banner {
          position: relative;
          width: 100%;
          height: clamp(480px, 72vh, 720px);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .video-banner-media,
        .video-banner-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .video-banner-fallback { z-index: -1; }
        .video-banner-media::-webkit-media-controls { display: none !important; }
        .video-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(12,10,8,0.78) 0%,
            rgba(12,10,8,0.55) 45%,
            rgba(12,10,8,0.25) 80%,
            rgba(12,10,8,0.15) 100%
          );
          z-index: 1;
        }
        .video-banner-content {
          position: relative;
          z-index: 2;
          padding: 0 64px;
          max-width: 680px;
        }
        .video-banner-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 20px;
        }
        .video-banner-title {
          font-size: clamp(40px, 5.5vw, 78px);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 0.95;
          color: #fff;
          margin-bottom: 24px;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .video-banner-sub {
          font-size: 16px;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          max-width: 520px;
          margin-bottom: 36px;
        }
        .video-banner-cta { display: flex; gap: 14px; align-items: center; }

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
          flex-shrink: 0; font-family: var(--font-inter), 'Inter', sans-serif;
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
          font-family: var(--font-inter), 'Inter', sans-serif;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; }
          .hero-left { padding: 140px 32px 32px; }
          /* hero-right responsive in globals.css */

          .how-grid { grid-template-columns: 1fr; }
          .how-item { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .courses, .comparison-section, .pricing-section, .voice-section, footer { padding-left: 28px; padding-right: 28px; }
          .c-card { flex: 0 0 calc((100% - 20px) / 2); }
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-tier { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .video-banner-content { padding: 0 36px; }
          .voice-section { grid-template-columns: 1fr; gap: 40px; }
          .reviews-section { padding-left: 28px; padding-right: 28px; }
          .reviews-grid { grid-template-columns: 1fr; }
          .footer-top { grid-template-columns: 1fr 1fr; }
          .waitlist-footnote { flex-wrap: wrap; }
          .stats-section { padding: 56px 28px 40px; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .stats-quote { flex-direction: column; align-items: flex-start; gap: 20px; }
          .stats-quote-attr { text-align: left; white-space: normal; }
        }
        @media (min-width: 640px) and (max-width: 1024px) {
        }
        @media (max-width: 640px) {
          .hero-left { padding: 120px 20px 24px; }
          /* hero-right responsive in globals.css */
          .comparison-table { grid-template-columns: 1fr; }
          .comp-col { border-right: none; border-bottom: 1px solid var(--smoke); }
          .c-card { flex: 0 0 calc(100% - 8px); min-width: 260px; }
          .video-banner-content { padding: 0 24px; }
          .footer-top { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
          .stat-block { padding-right: 0; }
          .waitlist-footnote { gap: 10px; }
        }
        @media (max-width: 480px) {
          .hero-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .hero-actions > * { width: 100%; }
        }
      `}</style>
    </>
  )
}
