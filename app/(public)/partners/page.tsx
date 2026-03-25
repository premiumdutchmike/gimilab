import Link from 'next/link'
import PartnerForm from './partners-form'
import { EarningsCalculator } from '@/components/partner/earnings-calculator'

export const metadata = {
  title: 'Partner with Gimmelab — Stop Bartering Tee Times',
  description: 'Gimmelab brings paying, credit-holding members to your course. No barter, no discounted Hot Deals, no lost inventory. Real bookings at rates you control.',
}

export default function PartnersPage() {
  return (
    <>
      <style>{`
        /* ── Tokens ── */
        :root {
          --midnight: #0C0C0B;
          --linen: #F4EEE3;
          --amber: #BF7B2E;
          --amber-dk: #A86B27;
          --coral: #E8402A;
          --stone: #847C72;
          --smoke: #E5DDD3;
          --graphite: #1E1D1B;
          --off-white: #FDFAF6;
        }

        /* ── Page shell ── */
        .pp-root {
          background: var(--off-white);
          color: var(--midnight);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
          overflow-x: hidden;
        }

        /* ── Shared ── */
        .pp-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--amber);
        }
        .pp-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 20px;
        }
        .pp-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        /* ── HERO ── */
        .pp-hero {
          min-height: 92vh;
          display: flex;
          align-items: center;
          position: relative;
          padding: clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .pp-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(191,123,46,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 20% 30%, rgba(232,64,42,0.05) 0%, transparent 50%),
            var(--off-white);
        }
        .pp-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%);
        }
        .pp-hero-content {
          position: relative;
          z-index: 2;
          max-width: 820px;
        }
        .pp-hero-kicker {
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
          color: var(--amber);
          margin-bottom: 36px;
        }
        .pp-hero-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--amber);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .pp-hero-hl {
          font-size: clamp(48px, 8vw, 100px);
          color: var(--midnight);
          margin-bottom: 28px;
        }
        .pp-hero-hl em {
          font-style: normal;
          color: var(--coral);
        }
        .pp-hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: var(--stone);
          line-height: 1.6;
          max-width: 560px;
          margin-bottom: 48px;
        }
        .pp-hero-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .pp-btn-coral {
          background: var(--coral);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 14px 28px;
          border-radius: 3px;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
          border: none;
          cursor: pointer;
        }
        .pp-btn-coral:hover { background: #d03520; transform: translateY(-1px); }
        .pp-btn-outline {
          background: transparent;
          color: var(--midnight);
          font-size: 14px;
          font-weight: 500;
          padding: 14px 28px;
          border-radius: 3px;
          border: 1.5px solid rgba(12,12,11,0.2);
          text-decoration: none;
          transition: border-color 0.15s;
        }
        .pp-btn-outline:hover { border-color: rgba(12,12,11,0.5); }
        .pp-hero-scroll {
          position: absolute;
          bottom: 40px;
          left: clamp(24px, 8vw, 120px);
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--stone);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          z-index: 2;
        }
        .pp-hero-scroll-line {
          width: 40px;
          height: 1px;
          background: var(--stone);
        }

        /* ── PROBLEM SECTION ── */
        .pp-problem {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .pp-problem-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
          margin-bottom: 72px;
        }
        @media (max-width: 768px) {
          .pp-problem-header { grid-template-columns: 1fr; gap: 32px; }
        }
        .pp-problem-hl {
          font-size: clamp(32px, 5vw, 56px);
          color: var(--midnight);
        }
        .pp-problem-body {
          font-size: 17px;
          color: var(--stone);
          line-height: 1.7;
          padding-top: 8px;
        }
        .pp-problem-body strong { color: var(--midnight); font-weight: 600; }

        /* Math visual */
        .pp-math {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 0;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.09);
          border-radius: 4px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .pp-math { grid-template-columns: 1fr; }
          .pp-math-arrow { transform: rotate(90deg); padding: 12px 0; }
        }
        .pp-math-cell {
          padding: 36px 32px;
          text-align: center;
        }
        .pp-math-cell.highlight {
          background: rgba(232,64,42,0.08);
          border-left: 1px solid rgba(232,64,42,0.2);
          border-right: 1px solid rgba(232,64,42,0.2);
        }
        .pp-math-cell.good {
          background: rgba(191,123,46,0.08);
          border-left: 1px solid rgba(191,123,46,0.2);
        }
        .pp-math-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 700;
          line-height: 1;
          margin-bottom: 8px;
        }
        .pp-math-num.red { color: var(--coral); }
        .pp-math-num.muted { color: var(--stone); }
        .pp-math-num.gold { color: var(--amber); }
        .pp-math-sub {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--stone);
        }
        .pp-math-desc {
          font-size: 13px;
          color: var(--stone);
          margin-top: 6px;
          line-height: 1.4;
        }
        .pp-math-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          color: rgba(0,0,0,0.15);
          font-size: 24px;
        }
        .pp-math-footer {
          margin-top: 20px;
          padding: 16px 24px;
          background: rgba(232,64,42,0.07);
          border: 1px solid rgba(232,64,42,0.15);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pp-math-footer-text {
          font-size: 14px;
          color: var(--stone);
        }
        .pp-math-footer-text strong { color: var(--midnight); }
        .pp-math-footer-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: 22px;
          font-weight: 700;
          color: var(--coral);
        }

        /* ── CALCULATOR ── */
        .pp-calcwrap {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: var(--midnight);
        }
        .pp-calc-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .pp-calc-inner { grid-template-columns: 1fr; gap: 40px; }
        }
        .pp-calcwrap .pp-label { color: var(--amber); }
        .pp-calc-hl {
          font-size: clamp(28px, 4vw, 44px);
          color: var(--linen);
          margin-top: 14px;
          margin-bottom: 20px;
        }
        .pp-calc-sub {
          font-size: 16px;
          color: var(--stone);
          line-height: 1.65;
          margin-bottom: 24px;
        }
        .pp-calc-note {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--stone);
          background: rgba(191,123,46,0.08);
          border: 1px solid rgba(191,123,46,0.2);
          border-radius: 3px;
          padding: 12px 16px;
        }
        .pp-calc-note-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--amber);
          flex-shrink: 0;
        }
        .pp-calc-widget {
          background: #fff;
          border-radius: 6px;
          padding: 32px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
        }

        /* ── HOW IT WORKS ── */
        .pp-how {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: var(--smoke);
        }
        .pp-how-header {
          text-align: center;
          margin-bottom: 72px;
        }
        .pp-how-hl {
          font-size: clamp(28px, 4vw, 48px);
          color: var(--midnight);
          margin-top: 14px;
        }
        .pp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }
        @media (max-width: 768px) {
          .pp-steps { grid-template-columns: 1fr; }
        }
        .pp-step {
          padding: 48px 36px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          position: relative;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .pp-step:hover { background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
        .pp-step-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--amber);
          margin-bottom: 20px;
        }
        .pp-step-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--midnight);
          line-height: 1.2;
          margin-bottom: 14px;
          letter-spacing: -0.02em;
        }
        .pp-step-body {
          font-size: 15px;
          color: var(--stone);
          line-height: 1.65;
        }
        .pp-step-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(191,123,46,0.12);
          border: 1px solid rgba(191,123,46,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 24px;
        }

        /* ── COMPARISON ── */
        .pp-compare {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .pp-compare-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .pp-compare-hl {
          font-size: clamp(28px, 4vw, 48px);
          color: var(--midnight);
          margin-top: 14px;
        }
        .pp-compare-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .pp-compare-grid { grid-template-columns: 1fr; }
        }
        .pp-compare-col {
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.09);
          background: #fff;
        }
        .pp-compare-col-head {
          padding: 20px 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .pp-compare-col-head.bad {
          background: rgba(0,0,0,0.03);
          color: var(--stone);
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .pp-compare-col-head.good {
          background: rgba(191,123,46,0.1);
          color: var(--amber);
          border-bottom: 1px solid rgba(191,123,46,0.2);
        }
        .pp-compare-col-body {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pp-compare-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 15px;
          line-height: 1.5;
        }
        .pp-compare-item.neg { color: var(--stone); }
        .pp-compare-item.pos { color: var(--midnight); }
        .pp-compare-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .pp-compare-dot.neg { background: rgba(0,0,0,0.06); color: var(--stone); }
        .pp-compare-dot.pos { background: rgba(191,123,46,0.2); color: var(--amber); }

        /* Annual savings callout */
        .pp-savings {
          margin-top: 32px;
          padding: 40px clamp(28px, 5vw, 60px);
          background: var(--graphite);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 640px) {
          .pp-savings { grid-template-columns: 1fr; text-align: center; }
        }
        .pp-savings-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--stone);
          margin-bottom: 8px;
        }
        .pp-savings-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(20px, 3vw, 28px);
          font-weight: 700;
          color: var(--linen);
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .pp-savings-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 700;
          color: var(--amber);
          line-height: 1;
          white-space: nowrap;
        }
        .pp-savings-num-sub {
          font-size: 13px;
          color: var(--stone);
          margin-top: 4px;
          text-align: right;
        }
        @media (max-width: 640px) {
          .pp-savings-num-sub { text-align: center; }
        }

        /* ── FEATURES ── */
        .pp-features {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: var(--linen);
        }
        .pp-features-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .pp-features-inner { grid-template-columns: 1fr; gap: 48px; }
        }
        .pp-features-hl {
          font-size: clamp(28px, 4vw, 44px);
          color: var(--midnight);
          margin-top: 14px;
          margin-bottom: 24px;
        }
        .pp-features-sub {
          font-size: 16px;
          color: var(--stone);
          line-height: 1.7;
        }
        .pp-feat-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .pp-feat-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 22px 0;
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .pp-feat-item:first-child { border-top: 1px solid rgba(0,0,0,0.08); }
        .pp-feat-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: rgba(191,123,46,0.1);
          border: 1px solid rgba(191,123,46,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .pp-feat-text {}
        .pp-feat-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--midnight);
          margin-bottom: 4px;
        }
        .pp-feat-desc {
          font-size: 14px;
          color: var(--stone);
          line-height: 1.5;
        }

        /* ── ABOUT STRIP ── */
        .pp-about {
          padding: clamp(60px, 8vw, 100px) clamp(24px, 8vw, 120px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 2px;
        }
        @media (max-width: 900px) {
          .pp-about { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 520px) {
          .pp-about { grid-template-columns: 1fr; }
        }
        .pp-stat {
          padding: 32px 28px;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
        }
        .pp-stat-num {
          font-family: var(--font-geist-mono), monospace;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: var(--amber);
          line-height: 1;
          margin-bottom: 8px;
        }
        .pp-stat-label {
          font-size: 13px;
          color: var(--stone);
          line-height: 1.4;
        }

        /* ── CTA / FORM ── */
        .pp-cta {
          padding: clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px);
        }
        .pp-cta-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .pp-cta-inner { grid-template-columns: 1fr; gap: 48px; }
        }
        .pp-cta-hl {
          font-size: clamp(28px, 4vw, 44px);
          color: var(--midnight);
          margin-top: 14px;
          margin-bottom: 24px;
        }
        .pp-cta-body {
          font-size: 16px;
          color: var(--stone);
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .pp-cta-body strong { color: var(--midnight); font-weight: 600; }
        .pp-cta-details {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pp-cta-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--stone);
        }
        .pp-cta-detail-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--amber);
          flex-shrink: 0;
        }

        /* ── Form styles (used by partners-form.tsx) ── */
        .pf-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.09);
          border-radius: 4px;
          padding: 40px 36px;
        }
        .pf-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 560px) {
          .pf-row { grid-template-columns: 1fr; }
        }
        .pf-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pf-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--stone);
        }
        .pf-optional {
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .pf-input {
          background: var(--off-white);
          border: 1.5px solid rgba(0,0,0,0.12);
          border-radius: 3px;
          padding: 12px 14px;
          font-size: 15px;
          color: var(--midnight);
          font-family: inherit;
          transition: border-color 0.15s;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .pf-input::placeholder { color: rgba(132,124,114,0.6); }
        .pf-input:focus { border-color: rgba(191,123,46,0.6); background: #fff; }
        .pf-textarea { resize: vertical; min-height: 80px; }
        .pf-submit {
          background: var(--coral);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.03em;
          padding: 15px 28px;
          border-radius: 3px;
          border: none;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
        }
        .pf-submit:hover:not(:disabled) { background: #d03520; transform: translateY(-1px); }
        .pf-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .pf-fine {
          font-size: 12px;
          color: var(--stone);
          text-align: center;
          margin: 0;
        }
        .pf-success {
          background: rgba(191,123,46,0.06);
          border: 1px solid rgba(191,123,46,0.2);
          border-radius: 4px;
          padding: 60px 40px;
          text-align: center;
        }
        .pf-success-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(191,123,46,0.15);
          border: 1.5px solid rgba(191,123,46,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: var(--amber);
          margin: 0 auto 24px;
        }
        .pf-success-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--midnight);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .pf-success-sub {
          font-size: 15px;
          color: var(--stone);
          line-height: 1.6;
          max-width: 360px;
          margin: 0 auto;
        }
      `}</style>

      <div className="pp-root">

        {/* ── HERO ── */}
        <section className="pp-hero">
          <div className="pp-hero-bg" />
          <div className="pp-hero-grid" />
          <div className="pp-hero-content">
            <div className="pp-hero-kicker">
              <span className="pp-hero-kicker-dot" />
              Now accepting course partners · Greater Philadelphia
            </div>
            <div className="pp-eyebrow">For golf course operators</div>
            <h1 className="pp-hl pp-hero-hl">
              Stop giving away<br />your tee times.
            </h1>
            <p className="pp-hero-sub">
              GolfNow takes 2+ tee times a day as barter. That's inventory you'll never recover.
              Gimmelab pays you per booking — no barter, no discounts, no lost control.
            </p>
            <div className="pp-hero-actions">
              <a href="#contact" className="pp-btn-coral">Become a partner →</a>
              <a href="#how-it-works" className="pp-btn-outline">See how it works</a>
            </div>
          </div>
          <div className="pp-hero-scroll">
            <div className="pp-hero-scroll-line" />
            Scroll to learn more
          </div>
        </section>

        {/* ── THE PROBLEM ── */}
        <section className="pp-problem">
          <div className="pp-problem-header">
            <div>
              <div className="pp-eyebrow">The problem</div>
              <h2 className="pp-hl pp-problem-hl">
                GolfNow's barter<br />model costs you<br />real money.
              </h2>
            </div>
            <div className="pp-problem-body">
              <p>GolfNow doesn't pay for tee times — they take them. In exchange for their software, you hand over 2–4 prime tee times a day. They sell those as "Hot Deals" at steep discounts, keep the revenue, and you get nothing.</p>
              <br />
              <p>For a course doing <strong>$65 green fees</strong>, that's <strong>$40–50K per year</strong> in inventory handed over for free. Every. Single. Year.</p>
            </div>
          </div>

          <div className="pp-math">
            <div className="pp-math-cell">
              <div className="pp-math-num muted">$65</div>
              <div className="pp-math-sub">Your rack rate</div>
              <div className="pp-math-desc">What you'd charge a walk-in</div>
            </div>
            <div className="pp-math-arrow">→</div>
            <div className="pp-math-cell highlight">
              <div className="pp-math-num red">$29</div>
              <div className="pp-math-sub">GolfNow "Hot Deal"</div>
              <div className="pp-math-desc">Sold at 55% off — and you see none of it</div>
            </div>
            <div className="pp-math-arrow">→</div>
            <div className="pp-math-cell good">
              <div className="pp-math-num gold">$0</div>
              <div className="pp-math-sub">Your payout</div>
              <div className="pp-math-desc">It's barter. You already paid with the tee time.</div>
            </div>
          </div>

          <div className="pp-math-footer">
            <div className="pp-math-footer-text">
              At 2 bartered tee times/day × 365 days at <strong>$65/round</strong>, that's inventory worth:
            </div>
            <div className="pp-math-footer-num">$47,450 / yr</div>
          </div>
        </section>

        {/* ── EARNINGS CALCULATOR ── */}
        <section className="pp-calcwrap">
          <div className="pp-calc-inner">
            <div className="pp-calc-left">
              <div className="pp-label">Your numbers</div>
              <h2 className="pp-hl pp-calc-hl">See what you'd earn with Gimmelab.</h2>
              <p className="pp-calc-sub">
                Enter your rate and expected monthly bookings. We take a small margin on the credit conversion — you see a clean per-booking payout.
              </p>
              <div className="pp-calc-note">
                <span className="pp-calc-note-dot" />
                Based on 85% payout rate — you keep more as volume grows.
              </div>
            </div>
            <div className="pp-calc-widget">
              <EarningsCalculator dark={false} />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="pp-how" id="how-it-works">
          <div className="pp-how-header">
            <div className="pp-label">For course partners</div>
            <h2 className="pp-hl pp-how-hl">A better way to fill tee times</h2>
          </div>
          <div className="pp-steps">
            <div className="pp-step">
              <div className="pp-step-icon">🤝</div>
              <div className="pp-step-num">01 — Join</div>
              <div className="pp-step-hl">15-minute onboarding. No lock-in.</div>
              <div className="pp-step-body">Tell us your available tee times and the credit price you want. We handle everything else. Cancel anytime — no annual contracts, no setup fees.</div>
            </div>
            <div className="pp-step">
              <div className="pp-step-icon">⚙️</div>
              <div className="pp-step-num">02 — You control the price</div>
              <div className="pp-step-hl">Set your own credit rate. Change it anytime.</div>
              <div className="pp-step-body">You decide what each round costs in credits. We convert that to a guaranteed dollar payout for every booking. No forced discounts, no Hot Deals, no barter.</div>
            </div>
            <div className="pp-step">
              <div className="pp-step-icon">💰</div>
              <div className="pp-step-num">03 — Get paid</div>
              <div className="pp-step-hl">Real revenue per booking, transferred to you.</div>
              <div className="pp-step-body">Every time a Gimmelab member books your course, you receive a guaranteed payout via Stripe. No waiting, no barter accounting, no chasing invoices.</div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON ── */}
        <section className="pp-compare">
          <div className="pp-compare-header">
            <div className="pp-label">Side by side</div>
            <h2 className="pp-hl pp-compare-hl">GolfNow vs. Gimmelab</h2>
          </div>
          <div className="pp-compare-grid">
            <div className="pp-compare-col">
              <div className="pp-compare-col-head bad">
                <span>✕</span> GolfNow / TeeOff
              </div>
              <div className="pp-compare-col-body">
                {[
                  'Barter-based — you give tee times, not get paid',
                  'Your inventory sold at 40–60% discount',
                  'Zero payout for bartered rounds',
                  'Locked into annual software contracts',
                  'No control over how your course is presented',
                  'Hot Deals train golfers to never pay full rate',
                  '10–20% commission on non-barter bookings',
                ].map((item) => (
                  <div key={item} className="pp-compare-item neg">
                    <div className="pp-compare-dot neg">✕</div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pp-compare-col">
              <div className="pp-compare-col-head good">
                <span>✓</span> Gimmelab
              </div>
              <div className="pp-compare-col-body">
                {[
                  'Guaranteed cash payout for every booking',
                  'You set the credit price — no forced discounts',
                  'Zero barter. Real revenue, every time.',
                  'No contracts. Cancel anytime.',
                  'Members are pre-qualified, paying subscribers',
                  'Builds your reputation with committed golfers',
                  'No commission taken from your payout',
                ].map((item) => (
                  <div key={item} className="pp-compare-item pos">
                    <div className="pp-compare-dot pos">✓</div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pp-savings">
            <div>
              <div className="pp-savings-label">Estimated annual recovery</div>
              <div className="pp-savings-hl">Switch 4 bartered tee times/day to Gimmelab<br />at $50/round — and recover what you've been losing.</div>
            </div>
            <div>
              <div className="pp-savings-num">$73K</div>
              <div className="pp-savings-num-sub">per year, per course</div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="pp-features">
          <div className="pp-features-inner">
            <div>
              <div className="pp-label">What you get</div>
              <h2 className="pp-hl pp-features-hl">Built for operators, not just golfers.</h2>
              <p className="pp-features-sub">
                Gimmelab isn't just a booking channel — it's a tool that respects your business. Every feature is designed to give you more revenue and more control, with less noise.
              </p>
            </div>
            <div className="pp-feat-list">
              {[
                { icon: '📊', title: 'Partner dashboard', desc: 'Real-time view of upcoming bookings, payouts, and member activity at your course.' },
                { icon: '💳', title: 'Stripe-powered payouts', desc: 'Automatic payouts after every completed booking. No invoicing, no delay.' },
                { icon: '🗓️', title: 'Full tee sheet control', desc: 'You decide which times are available on Gimmelab. Block out tournaments, events, or peak hours anytime.' },
                { icon: '👤', title: 'Pre-screened members', desc: 'Every Gimmelab member pays $99–$199/month. They\'re committed golfers, not bargain hunters.' },
                { icon: '📍', title: 'Local-first network', desc: 'We\'re focused on Greater Philadelphia. Your course reaches a targeted, local member base — not a national discount audience.' },
                { icon: '🚫', title: 'No lock-in. Ever.', desc: 'Month-to-month partner agreement. If it\'s not working for you, you can leave. No questions asked.' },
              ].map((f) => (
                <div key={f.title} className="pp-feat-item">
                  <div className="pp-feat-icon">{f.icon}</div>
                  <div className="pp-feat-text">
                    <div className="pp-feat-title">{f.title}</div>
                    <div className="pp-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="pp-about">
          {[
            { num: '$99+', label: 'Minimum monthly spend per member — these aren\'t casual browsers' },
            { num: '0%', label: 'Commission we take from your payout — you keep it all' },
            { num: '15 min', label: 'Average time to go live on the platform after onboarding call' },
            { num: 'Philly', label: 'Hyperlocal focus — members are in your market, not nationwide' },
          ].map((s) => (
            <div key={s.num} className="pp-stat">
              <div className="pp-stat-num">{s.num}</div>
              <div className="pp-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── CONTACT FORM ── */}
        <section className="pp-cta" id="contact">
          <div className="pp-cta-inner">
            <div>
              <div className="pp-eyebrow">Get in touch</div>
              <h2 className="pp-hl pp-cta-hl">Let's talk about your course.</h2>
              <p className="pp-cta-body">
                Fill out the form and we'll reach out within one business day to set up a <strong>15-minute call</strong>. No pressure, no pitch deck. Just an honest conversation about whether Gimmelab makes sense for you.
              </p>
              <div className="pp-cta-details">
                {[
                  '15-minute call — we keep it tight',
                  'No commitment required to talk',
                  'We\'ll show you exactly what the payout looks like for your course',
                  'Go live in under a week if you\'re interested',
                ].map((d) => (
                  <div key={d} className="pp-cta-detail">
                    <div className="pp-cta-detail-dot" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <PartnerForm />
          </div>
        </section>

      </div>
    </>
  )
}
