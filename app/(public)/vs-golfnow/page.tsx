import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const VsGolfnowCalculator = dynamic(() => import('@/components/vs-golfnow-calculator'), {
  loading: () => <div style={{ minHeight: 500 }} />,
})

export const metadata: Metadata = {
  title: 'Gimmelab vs GolfNow Premium — See what you would save',
  description:
    'GolfNow helps you book. Gimmelab makes golf cheaper. Run the math on your own rounds and see exactly what you would save.',
}

export default function VsGolfnowPage() {
  return (
    <main className="vgn-page">
      {/* ─────────────────────────────────────────────
          1. HERO — full-bleed photograph, overlay copy
         ───────────────────────────────────────────── */}
      <section className="vgn-hero">
        <Image
          src="/imagery/vs-golfnow/hero.jpeg"
          alt="Golfer walking the fairway at golden hour, clubhouse in the distance"
          fill
          priority
          sizes="100vw"
          className="vgn-hero-img"
        />
        <div className="vgn-hero-overlay" />
        <div className="vgn-hero-content">
          <div className="vgn-hero-eyebrow">The math</div>
          <h1 className="vgn-hero-title">
            GolfNow helps you book.
            <br />
            <span className="vgn-hero-title-gold">Gimmelab makes golf cheaper.</span>
          </h1>
          <p className="vgn-hero-sub">
            We built the math so you don&apos;t have to. Drag the slider. Watch the gap.
          </p>
          <div className="vgn-hero-scroll-hint">
            <a href="#calculator">Run the numbers ↓</a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          2. THE LOGO SHOWDOWN — sets up the comparison
         ───────────────────────────────────────────── */}
      <section className="vgn-logos">
        <div className="vgn-logos-inner">
          <div className="vgn-logo-card vgn-logo-card-golfnow">
            <div className="vgn-logo-label">Them</div>
            <div className="vgn-logo-mark vgn-logo-mark-golfnow">
              Golf<span>Now</span>
              <span className="vgn-logo-sup">Premium</span>
            </div>
            <div className="vgn-logo-price">$99 / year</div>
            <div className="vgn-logo-sub">Booking software that waives $6 fees.</div>
          </div>
          <div className="vgn-logo-vs">vs</div>
          <div className="vgn-logo-card vgn-logo-card-gimmelab">
            <div className="vgn-logo-label">Us</div>
            <div className="vgn-logo-mark vgn-logo-mark-gimmelab">gimmelab</div>
            <div className="vgn-logo-price">From $99 / mo</div>
            <div className="vgn-logo-sub">A subscription that pays for your rounds.</div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          3. CALCULATOR (client, reads URL params)
         ───────────────────────────────────────────── */}
      <div id="calculator">
        <Suspense fallback={<div className="vgn-calc-fallback">Loading calculator…</div>}>
          <VsGolfnowCalculator />
        </Suspense>
      </div>

      {/* ─────────────────────────────────────────────
          4. BREAK PHOTO — "reading the line"
         ───────────────────────────────────────────── */}
      <section className="vgn-break">
        <Image
          src="/imagery/vs-golfnow/reading-putt.jpeg"
          alt="Two golfers reading a putt together"
          fill
          sizes="100vw"
          className="vgn-break-img"
        />
        <div className="vgn-break-overlay" />
        <div className="vgn-break-content">
          <div className="vgn-break-eyebrow">Here&apos;s the thing</div>
          <blockquote className="vgn-break-quote">
            &ldquo;GolfNow sells cheaper software to book golf at rack rate.<br />
            <span className="vgn-gold">Gimmelab is a subscription that replaces rack rate entirely.</span>&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          5. THREE-PANEL PITCH — why the math works
         ───────────────────────────────────────────── */}
      <section className="vgn-pitch">
        <div className="vgn-pitch-inner">
          <div className="vgn-pitch-eyebrow">Why the math works</div>
          <h2 className="vgn-pitch-heading">
            Same tee time. <span className="vgn-gold">Different business model.</span>
          </h2>
          <div className="vgn-pitch-grid">
            <article className="vgn-pitch-card">
              <div className="vgn-pitch-num">01</div>
              <h3>GolfNow saves you booking fees.</h3>
              <p>
                $99/yr Premium waives $4–8 booking fees on every round. For a two-rounds-a-month
                golfer, that nets out to roughly $120–150/yr in savings. Nice, but marginal — you&apos;re
                still paying rack rate at the course.
              </p>
            </article>
            <article className="vgn-pitch-card">
              <div className="vgn-pitch-num">02</div>
              <h3>Gimmelab buys your golf.</h3>
              <p>
                Every round is included in your membership. No green fees, no booking fees, no
                rate-shock on a busy Saturday. Up to $2,500+/yr in real savings depending on how
                much you play.
              </p>
            </article>
            <article className="vgn-pitch-card">
              <div className="vgn-pitch-num">03</div>
              <h3>Bring your foursome.</h3>
              <p>
                Gimmelab credits cover you and the friends you bring. Same tee time, same round,
                one membership — everyone walks in on your QR code. GolfNow makes every golfer
                check out separately.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          6. HONEST QUALIFIER — with a photo for weight
         ───────────────────────────────────────────── */}
      <section className="vgn-qualifier">
        <div className="vgn-qualifier-inner">
          <div className="vgn-qualifier-photo">
            <Image
              src="/imagery/vs-golfnow/walking.jpeg"
              alt="Golfer walking the course alone"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="vgn-qualifier-img"
            />
          </div>
          <div className="vgn-qualifier-text">
            <div className="vgn-qualifier-eyebrow">Honest aside</div>
            <h2 className="vgn-qualifier-heading">
              Who Gimmelab is <span className="vgn-gold">not</span> for.
            </h2>
            <p className="vgn-qualifier-body">
              If you play four rounds a year, stay on GolfNow. You&apos;ll come out ahead.
            </p>
            <p className="vgn-qualifier-body">
              Gimmelab is built for the 2-plus-rounds-a-month golfer — the person who&apos;s
              already spending $2,500+ a year on green fees and is tired of the nickel-and-diming.
              If that&apos;s you, the math above just made your case.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          7. FINAL CTA — full-bleed photo
         ───────────────────────────────────────────── */}
      <section className="vgn-cta">
        <Image
          src="/imagery/vs-golfnow/on-the-tee.jpeg"
          alt="Golfer at the tee at golden hour"
          fill
          sizes="100vw"
          className="vgn-cta-img"
        />
        <div className="vgn-cta-overlay" />
        <div className="vgn-cta-content">
          <div className="vgn-cta-eyebrow">Ready?</div>
          <h2 className="vgn-cta-heading">Stop paying rack rate.</h2>
          <p className="vgn-cta-subhead">
            One membership. Every course on the network. Bring your foursome.
          </p>
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

      {/* ─────────────────────────────────────────────
          8. FOOTER
         ───────────────────────────────────────────── */}
      <footer className="vgn-footer">
        <div className="vgn-footer-inner">
          <div className="vgn-footer-mark">gimmelab</div>
          <nav className="vgn-footer-nav">
            <Link href="/">Home</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/partners">For courses</Link>
          </nav>
          <div className="vgn-footer-copy">
            © {new Date().getFullYear()} Gimmelab. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        .vgn-page {
          font-family: var(--font-inter), 'Inter', sans-serif;
          background: #EDE8DF;
          color: #131110;
        }
        .vgn-page * { box-sizing: border-box; }
        .vgn-gold { color: #C4893A; }

        /* ═════════════════════════════════════════════
           1. HERO — full-bleed photo with overlay copy
           ═════════════════════════════════════════════ */
        .vgn-hero {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 640px;
          overflow: hidden;
        }
        .vgn-hero-img {
          object-fit: cover;
          object-position: center 40%;
          z-index: 0;
        }
        .vgn-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(19,17,16,0.35) 0%,
            rgba(19,17,16,0.5) 40%,
            rgba(19,17,16,0.85) 100%
          );
          z-index: 1;
        }
        .vgn-hero-content {
          position: absolute;
          z-index: 2;
          bottom: 88px;
          left: 56px;
          right: 56px;
          max-width: 1200px;
        }
        .vgn-hero-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 28px;
        }
        .vgn-hero-title {
          font-size: clamp(42px, 6.5vw, 88px);
          font-weight: 900;
          letter-spacing: -0.045em;
          color: #F4EEE3;
          line-height: 0.95;
          margin: 0 0 28px;
          max-width: 1100px;
        }
        .vgn-hero-title-gold { color: #C4893A; }
        .vgn-hero-sub {
          font-size: clamp(16px, 1.6vw, 20px);
          color: rgba(244,238,227,0.75);
          max-width: 620px;
          line-height: 1.5;
          margin: 0 0 36px;
        }
        .vgn-hero-scroll-hint a {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #F4EEE3;
          text-decoration: none;
          border-bottom: 1px solid #C4893A;
          padding-bottom: 4px;
          transition: color 0.18s, border-color 0.18s;
        }
        .vgn-hero-scroll-hint a:hover { color: #C4893A; }

        /* ═════════════════════════════════════════════
           2. LOGO SHOWDOWN
           ═════════════════════════════════════════════ */
        .vgn-logos {
          background: #EDE8DF;
          padding: 96px 56px;
          border-bottom: 1px solid #DDD7CC;
        }
        .vgn-logos-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          align-items: center;
        }
        .vgn-logo-card {
          text-align: center;
          padding: 40px 28px;
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-radius: 14px;
        }
        .vgn-logo-label {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8A847C;
          margin-bottom: 18px;
        }
        .vgn-logo-mark {
          font-size: clamp(32px, 4vw, 44px);
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1;
          margin-bottom: 18px;
          position: relative;
          display: inline-block;
        }
        .vgn-logo-mark-golfnow {
          color: #131110;
          font-family: Arial, Helvetica, sans-serif;
          font-style: italic;
        }
        .vgn-logo-mark-golfnow span {
          color: #00B140;
        }
        .vgn-logo-sup {
          position: absolute;
          top: -8px;
          right: -56px;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 9px !important;
          color: #8A847C;
          font-style: normal !important;
          font-weight: 600 !important;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .vgn-logo-mark-gimmelab {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          color: #131110;
        }
        .vgn-logo-price {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #C4893A;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }
        .vgn-logo-sub {
          font-size: 13px;
          color: #4A4540;
          line-height: 1.5;
        }
        .vgn-logo-vs {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 14px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C4893A;
          font-weight: 700;
        }
        .vgn-logo-card-gimmelab {
          border-color: #C4893A;
          box-shadow: 0 4px 24px rgba(196,137,58,0.15);
        }

        .vgn-calc-fallback {
          padding: 96px 56px;
          text-align: center;
          color: #8A847C;
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
        }

        /* ═════════════════════════════════════════════
           4. BREAK PHOTO — pull quote over image
           ═════════════════════════════════════════════ */
        .vgn-break {
          position: relative;
          width: 100%;
          min-height: 520px;
          padding: 120px 56px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vgn-break-img {
          object-fit: cover;
          object-position: center;
          z-index: 0;
        }
        .vgn-break-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(19,17,16,0.55), rgba(19,17,16,0.80));
          z-index: 1;
        }
        .vgn-break-content {
          position: relative;
          z-index: 2;
          max-width: 900px;
          text-align: center;
        }
        .vgn-break-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 24px;
        }
        .vgn-break-quote {
          font-size: clamp(24px, 3.4vw, 44px);
          font-weight: 700;
          color: #F4EEE3;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin: 0;
        }

        /* ═════════════════════════════════════════════
           5. THREE-PANEL PITCH
           ═════════════════════════════════════════════ */
        .vgn-pitch {
          background: #EDE8DF;
          padding: 110px 56px;
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
          font-size: clamp(32px, 4.4vw, 54px);
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1.05;
          color: #131110;
          margin: 0 0 64px;
          max-width: 900px;
        }
        .vgn-pitch-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .vgn-pitch-card {
          background: #F4F0EA;
          border: 1px solid #DDD7CC;
          border-left: 3px solid #C4893A;
          border-radius: 4px;
          padding: 36px 32px 32px;
        }
        .vgn-pitch-num {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: #C4893A;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .vgn-pitch-card h3 {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #131110;
          margin: 0 0 14px;
          line-height: 1.25;
        }
        .vgn-pitch-card p {
          font-size: 14px;
          color: #4A4540;
          line-height: 1.65;
          margin: 0;
        }

        /* ═════════════════════════════════════════════
           6. HONEST QUALIFIER — split with photo
           ═════════════════════════════════════════════ */
        .vgn-qualifier {
          background: #DDD7CC;
          padding: 0;
          overflow: hidden;
        }
        .vgn-qualifier-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
          min-height: 520px;
        }
        .vgn-qualifier-photo {
          position: relative;
          min-height: 420px;
        }
        .vgn-qualifier-img {
          object-fit: cover;
          object-position: center;
        }
        .vgn-qualifier-text {
          padding: 80px 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .vgn-qualifier-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 18px;
        }
        .vgn-qualifier-heading {
          font-size: clamp(32px, 4.4vw, 52px);
          font-weight: 900;
          letter-spacing: -0.035em;
          color: #131110;
          margin: 0 0 28px;
          line-height: 1.05;
        }
        .vgn-qualifier-body {
          font-size: 16px;
          color: #4A4540;
          line-height: 1.65;
          margin: 0 0 16px;
          max-width: 480px;
        }

        /* ═════════════════════════════════════════════
           7. FINAL CTA — full-bleed photo
           ═════════════════════════════════════════════ */
        .vgn-cta {
          position: relative;
          width: 100%;
          min-height: 640px;
          padding: 140px 56px;
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .vgn-cta-img {
          object-fit: cover;
          object-position: center;
          z-index: 0;
        }
        .vgn-cta-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(19,17,16,0.5) 0%,
            rgba(19,17,16,0.75) 100%
          );
          z-index: 1;
        }
        .vgn-cta-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .vgn-cta-eyebrow {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #C4893A;
          margin-bottom: 24px;
        }
        .vgn-cta-heading {
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #F4EEE3;
          line-height: 0.95;
          margin: 0 0 24px;
        }
        .vgn-cta-subhead {
          font-size: clamp(16px, 1.5vw, 20px);
          color: rgba(244,238,227,0.75);
          margin: 0 0 44px;
          line-height: 1.5;
        }
        .vgn-cta-buttons {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .vgn-cta-primary {
          background: #C4893A;
          color: #F4EEE3;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 18px 32px;
          border-radius: 2px;
          text-decoration: none;
          transition: background 0.18s, transform 0.12s;
        }
        .vgn-cta-primary:hover { background: #d09947; transform: translateY(-1px); }
        .vgn-cta-secondary {
          background: transparent;
          color: #F4EEE3;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 18px 32px;
          border: 1px solid rgba(244,238,227,0.35);
          border-radius: 2px;
          text-decoration: none;
          transition: border-color 0.18s, background 0.18s;
        }
        .vgn-cta-secondary:hover { border-color: #F4EEE3; background: rgba(244,238,227,0.05); }
        .vgn-cta-trust {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: rgba(244,238,227,0.45);
          margin: 0;
        }

        /* ═════════════════════════════════════════════
           8. FOOTER
           ═════════════════════════════════════════════ */
        .vgn-footer {
          background: #131110;
          color: #F4EEE3;
          padding: 48px 56px 40px;
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
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #F4EEE3;
          letter-spacing: -0.03em;
        }
        .vgn-footer-nav {
          display: flex;
          gap: 28px;
        }
        .vgn-footer-nav a {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(244,238,227,0.55);
          text-decoration: none;
          transition: color 0.18s;
        }
        .vgn-footer-nav a:hover { color: #C4893A; }
        .vgn-footer-copy {
          font-family: var(--font-space-mono), 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: rgba(244,238,227,0.35);
        }

        /* ═════════════════════════════════════════════
           RESPONSIVE
           ═════════════════════════════════════════════ */
        @media (max-width: 900px) {
          .vgn-hero-content { left: 32px; right: 32px; bottom: 64px; }
          .vgn-logos { padding: 72px 32px; }
          .vgn-logos-inner { grid-template-columns: 1fr; gap: 20px; }
          .vgn-logo-vs { padding: 8px 0; }
          .vgn-logo-sup { right: 0; top: -14px; }
          .vgn-break { padding: 96px 32px; min-height: 420px; }
          .vgn-pitch { padding: 80px 32px; }
          .vgn-pitch-grid { grid-template-columns: 1fr; gap: 16px; }
          .vgn-qualifier-inner { grid-template-columns: 1fr; }
          .vgn-qualifier-photo { min-height: 320px; }
          .vgn-qualifier-text { padding: 56px 32px; }
          .vgn-cta { padding: 100px 32px; min-height: 540px; }
          .vgn-footer { padding: 36px 32px; }
          .vgn-footer-inner { flex-direction: column; align-items: flex-start; gap: 20px; }
        }
        @media (max-width: 560px) {
          .vgn-hero { min-height: 580px; }
          .vgn-hero-content { left: 20px; right: 20px; bottom: 48px; }
          .vgn-logos { padding: 56px 20px; }
          .vgn-break { padding: 80px 20px; }
          .vgn-pitch { padding: 64px 20px; }
          .vgn-pitch-card { padding: 28px 24px 26px; }
          .vgn-qualifier-text { padding: 48px 24px; }
          .vgn-cta { padding: 80px 20px; min-height: 520px; }
          .vgn-footer { padding: 32px 20px; }
        }
      `}</style>
    </main>
  )
}
