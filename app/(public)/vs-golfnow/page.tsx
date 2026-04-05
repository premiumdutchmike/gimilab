import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import VsGolfnowCalculator from '@/components/vs-golfnow-calculator'

export const metadata: Metadata = {
  title: 'Gimmelab vs GolfNow Premium — See what you would save',
  description:
    'GolfNow helps you book. Gimmelab makes golf cheaper. Run the math on your own rounds and see exactly what you would save.',
}

export default function VsGolfnowPage() {
  return (
    <main className="vgn-page">
      {/* 1. HERO */}
      <section className="vgn-hero">
        <div className="vgn-hero-inner">
          <div className="vgn-hero-eyebrow">The math</div>
          <h1 className="vgn-hero-title">
            GolfNow helps you book.
            <br />
            <span className="vgn-hero-title-gold">Gimmelab makes golf cheaper.</span>
          </h1>
          <p className="vgn-hero-sub">
            We built the math so you don&apos;t have to. See what you&apos;d save.
          </p>
          <div className="vgn-hero-scroll-hint">
            <a href="#calculator">Run the numbers ↓</a>
          </div>
        </div>
      </section>

      {/* 2. CALCULATOR (client, reads URL params) */}
      <Suspense fallback={<div className="vgn-calc-fallback">Loading calculator…</div>}>
        <VsGolfnowCalculator />
      </Suspense>

      {/* 3. THREE-PANEL PITCH */}
      <section className="vgn-pitch">
        <div className="vgn-pitch-inner">
          <div className="vgn-pitch-eyebrow">Why the math works</div>
          <h2 className="vgn-pitch-heading">
            Same tee time. <span className="vgn-gold">Different business model.</span>
          </h2>
          <div className="vgn-pitch-grid">
            <article className="vgn-pitch-card">
              <h3>GolfNow saves you booking fees.</h3>
              <p>
                $99/yr Premium waives $4–8 booking fees on every round. For a two-rounds-a-month
                golfer, that nets out to roughly $120–150/yr in savings. Nice, but marginal — you&apos;re
                still paying rack rate at the course.
              </p>
            </article>
            <article className="vgn-pitch-card">
              <h3>Gimmelab buys your golf.</h3>
              <p>
                Every round is included in your membership. No green fees, no booking fees, no
                rate-shock on a busy Saturday. Up to $2,500+/yr in real savings depending on how
                much you play.
              </p>
            </article>
            <article className="vgn-pitch-card">
              <h3>Same tee time. Different model.</h3>
              <p>
                GolfNow sells cheaper software to book golf at rack rate. Gimmelab is a subscription
                that replaces rack rate entirely. One product helps you book. The other one pays
                for the round.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 4. HONEST QUALIFIER */}
      <section className="vgn-qualifier">
        <div className="vgn-qualifier-inner">
          <div className="vgn-qualifier-eyebrow">Honest aside</div>
          <h2 className="vgn-qualifier-heading">Who Gimmelab is not for.</h2>
          <p className="vgn-qualifier-body">
            If you play 4 rounds a year, stay on GolfNow. You&apos;ll come out ahead. Gimmelab is
            built for the 2-plus-rounds-a-month golfer — the person who&apos;s already spending $2,500+
            a year on green fees and is tired of the nickel-and-diming.
          </p>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="vgn-cta">
        <div className="vgn-cta-inner">
          <div className="vgn-cta-eyebrow">Ready?</div>
          <h2 className="vgn-cta-heading">Stop paying rack rate.</h2>
          <div className="vgn-cta-buttons">
            <Link href="/pricing" className="vgn-cta-primary">
              See plans →
            </Link>
            <Link href="/courses" className="vgn-cta-secondary">
              Browse member courses
            </Link>
          </div>
          <p className="vgn-cta-trust">
            Cancel anytime. No contracts. No booking fees, ever.
          </p>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="vgn-footer">
        <div className="vgn-footer-inner">
          <div className="vgn-footer-mark">gimmelab</div>
          <nav className="vgn-footer-nav">
            <Link href="/">Home</Link>
            <Link href="/partners">For courses</Link>
          </nav>
          <div className="vgn-footer-copy">
            © {new Date().getFullYear()} Gimmelab. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        .vgn-page {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          background: #EDE8DF;
          color: #131110;
        }
        .vgn-page * { box-sizing: border-box; }
        .vgn-gold { color: #C4893A; }

        /* ── HERO ─────────────────────────────────── */
        .vgn-hero {
          background: #EDE8DF;
          padding: 140px 56px 120px;
        }
        .vgn-hero-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .vgn-hero-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 32px;
        }
        .vgn-hero-title {
          font-size: clamp(42px, 6vw, 80px);
          font-weight: 900;
          letter-spacing: -0.045em;
          color: #131110;
          line-height: 0.95;
          margin: 0 0 28px;
        }
        .vgn-hero-title-gold { color: #C4893A; }
        .vgn-hero-sub {
          font-size: clamp(16px, 1.6vw, 20px);
          color: #4A4540;
          max-width: 620px;
          line-height: 1.5;
          margin: 0 0 40px;
        }
        .vgn-hero-scroll-hint a {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #131110;
          text-decoration: none;
          border-bottom: 1px solid #C4893A;
          padding-bottom: 2px;
          transition: color 0.18s;
        }
        .vgn-hero-scroll-hint a:hover { color: #C4893A; }

        .vgn-calc-fallback {
          padding: 96px 56px;
          text-align: center;
          color: #8A847C;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        /* ── PITCH ────────────────────────────────── */
        .vgn-pitch {
          background: #EDE8DF;
          padding: 110px 56px;
          border-top: 1px solid #DDD7CC;
        }
        .vgn-pitch-inner { max-width: 1200px; margin: 0 auto; }
        .vgn-pitch-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 14px;
        }
        .vgn-pitch-heading {
          font-size: clamp(32px, 4.5vw, 56px);
          font-weight: 700;
          letter-spacing: -0.045em;
          color: #131110;
          line-height: 1;
          margin: 0 0 56px;
        }
        .vgn-pitch-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .vgn-pitch-card {
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-left: 3px solid #C4893A;
          border-radius: 12px;
          padding: 32px 28px;
        }
        .vgn-pitch-card h3 {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #131110;
          line-height: 1.2;
          margin: 0 0 16px;
        }
        .vgn-pitch-card p {
          font-size: 14px;
          line-height: 1.6;
          color: #4A4540;
          margin: 0;
        }

        /* ── QUALIFIER ────────────────────────────── */
        .vgn-qualifier {
          background: #DDD7CC;
          padding: 80px 56px;
          border-top: 1px solid #CBC5BA;
          border-bottom: 1px solid #CBC5BA;
        }
        .vgn-qualifier-inner { max-width: 760px; margin: 0 auto; }
        .vgn-qualifier-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A6D3A;
          margin-bottom: 14px;
        }
        .vgn-qualifier-heading {
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 700;
          letter-spacing: -0.035em;
          color: #131110;
          margin: 0 0 20px;
          line-height: 1.1;
        }
        .vgn-qualifier-body {
          font-size: 16px;
          line-height: 1.6;
          color: #4A4540;
          margin: 0;
        }

        /* ── CTA ──────────────────────────────────── */
        .vgn-cta {
          background: #131110;
          padding: 120px 56px;
        }
        .vgn-cta-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .vgn-cta-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 18px;
        }
        .vgn-cta-heading {
          font-size: clamp(40px, 5.5vw, 72px);
          font-weight: 900;
          letter-spacing: -0.045em;
          color: #fff;
          line-height: 1;
          margin: 0 0 44px;
        }
        .vgn-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .vgn-cta-primary {
          background: #C4893A;
          color: #fff;
          text-decoration: none;
          padding: 18px 36px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: background 0.18s, transform 0.12s;
        }
        .vgn-cta-primary:hover { background: #b87a2e; transform: translateY(-1px); }
        .vgn-cta-secondary {
          background: transparent;
          color: #EDE8DF;
          text-decoration: none;
          padding: 18px 36px;
          border-radius: 8px;
          border: 1px solid rgba(237,232,223,0.3);
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: border-color 0.18s, color 0.18s;
        }
        .vgn-cta-secondary:hover { border-color: #C4893A; color: #C4893A; }
        .vgn-cta-trust {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.45);
          margin: 0;
        }

        /* ── FOOTER ───────────────────────────────── */
        .vgn-footer {
          background: #EDE8DF;
          padding: 48px 56px;
          border-top: 1px solid #DDD7CC;
        }
        .vgn-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .vgn-footer-mark {
          font-family: var(--font-space-grotesk), 'Space Grotesk', sans-serif;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: -0.04em;
          color: #131110;
        }
        .vgn-footer-nav {
          display: flex;
          gap: 24px;
        }
        .vgn-footer-nav a {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4A4540;
          text-decoration: none;
          transition: color 0.18s;
        }
        .vgn-footer-nav a:hover { color: #C4893A; }
        .vgn-footer-copy {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #8A847C;
        }

        /* ── RESPONSIVE ───────────────────────────── */
        @media (max-width: 1024px) {
          .vgn-hero { padding: 100px 28px 80px; }
          .vgn-pitch { padding: 80px 28px; }
          .vgn-pitch-grid { grid-template-columns: 1fr; gap: 16px; }
          .vgn-qualifier { padding: 64px 28px; }
          .vgn-cta { padding: 96px 28px; }
          .vgn-footer { padding: 40px 28px; }
        }
        @media (max-width: 640px) {
          .vgn-hero { padding: 80px 20px 60px; }
          .vgn-pitch { padding: 64px 20px; }
          .vgn-qualifier { padding: 56px 20px; }
          .vgn-cta { padding: 80px 20px; }
          .vgn-footer { padding: 32px 20px; }
          .vgn-footer-inner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </main>
  )
}
