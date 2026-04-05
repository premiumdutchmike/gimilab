import Link from 'next/link'
import { Suspense } from 'react'
import MathBlock from './math-block'
import VsAnalytics from './analytics'
import VsNav from './vs-nav'
import VsFooter from './vs-footer'

export const metadata = {
  title: 'Gimmelab vs Tee Time Golf Pass: The Honest Comparison (2026)',
  description:
    'Tee Time Golf Pass saves golfers ~$500/year. Gimmelab saves more once you play 25+ rounds. Here\'s the structural difference — and how to decide which is right for you.',
  alternates: { canonical: '/vs-teetimegolfpass' },
}

const faqs = [
  {
    q: 'Is Tee Time Golf Pass worth it?',
    a: 'For casual golfers playing 6–10 rounds a year in a single region, TTGP is a solid product — the math works at low volume and it has been around since 1992 for a reason. For golfers playing 20+ rounds a year, the $500 annual savings ceiling becomes a real limitation.',
  },
  {
    q: 'What is the difference between Tee Time Golf Pass and Gimmelab?',
    a: 'TTGP uses a static discount model — courses set one fixed member rate and that rate never changes. Gimmelab uses a dynamic credit model where courses can adjust their pricing and earn higher commission tiers for deeper discounts, so savings scale with how much you play.',
  },
  {
    q: 'Which is cheaper, Tee Time Golf Pass or Gimmelab?',
    a: 'At 10–15 rounds per year, TTGP is cheaper on a total-cost basis. Once you pass roughly 25 rounds per year, Gimmelab Core ($149/mo) comes out ahead — and the gap widens with every additional round.',
  },
  {
    q: 'Can I use both?',
    a: 'You can — but you probably don\'t need to. TTGP and Gimmelab cover different courses and different use cases. If you play heavily in Philly, Gimmelab will cover most of your rounds. If you travel a lot and only play occasionally, TTGP\'s regional coverage may still be useful.',
  },
  {
    q: 'What is the best golf discount pass?',
    a: 'There isn\'t one "best" pass — it depends entirely on how much you play. Light players (under 15 rounds/yr) are best served by a flat-discount pass like TTGP. Regular players (25+ rounds/yr) save more with a subscription model like Gimmelab Core. The honest answer is: do the math for your own play volume.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function VsTeeTimeGolfPassPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <VsAnalytics />
      <VsNav />

      <div className="vs-root">
        {/* ── HERO ── */}
        <section className="vs-hero">
          <div className="vs-hero-bg" />
          <div className="vs-hero-grid" />
          <div className="vs-hero-content">
            <div className="vs-hero-kicker">
              <span className="vs-hero-kicker-dot" />
              The honest comparison
            </div>
            <h1 className="vs-hl vs-hero-hl">
              Tee Time Golf Pass has been<br />
              around since 1992.<br />
              <em>Here's what changed.</em>
            </h1>
            <p className="vs-hero-sub">
              The pass model works. It just doesn't scale. Here's why — and what comes next.
            </p>

            <div className="vs-hero-stat-row">
              <div className="vs-hero-stat">
                <div className="vs-hero-stat-label">Tee Time Golf Pass</div>
                <div className="vs-hero-stat-num">$500+</div>
                <div className="vs-hero-stat-sub">"most members save" — fixed discount, fixed plateau</div>
              </div>
              <div className="vs-hero-stat-divider" />
              <div className="vs-hero-stat vs-hero-stat-win">
                <div className="vs-hero-stat-label">Gimmelab Core</div>
                <div className="vs-hero-stat-num">$1,812</div>
                <div className="vs-hero-stat-sub">savings / yr at 36 rounds ($100 Philly avg) — scales with play</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW THE PASS MODEL WORKS ── */}
        <section className="vs-section">
          <div className="vs-section-head">
            <div className="vs-label">Section 01 — Context</div>
            <h2 className="vs-hl vs-section-hl">How the pass model works.</h2>
            <p className="vs-section-sub">
              A fair explanation of how TTGP works. No spin. They've served over a million golfers
              across 34 years — the product is real, and we're not going to pretend otherwise.
            </p>
          </div>
          <div className="vs-bullet-grid">
            {[
              'Course opts in once and sets a static member rate.',
              'Golfer pays $34.99+/yr for a regional pass, or $99.99/yr for the Super Pass.',
              'Show the membership card at check-in, pay the negotiated rate.',
              'No booking app, no dynamic pricing, no per-round fee.',
              '1,100+ courses across 20 US states + Ontario. "Most members save $500+ per season."',
              'Works. Has worked since 1992. The math is simple and the product is honest.',
            ].map((item) => (
              <div key={item} className="vs-bullet">
                <div className="vs-bullet-dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── THE CEILING PROBLEM ── */}
        <section className="vs-section vs-section-alt">
          <div className="vs-section-head">
            <div className="vs-label">Section 02 — The ceiling</div>
            <h2 className="vs-hl vs-section-hl">
              A static discount<br />
              <em>stays static.</em>
            </h2>
            <p className="vs-section-sub">
              The issue isn't quality. It's structural. The pass model has a built-in savings ceiling
              because neither the course nor the platform has any incentive to deepen discounts over
              time. TTGP negotiates a rate once. It doesn't change.
            </p>
          </div>

          <div className="vs-ceiling-grid">
            <div className="vs-ceiling-card">
              <div className="vs-ceiling-num">01</div>
              <div className="vs-ceiling-hl">No feedback loop.</div>
              <p className="vs-ceiling-body">
                Courses get no revenue share, no member data, and no performance upside from offering
                a deeper discount. So the discount settles at the minimum they're willing to offer —
                never the maximum they could.
              </p>
            </div>
            <div className="vs-ceiling-card">
              <div className="vs-ceiling-num">02</div>
              <div className="vs-ceiling-hl">Savings don't scale.</div>
              <p className="vs-ceiling-body">
                Play 12 rounds? Save $500. Play 36 rounds? Still save $500. For a 2x-a-month golfer,
                the ceiling is hit early and that's the end of the line. Your savings plateau.
              </p>
            </div>
            <div className="vs-ceiling-card">
              <div className="vs-ceiling-num">03</div>
              <div className="vs-ceiling-hl">Built for 1992.</div>
              <p className="vs-ceiling-body">
                Show a card. Pay at the counter. No app, no live availability, no way for a course to
                adjust based on demand. The model hasn't meaningfully evolved in three decades.
              </p>
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <section className="vs-section">
          <div className="vs-section-head">
            <div className="vs-label">Section 03 — Side by side</div>
            <h2 className="vs-hl vs-section-hl">The feature comparison.</h2>
            <p className="vs-section-sub">
              Honest, no asterisks. TTGP figures pulled from teetimegolfpass.com.
            </p>
          </div>

          <div className="vs-table-wrap" data-vs-table>
            <table className="vs-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Tee Time Golf Pass</th>
                  <th className="vs-table-win">Gimmelab</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Founded', '1992', '2026'],
                  [
                    'Annual cost',
                    '$34.99+ regional / $99.99 Super Pass',
                    '$99 – $199 / month',
                  ],
                  [
                    'How discounts are set',
                    'Course sets a static rate once',
                    'Course sets a dynamic rate — update anytime',
                  ],
                  [
                    'Course incentive to discount deeper',
                    'None',
                    'Higher discount → higher commission tier',
                  ],
                  ['Savings scale with play?', 'No — fixed ceiling', 'Yes — every round stacks'],
                  ['Avg member savings / year', 'TTGP claims "$500+ per season"', '$1,200 – $2,000+'],
                  ['Heavy player (36+ rounds)', 'Savings plateau at discount × rounds', '$1,812+ per year'],
                  ['Booking flow', 'Show card at counter', 'Book in-app, QR at check-in'],
                  ['Course analytics & dashboard', 'None', 'Full booking dashboard'],
                  ['Network', '1,100+ courses, 20 states + Ontario', 'Philly metro — growing'],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="vs-table-label">{row[0]}</td>
                    <td>{row[1]}</td>
                    <td className="vs-table-win">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── MATH BLOCK ── */}
        <section className="vs-section vs-section-alt">
          <div className="vs-section-head">
            <div className="vs-label">Section 04 — Here's the math</div>
            <h2 className="vs-hl vs-section-hl">
              The math for a<br />
              <em>real Philly golfer.</em>
            </h2>
            <p className="vs-section-sub">
              Drag the sliders. Watch the numbers change. Your savings should scale with how much
              you play — this is the easiest way to see why the pass model tops out.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="vs-math-wrap">
                <div className="vs-math-loading">Loading math…</div>
              </div>
            }
          >
            <MathBlock />
          </Suspense>
        </section>

        {/* ── WHO SHOULD STILL USE TTGP ── */}
        <section className="vs-section">
          <div className="vs-honest-card">
            <div className="vs-label" style={{ color: 'var(--vs-amber)' }}>
              Section 05 — When TTGP is the right call
            </div>
            <h2 className="vs-hl vs-honest-hl">Who should still use Tee Time Golf Pass.</h2>
            <p className="vs-honest-body">
              If you play 6–10 rounds a year in one region and want the simplest possible option,
              Tee Time Golf Pass is a good product. It's been around since 1992 for a reason. The
              math works at low volume.
            </p>
            <div className="vs-honest-divider" />
            <div className="vs-honest-sub">Gimmelab makes more sense when:</div>
            <ul className="vs-honest-list">
              <li>You play 25+ rounds a year.</li>
              <li>You want your savings to scale as you play more.</li>
              <li>You want to book through an app, not hand over a card at the counter.</li>
              <li>You care about the course network growing and improving over time.</li>
              <li>You're in the Philly metro area — that's our launch market.</li>
            </ul>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="vs-section vs-section-alt">
          <div className="vs-section-head">
            <div className="vs-label">Section 06 — FAQ</div>
            <h2 className="vs-hl vs-section-hl">Questions golfers ask.</h2>
          </div>
          <div className="vs-faq">
            {faqs.map((f) => (
              <details key={f.q} className="vs-faq-item" data-vs-faq>
                <summary className="vs-faq-q">
                  <span data-vs-faq-q>{f.q}</span>
                  <span className="vs-faq-plus">+</span>
                </summary>
                <div className="vs-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="vs-cta">
          <div className="vs-cta-inner">
            <div className="vs-label" style={{ color: 'var(--vs-coral)' }}>
              Your move
            </div>
            <h2 className="vs-hl vs-cta-hl">
              Stop paying rack rate.<br />
              <em>Start playing more.</em>
            </h2>
            <p className="vs-cta-body">
              Gimmelab Core is $149/mo. Credits refresh every month. Any partner course. Zero
              booking fees. Cancel anytime.
            </p>
            <div className="vs-cta-actions">
              <Link
                href="/signup?plan=core"
                className="vs-btn vs-btn-primary"
                data-vs-cta="signup"
              >
                Start your membership →
              </Link>
              <Link
                href="/pricing"
                className="vs-btn vs-btn-ghost"
                data-vs-cta="pricing"
              >
                See all plans
              </Link>
            </div>
          </div>
        </section>
      </div>

      <VsFooter />

      <style>{`
        :root {
          --vs-midnight: #0C0C0B;
          --vs-linen: #F4EEE3;
          --vs-amber: #BF7B2E;
          --vs-coral: #E8402A;
          --vs-stone: #847C72;
          --vs-smoke: #E5DDD3;
          --vs-off-white: #FDFAF6;
          --vs-graphite: #1E1D1B;
        }

        .vs-root {
          background: var(--vs-off-white);
          color: var(--vs-midnight);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
          overflow-x: hidden;
        }
        .vs-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        .vs-hl em {
          font-style: italic;
          font-weight: 700;
          color: var(--vs-amber);
        }
        .vs-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-stone);
          margin-bottom: 20px;
        }

        /* ── HERO ── */
        .vs-hero {
          position: relative;
          min-height: 88vh;
          display: flex;
          align-items: center;
          padding: clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .vs-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(191,123,46,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 20% 30%, rgba(232,64,42,0.05) 0%, transparent 50%),
            var(--vs-off-white);
        }
        .vs-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%);
        }
        .vs-hero-content {
          position: relative;
          z-index: 2;
          max-width: 960px;
        }
        .vs-hero-kicker {
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
          color: var(--vs-amber);
          margin-bottom: 36px;
        }
        .vs-hero-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--vs-amber);
        }
        .vs-hero-hl {
          font-size: clamp(44px, 7vw, 92px);
          color: var(--vs-midnight);
          margin-bottom: 28px;
        }
        .vs-hero-sub {
          font-size: clamp(17px, 1.5vw, 21px);
          line-height: 1.55;
          color: var(--vs-stone);
          max-width: 640px;
          margin-bottom: 56px;
        }
        .vs-hero-stat-row {
          display: flex;
          align-items: stretch;
          gap: 40px;
          flex-wrap: wrap;
        }
        .vs-hero-stat-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-stone);
          margin-bottom: 10px;
        }
        .vs-hero-stat-num {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: clamp(40px, 5vw, 64px);
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--vs-midnight);
          margin-bottom: 8px;
        }
        .vs-hero-stat-win .vs-hero-stat-num {
          color: var(--vs-amber);
        }
        .vs-hero-stat-sub {
          font-size: 13px;
          color: var(--vs-stone);
          max-width: 240px;
          line-height: 1.45;
        }
        .vs-hero-stat-divider {
          width: 1px;
          background: rgba(0,0,0,0.1);
        }

        /* ── SECTIONS ── */
        .vs-section {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .vs-section-alt {
          background: var(--vs-linen);
        }
        .vs-section-head {
          max-width: 720px;
          margin-bottom: 72px;
        }
        .vs-section-hl {
          font-size: clamp(36px, 5vw, 64px);
          color: var(--vs-midnight);
          margin-bottom: 24px;
        }
        .vs-section-sub {
          font-size: 17px;
          line-height: 1.6;
          color: var(--vs-stone);
        }

        /* ── BULLET GRID (section 01) ── */
        .vs-bullet-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px 56px;
          max-width: 1100px;
        }
        .vs-bullet {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 0;
          border-top: 1px solid rgba(0,0,0,0.08);
          font-size: 17px;
          line-height: 1.5;
          color: var(--vs-midnight);
        }
        .vs-bullet-dot {
          width: 8px;
          height: 8px;
          background: var(--vs-amber);
          margin-top: 10px;
          flex-shrink: 0;
        }

        /* ── CEILING GRID ── */
        .vs-ceiling-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .vs-ceiling-card {
          background: var(--vs-off-white);
          border: 1px solid rgba(0,0,0,0.08);
          padding: 40px 32px;
        }
        .vs-ceiling-num {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--vs-amber);
          margin-bottom: 24px;
          letter-spacing: 0.04em;
        }
        .vs-ceiling-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: 24px;
          letter-spacing: -0.02em;
          color: var(--vs-midnight);
          margin-bottom: 16px;
        }
        .vs-ceiling-body {
          font-size: 15px;
          line-height: 1.6;
          color: var(--vs-stone);
        }

        /* ── TABLE ── */
        .vs-table-wrap {
          overflow-x: auto;
        }
        .vs-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }
        .vs-table th,
        .vs-table td {
          text-align: left;
          padding: 22px 20px;
          font-size: 15px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          vertical-align: top;
        }
        .vs-table thead th {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-stone);
          border-bottom: 2px solid var(--vs-midnight);
          padding-bottom: 18px;
        }
        .vs-table-label {
          font-weight: 600;
          color: var(--vs-midnight);
          width: 28%;
        }
        .vs-table td {
          color: var(--vs-stone);
        }
        .vs-table td.vs-table-win,
        .vs-table th.vs-table-win {
          background: rgba(191,123,46,0.05);
          color: var(--vs-midnight);
          font-weight: 500;
        }
        .vs-table thead th.vs-table-win {
          color: var(--vs-amber);
          border-bottom-color: var(--vs-amber);
        }

        /* ── MATH BLOCK ── */
        .vs-math-wrap {
          background: var(--vs-off-white);
          border: 1px solid rgba(0,0,0,0.08);
          padding: clamp(32px, 5vw, 56px);
        }
        .vs-math-loading {
          color: var(--vs-stone);
          font-size: 15px;
          text-align: center;
          padding: 80px 0;
        }
        .vs-math-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          margin-bottom: 40px;
        }
        .vs-math-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-stone);
          margin-bottom: 16px;
        }
        .vs-math-input-row {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .vs-math-slider {
          flex: 1;
          accent-color: var(--vs-amber);
        }
        .vs-math-value {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: 28px;
          color: var(--vs-midnight);
          min-width: 80px;
          text-align: right;
          letter-spacing: -0.02em;
        }
        .vs-math-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .vs-math-col {
          padding: 32px 24px;
          border: 1px solid rgba(0,0,0,0.08);
          background: var(--vs-off-white);
        }
        .vs-math-col-win {
          background: var(--vs-midnight);
          border-color: var(--vs-midnight);
          color: var(--vs-linen);
        }
        .vs-math-col-head {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: var(--vs-midnight);
          margin-bottom: 6px;
        }
        .vs-math-col-win .vs-math-col-head {
          color: var(--vs-amber);
        }
        .vs-math-col-sub {
          font-size: 12px;
          color: var(--vs-stone);
          margin-bottom: 24px;
          line-height: 1.45;
        }
        .vs-math-col-win .vs-math-col-sub {
          color: rgba(244,238,227,0.55);
        }
        .vs-math-col-num {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: clamp(32px, 4vw, 48px);
          letter-spacing: -0.03em;
          color: var(--vs-midnight);
          margin-bottom: 12px;
          line-height: 1;
        }
        .vs-math-col-win .vs-math-col-num {
          color: var(--vs-linen);
        }
        .vs-math-col-foot {
          font-size: 12px;
          color: var(--vs-stone);
          line-height: 1.5;
        }
        .vs-math-col-win .vs-math-col-foot {
          color: rgba(244,238,227,0.65);
        }
        .vs-math-ceiling {
          color: var(--vs-coral);
          font-weight: 600;
        }
        .vs-math-verdict {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(18px, 2vw, 24px);
          line-height: 1.4;
          color: var(--vs-midnight);
          padding: 24px 0 0 0;
          border-top: 1px solid rgba(0,0,0,0.08);
        }
        .vs-math-verdict strong {
          color: var(--vs-amber);
          font-weight: 700;
        }

        /* ── HONEST CARD ── */
        .vs-honest-card {
          background: var(--vs-midnight);
          color: var(--vs-linen);
          padding: clamp(48px, 6vw, 80px);
          max-width: 920px;
        }
        .vs-honest-hl {
          font-size: clamp(32px, 4vw, 48px);
          color: var(--vs-linen);
          margin-bottom: 28px;
        }
        .vs-honest-body {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(244,238,227,0.8);
          margin-bottom: 0;
          font-style: italic;
        }
        .vs-honest-divider {
          height: 1px;
          background: rgba(244,238,227,0.15);
          margin: 40px 0;
        }
        .vs-honest-sub {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--vs-amber);
          margin-bottom: 20px;
        }
        .vs-honest-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 14px;
        }
        .vs-honest-list li {
          font-size: 16px;
          line-height: 1.5;
          color: var(--vs-linen);
          padding-left: 24px;
          position: relative;
        }
        .vs-honest-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--vs-amber);
          font-weight: 700;
        }

        /* ── FAQ ── */
        .vs-faq {
          max-width: 880px;
        }
        .vs-faq-item {
          border-top: 1px solid rgba(0,0,0,0.1);
          padding: 0;
        }
        .vs-faq-item:last-child {
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        .vs-faq-q {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 0;
          cursor: pointer;
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: clamp(18px, 2vw, 22px);
          color: var(--vs-midnight);
          list-style: none;
        }
        .vs-faq-q::-webkit-details-marker {
          display: none;
        }
        .vs-faq-plus {
          font-size: 24px;
          font-weight: 400;
          color: var(--vs-amber);
          transition: transform 0.2s ease;
        }
        .vs-faq-item[open] .vs-faq-plus {
          transform: rotate(45deg);
        }
        .vs-faq-a {
          padding: 0 0 28px 0;
          font-size: 16px;
          line-height: 1.6;
          color: var(--vs-stone);
          max-width: 760px;
        }

        /* ── CTA ── */
        .vs-cta {
          background: var(--vs-midnight);
          color: var(--vs-linen);
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          text-align: center;
        }
        .vs-cta-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .vs-cta-hl {
          font-size: clamp(40px, 6vw, 72px);
          color: var(--vs-linen);
          margin: 24px 0;
        }
        .vs-cta-hl em {
          color: var(--vs-amber);
        }
        .vs-cta-body {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(244,238,227,0.75);
          margin-bottom: 40px;
        }
        .vs-cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .vs-btn {
          display: inline-flex;
          align-items: center;
          padding: 16px 32px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
        }
        .vs-btn:hover {
          opacity: 0.85;
        }
        .vs-btn-primary {
          background: var(--vs-amber);
          color: var(--vs-off-white);
        }
        .vs-btn-ghost {
          background: transparent;
          color: var(--vs-linen);
          border: 1px solid rgba(244,238,227,0.3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .vs-bullet-grid,
          .vs-ceiling-grid,
          .vs-math-inputs,
          .vs-math-grid {
            grid-template-columns: 1fr;
          }
          .vs-hero-stat-divider {
            display: none;
          }
          .vs-hero-stat-row {
            gap: 32px;
          }
        }
      `}</style>
    </>
  )
}
