import Link from 'next/link'

export const metadata = {
  title: 'About Gimmelab — Reprice golf.',
  description:
    'Gimmelab is a credit-based golf membership built for the player who loves the game without needing to perform it. Launched in Philly, 2026.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <>
      <div className="ab-root">
        {/* ── HERO ── */}
        <section className="ab-hero">
          <div className="ab-hero-bg" />
          <div className="ab-hero-grid" />
          <div className="ab-hero-content">
            <div className="ab-kicker">
              <span className="ab-kicker-dot" />
              About Gimmelab
            </div>
            <h1 className="ab-hl ab-hero-hl">
              Golf has a<br />
              gatekeeping problem.<br />
              <em>We don't.</em>
            </h1>
            <p className="ab-hero-sub">
              Gimmelab is a credit-based golf membership built for the player who loves the game
              without needing to perform it. No country clubs. No phone calls. No rack-rate
              anxiety. Just the game.
            </p>
          </div>
        </section>

        {/* ── STORY ── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <div className="ab-label">The story</div>
            <h2 className="ab-hl ab-section-hl">
              We named it after<br />
              <em>the conceded putt.</em>
            </h2>
          </div>
          <div className="ab-prose">
            <p>
              A "gimme" is a putt your playing partners concede because it's close enough.
              It's a small kindness at the end of a hole — a tiny moment of the game being
              generous to you instead of the other way around.
            </p>
            <p>
              Golf doesn't feel that way most of the time. Rack rates climb every year. Booking a
              weekend round means twenty minutes on hold with the pro shop. Discount platforms
              train courses to dump inventory at a loss while golfers get bartered-off tee times
              at 7 a.m. on a Tuesday. The whole system rewards the people who already have
              memberships somewhere else.
            </p>
            <p>
              We built Gimmelab for everyone else. One monthly subscription. Credits that refresh
              every month. Any partner course. Zero booking fees. Book in the app, show a QR at
              check-in, go play.
            </p>
          </div>
        </section>

        {/* ── WHAT WE BELIEVE ── */}
        <section className="ab-section ab-section-alt">
          <div className="ab-section-head">
            <div className="ab-label">What we believe</div>
            <h2 className="ab-hl ab-section-hl">
              Serious. Not stuffy.<br />
              <em>Bold. Not loud.</em>
            </h2>
          </div>
          <div className="ab-beliefs">
            <div className="ab-belief">
              <div className="ab-belief-num">01</div>
              <div className="ab-belief-hl">Savings should scale with play.</div>
              <p className="ab-belief-body">
                If you play more, you should save more. Flat-discount passes top out because
                nobody has any reason to go deeper. We fixed that with a subscription that
                rewards courses for offering better rates, not worse ones.
              </p>
            </div>
            <div className="ab-belief">
              <div className="ab-belief-num">02</div>
              <div className="ab-belief-hl">Partners get paid. Not bartered.</div>
              <p className="ab-belief-body">
                Every booking on Gimmelab pays the course in cash, not in exchange for free tee
                times. No Hot Deals. No discount races to the bottom. Course operators keep
                control of their inventory and their pricing.
              </p>
            </div>
            <div className="ab-belief">
              <div className="ab-belief-num">03</div>
              <div className="ab-belief-hl">No country club energy.</div>
              <p className="ab-belief-body">
                Nobody should feel judged for what they shoot, what they wear, or how often they
                play. The best version of golf is the one where you just show up and tee it up.
                That's the only version we're building for.
              </p>
            </div>
            <div className="ab-belief">
              <div className="ab-belief-num">04</div>
              <div className="ab-belief-hl">Local first.</div>
              <p className="ab-belief-body">
                We're launching in Philly. Not every metro at once, not a nationwide SaaS land
                grab. We want a course network that feels like your course network — the places
                you'd actually drive to on a Saturday morning.
              </p>
            </div>
          </div>
        </section>

        {/* ── FACTS ── */}
        <section className="ab-section">
          <div className="ab-section-head">
            <div className="ab-label">The short version</div>
            <h2 className="ab-hl ab-section-hl">Gimmelab at a glance.</h2>
          </div>
          <div className="ab-facts">
            <div className="ab-fact">
              <div className="ab-fact-label">Founded</div>
              <div className="ab-fact-value">2026</div>
              <div className="ab-fact-sub">Philadelphia, PA</div>
            </div>
            <div className="ab-fact">
              <div className="ab-fact-label">Launch market</div>
              <div className="ab-fact-value">Philly metro</div>
              <div className="ab-fact-sub">Growing course by course</div>
            </div>
            <div className="ab-fact">
              <div className="ab-fact-label">Name origin</div>
              <div className="ab-fact-value">"gimme"</div>
              <div className="ab-fact-sub">The conceded putt — generosity reframed</div>
            </div>
            <div className="ab-fact">
              <div className="ab-fact-label">Booking fees</div>
              <div className="ab-fact-value">$0</div>
              <div className="ab-fact-sub">On every round. Ever. No exceptions.</div>
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section className="ab-section ab-section-alt">
          <div className="ab-contact-card">
            <div className="ab-label" style={{ color: 'var(--ab-amber)' }}>
              Get in touch
            </div>
            <h2 className="ab-hl ab-contact-hl">
              Questions,<br />
              partnerships, press.
            </h2>
            <p className="ab-contact-body">
              We're a small team building something we believe in. If you want to partner a
              course, join the waitlist, write about us, or tell us we got something wrong,
              we want to hear about it.
            </p>
            <div className="ab-contact-grid">
              <div className="ab-contact-item">
                <div className="ab-contact-label">General</div>
                <a href="mailto:info@dutchmike.com" className="ab-contact-link">
                  info@dutchmike.com
                </a>
              </div>
              <div className="ab-contact-item">
                <div className="ab-contact-label">Course partners</div>
                <Link href="/partners" className="ab-contact-link">
                  gimmelab.com/partners
                </Link>
              </div>
              <div className="ab-contact-item">
                <div className="ab-contact-label">Members</div>
                <Link href="/waitlist" className="ab-contact-link">
                  gimmelab.com/signup
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="ab-cta">
          <div className="ab-cta-inner">
            <div className="ab-label" style={{ color: 'var(--ab-coral)' }}>
              One membership. Every course.
            </div>
            <h2 className="ab-hl ab-cta-hl">
              Stop paying rack rate.<br />
              <em>Start playing more.</em>
            </h2>
            <div className="ab-cta-actions">
              <Link href="/waitlist" className="ab-btn ab-btn-primary">
                Join Gimmelab →
              </Link>
              <Link href="/pricing" className="ab-btn ab-btn-ghost">
                See plans
              </Link>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        :root {
          --ab-midnight: #0C0C0B;
          --ab-linen: #F4EEE3;
          --ab-amber: #BF7B2E;
          --ab-coral: #E8402A;
          --ab-stone: #847C72;
          --ab-smoke: #E5DDD3;
          --ab-off-white: #FDFAF6;
        }

        .ab-root {
          background: var(--ab-off-white);
          color: var(--ab-midnight);
          font-family: var(--font-inter), 'Inter', sans-serif;
          overflow-x: hidden;
        }
        .ab-hl {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        .ab-hl em {
          font-style: italic;
          font-weight: 700;
          color: var(--ab-amber);
        }
        .ab-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ab-stone);
          margin-bottom: 20px;
        }

        /* ── HERO ── */
        .ab-hero {
          position: relative;
          min-height: 80vh;
          display: flex;
          align-items: center;
          padding: clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .ab-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(191,123,46,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 20% 30%, rgba(232,64,42,0.05) 0%, transparent 50%),
            var(--ab-off-white);
        }
        .ab-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%);
        }
        .ab-hero-content {
          position: relative;
          z-index: 2;
          max-width: 900px;
        }
        .ab-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(191,123,46,0.12);
          border: 1px solid rgba(191,123,46,0.3);
          border-radius: 999px;
          padding: 6px 14px 6px 10px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--ab-amber);
          margin-bottom: 36px;
        }
        .ab-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ab-amber);
        }
        .ab-hero-hl {
          font-size: clamp(48px, 8vw, 100px);
          color: var(--ab-midnight);
          margin-bottom: 32px;
        }
        .ab-hero-sub {
          font-size: clamp(17px, 1.5vw, 21px);
          line-height: 1.6;
          color: var(--ab-stone);
          max-width: 680px;
        }

        /* ── SECTIONS ── */
        .ab-section {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .ab-section-alt {
          background: var(--ab-linen);
        }
        .ab-section-head {
          max-width: 820px;
          margin-bottom: 72px;
        }
        .ab-section-hl {
          font-size: clamp(36px, 5vw, 64px);
          color: var(--ab-midnight);
          margin-bottom: 24px;
        }

        /* ── PROSE (story section) ── */
        .ab-prose {
          max-width: 720px;
        }
        .ab-prose p {
          font-size: 18px;
          line-height: 1.7;
          color: var(--ab-midnight);
          margin-bottom: 28px;
        }
        .ab-prose p:last-child {
          margin-bottom: 0;
        }

        /* ── BELIEFS ── */
        .ab-beliefs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .ab-belief {
          background: var(--ab-off-white);
          border: 1px solid rgba(0,0,0,0.08);
          padding: 48px 40px;
        }
        .ab-belief-num {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--ab-amber);
          margin-bottom: 24px;
          letter-spacing: 0.04em;
        }
        .ab-belief-hl {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          font-size: 26px;
          letter-spacing: -0.02em;
          color: var(--ab-midnight);
          margin-bottom: 16px;
          line-height: 1.15;
        }
        .ab-belief-body {
          font-size: 16px;
          line-height: 1.6;
          color: var(--ab-stone);
        }

        /* ── FACTS ── */
        .ab-facts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          max-width: 1200px;
        }
        .ab-fact {
          padding: 32px 0;
          border-top: 2px solid var(--ab-midnight);
        }
        .ab-fact-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ab-stone);
          margin-bottom: 16px;
        }
        .ab-fact-value {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          font-size: clamp(28px, 3.5vw, 40px);
          letter-spacing: -0.03em;
          color: var(--ab-midnight);
          margin-bottom: 8px;
          line-height: 1;
        }
        .ab-fact-sub {
          font-size: 13px;
          color: var(--ab-stone);
          line-height: 1.45;
        }

        /* ── CONTACT CARD ── */
        .ab-contact-card {
          background: var(--ab-midnight);
          color: var(--ab-linen);
          padding: clamp(48px, 6vw, 88px);
          max-width: 1000px;
        }
        .ab-contact-hl {
          font-size: clamp(36px, 5vw, 56px);
          color: var(--ab-linen);
          margin-bottom: 28px;
        }
        .ab-contact-body {
          font-size: 18px;
          line-height: 1.65;
          color: rgba(244,238,227,0.75);
          max-width: 640px;
          margin-bottom: 48px;
        }
        .ab-contact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          padding-top: 40px;
          border-top: 1px solid rgba(244,238,227,0.15);
        }
        .ab-contact-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(244,238,227,0.45);
          margin-bottom: 10px;
        }
        .ab-contact-link {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: var(--ab-amber);
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 0.2s ease;
        }
        .ab-contact-link:hover {
          opacity: 0.75;
        }

        /* ── CTA ── */
        .ab-cta {
          background: var(--ab-midnight);
          color: var(--ab-linen);
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          text-align: center;
        }
        .ab-cta-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .ab-cta-hl {
          font-size: clamp(40px, 6vw, 72px);
          color: var(--ab-linen);
          margin: 24px 0 40px;
        }
        .ab-cta-hl em {
          color: var(--ab-amber);
        }
        .ab-cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .ab-btn {
          display: inline-flex;
          align-items: center;
          padding: 16px 32px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
          text-decoration: none;
        }
        .ab-btn:hover {
          opacity: 0.85;
        }
        .ab-btn-primary {
          background: var(--ab-amber);
          color: var(--ab-off-white);
        }
        .ab-btn-ghost {
          background: transparent;
          color: var(--ab-linen);
          border: 1px solid rgba(244,238,227,0.3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .ab-beliefs,
          .ab-facts,
          .ab-contact-grid {
            grid-template-columns: 1fr;
          }
          .ab-facts {
            gap: 0;
          }
          .ab-fact {
            padding: 24px 0;
          }
        }
      `}</style>
    </>
  )
}
