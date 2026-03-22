'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tier = {
  id: string
  name: string
  monthlyPriceCents: number
  monthlyCredits: number
  rolloverMax: number
  stripePriceId: string
}

const CHECK_ICON = (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 11l2 2 4-4"/>
    <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Z"/>
  </svg>
)

const PLAN_FEATURES: Record<string, string[]> = {
  casual: [
    '100 credits, refreshed every month',
    'Access to all 12 member courses',
    'Zero booking fees',
    'Book up to 7 days in advance',
    'Good for ~4–6 rounds/month',
  ],
  core: [
    '150 credits, refreshed every month',
    'Access to all 12 member courses',
    'Zero booking fees',
    'Book up to 14 days in advance',
    'Good for ~8–10 rounds/month',
    'Priority tee time access',
  ],
  heavy: [
    '210 credits, refreshed every month',
    'Access to all 12 member courses',
    'Zero booking fees',
    'Book up to 21 days in advance',
    'Good for 12–15+ rounds/month',
    'Priority tee time access',
  ],
}

const CREDIT_MATH: Record<string, { rate: string; sub: string }> = {
  casual: { rate: '~$0.99/cr', sub: 'per credit' },
  core:   { rate: '~$0.99/cr', sub: 'per credit' },
  heavy:  { rate: '~$0.95/cr', sub: 'best value/credit' },
}

const FAQ_ITEMS = [
  {
    q: 'How do credits work?',
    a: 'Each tee time booking costs 1 or 2 credits depending on the course and time of day. Your credits refresh automatically at the start of every billing cycle. Unused credits do not carry over — each new cycle starts fresh with your full allotment.',
  },
  {
    q: 'Can I bring guests?',
    a: 'Yes. Each tee time slot accommodates 1–4 players. You only spend credits on the booking itself — your guests play at no extra charge to you through the platform. Course green fees are covered by your membership.',
  },
  {
    q: 'What happens if I cancel mid-month?',
    a: 'If you cancel, your membership stays active through the end of the current billing period. You keep your remaining credits and can still book tee times until the period ends. No partial refunds.',
  },
  {
    q: 'Can I change plans?',
    a: 'Yes, upgrade or downgrade at any time from your account page. Plan changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'Are all courses available on every plan?',
    a: 'Yes. All three plans give you access to every course in the Gimmelab network. The difference is simply how many credits you get each month — which determines how often you can play.',
  },
]

const ALL_INCLUDES = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="14" height="14" rx="1"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="13" y1="2" x2="13" y2="6"/><line x1="3" y1="9" x2="17" y2="9"/></svg>,
    label: 'Book any course',
    sub: 'All 12 member courses, any day',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7.5"/><path d="M10 7v6M8.5 8.5h2.5a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H11"/></svg>,
    label: 'Zero booking fees',
    sub: 'We never charge extra to book',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7"/><polyline points="10 6 10 10 13 12"/></svg>,
    label: 'Monthly credits',
    sub: 'Reset each billing cycle automatically',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h14M3 13h14"/><rect x="3" y="3" width="14" height="14" rx="1"/></svg>,
    label: 'Member dashboard',
    sub: 'Manage bookings and credits',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3a7 7 0 1 0 7 7M10 3v4l3 3"/></svg>,
    label: 'Cancel anytime',
    sub: 'No long-term commitment',
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6"/></svg>,
    label: '1–4 players per slot',
    sub: 'Bring your full group',
  },
]

export default function PricingClient({ tiers }: { tiers: Tier[] }) {
  const [isAnnual, setIsAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  function getPrice(tier: Tier) {
    const monthly = tier.monthlyPriceCents / 100
    if (isAnnual) return Math.round(monthly * 0.85)
    return monthly
  }

  return (
    <>
      {/* Page header */}
      <div className="pr-page-header">
        <div className="pr-eyebrow">Membership Plans</div>
        <h1 className="pr-title">Choose how<br />often you play.</h1>
        <p className="pr-sub">Pick a plan, get your monthly credits, and book any course in the network. No booking fees. No green fees. Cancel anytime.</p>
      </div>

      {/* Billing toggle */}
      <div className="pr-billing-toggle">
        <span className={`pr-billing-label${!isAnnual ? ' active' : ''}`}>Monthly</span>
        <div
          className={`pr-toggle-track${isAnnual ? ' on' : ''}`}
          onClick={() => setIsAnnual(v => !v)}
        >
          <div className="pr-toggle-thumb" />
        </div>
        <span className={`pr-billing-label${isAnnual ? ' active' : ''}`}>Annual</span>
        <span className="pr-save-badge">Save 15%</span>
      </div>

      {/* Plans grid */}
      <div className="pr-plans-wrap">
        <div className="pr-plans-grid">
          {tiers.map(tier => {
            const isFeatured = tier.id === 'core'
            const price = getPrice(tier)
            const features = PLAN_FEATURES[tier.id] ?? []
            const math = CREDIT_MATH[tier.id]

            return (
              <div key={tier.id} className={`pr-plan-card${isFeatured ? ' featured' : ''}`}>
                {isFeatured && <div className="pr-featured-tag">Most Popular</div>}
                <div className="pr-plan-head">
                  <div className="pr-plan-name">{tier.name}</div>
                  <div className="pr-plan-price">
                    <span className="pr-plan-sup">$</span>
                    <span className="pr-plan-amount">{price}</span>
                    <span className="pr-plan-per">/mo</span>
                  </div>
                  <div className="pr-plan-billing-note">
                    {isAnnual ? 'Billed annually (save 15%)' : 'Billed monthly'}
                  </div>
                </div>
                <div className={`pr-plan-credits${isFeatured ? ' featured' : ''}`}>
                  <div>
                    <div className="pr-credits-num">{tier.monthlyCredits}</div>
                    <div className="pr-credits-label">credits per month</div>
                  </div>
                  {math && (
                    <div className="pr-credits-math">
                      <div className="pr-credits-rate">{math.rate}</div>
                      <div className="pr-credits-rate-sub">{math.sub}</div>
                    </div>
                  )}
                </div>
                <div className="pr-plan-features">
                  {features.map((f, i) => (
                    <div key={i} className="pr-plan-feature">
                      {CHECK_ICON}
                      {f}
                    </div>
                  ))}
                </div>
                <div className="pr-plan-cta">
                  <Link
                    href={`/signup?plan=${tier.id}`}
                    className={`pr-plan-btn${isFeatured ? ' featured' : ''}`}
                  >
                    Start with {tier.name}
                  </Link>
                  <div className="pr-plan-btn-sub">Cancel anytime. No commitment.</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All plans include */}
      <div className="pr-included-header">
        <div className="pr-included-title">Everything included in every plan</div>
      </div>
      <div className="pr-all-plans">
        <div className="pr-all-inner">
          <div className="pr-all-grid">
            {ALL_INCLUDES.map((item, i) => (
              <div key={i} className="pr-all-item">
                <div className="pr-all-icon">{item.icon}</div>
                <div>
                  <div className="pr-all-label">{item.label}</div>
                  <div className="pr-all-sub">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="pr-faq">
        <div className="pr-faq-title">Common Questions</div>
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`pr-faq-item${openFaq === i ? ' open' : ''}`}
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <div className="pr-faq-question">
              {item.q}
              <svg
                className="pr-faq-chevron"
                width="16" height="16" viewBox="0 0 20 20"
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="5 8 10 13 15 8"/>
              </svg>
            </div>
            <div className="pr-faq-answer">{item.a}</div>
          </div>
        ))}
      </div>

      {/* Course strip */}
      <div className="pr-course-strip">
        <div className="pr-course-strip-inner">
          <div>
            <div className="pr-cs-eyebrow">Before You Commit</div>
            <div className="pr-cs-title">Browse the full course network.</div>
            <div className="pr-cs-sub">12 member courses across Southern California. No signup required to browse.</div>
          </div>
          <Link href="/courses" className="pr-cs-btn">
            View All Courses →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="pr-footer">
        <Link href="/" className="pr-footer-wm">gimmelab</Link>
        <div className="pr-footer-links">
          <Link href="/">Home</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/login">Log In</Link>
        </div>
        <span className="pr-footer-copy">© 2026 Gimmelab</span>
      </footer>

      <style>{`
        .pr-page-header { text-align: center; padding: 60px 40px 48px; max-width: 600px; margin: 0 auto; }
        .pr-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #BF7B2E; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .pr-title { font-size: 44px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 14px; font-family: 'Inter', sans-serif; }
        .pr-sub { font-size: 15px; color: #847C72; line-height: 1.65; font-family: 'Inter', sans-serif; }

        .pr-billing-toggle { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 48px; }
        .pr-billing-label { font-size: 13px; font-weight: 600; color: #847C72; font-family: 'Inter', sans-serif; cursor: pointer; }
        .pr-billing-label.active { color: #0C0C0B; }
        .pr-toggle-track { width: 44px; height: 24px; background: #E5DDD3; border-radius: 12px; cursor: pointer; position: relative; transition: background 0.2s; border: 1px solid rgba(12,12,11,0.16); }
        .pr-toggle-track.on { background: #BF7B2E; border-color: #BF7B2E; }
        .pr-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #FFFFFF; border-radius: 50%; transition: transform 0.2s; }
        .pr-toggle-track.on .pr-toggle-thumb { transform: translateX(20px); }
        .pr-save-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.2); border-radius: 2px; padding: 3px 9px; color: #BF7B2E; font-family: 'Inter', sans-serif; }

        .pr-plans-wrap { max-width: 1000px; margin: 0 auto; padding: 0 40px 60px; }
        .pr-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }

        .pr-plan-card { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.16); display: flex; flex-direction: column; position: relative; transition: box-shadow 0.2s; }
        .pr-plan-card:hover { box-shadow: 0 8px 32px rgba(12,12,11,0.08); }
        .pr-plan-card.featured { border-color: #BF7B2E; border-width: 2px; z-index: 2; }

        .pr-featured-tag { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #BF7B2E; color: #0C0C0B; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; padding: 5px 16px; text-transform: uppercase; white-space: nowrap; font-family: 'Inter', sans-serif; }

        .pr-plan-head { padding: 32px 28px 24px; border-bottom: 1px solid rgba(12,12,11,0.09); }
        .pr-plan-name { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: #847C72; text-transform: uppercase; margin-bottom: 20px; font-family: 'Inter', sans-serif; }
        .pr-plan-card.featured .pr-plan-name { color: #BF7B2E; }
        .pr-plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 4px; }
        .pr-plan-amount { font-size: 52px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.04em; line-height: 1; font-family: 'Inter', sans-serif; }
        .pr-plan-sup { font-size: 20px; font-weight: 600; color: #847C72; align-self: flex-start; margin-top: 8px; font-family: 'Inter', sans-serif; }
        .pr-plan-per { font-size: 13px; color: #847C72; margin-left: 2px; font-family: 'Inter', sans-serif; }
        .pr-plan-billing-note { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }

        .pr-plan-credits { padding: 20px 28px; border-bottom: 1px solid rgba(12,12,11,0.09); background: #FDFAF6; display: flex; align-items: center; justify-content: space-between; }
        .pr-plan-credits.featured { background: rgba(191,123,46,0.10); }
        .pr-credits-num { font-size: 32px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.03em; line-height: 1; font-family: 'Inter', sans-serif; }
        .pr-credits-label { font-size: 11px; color: #847C72; margin-top: 2px; font-family: 'Inter', sans-serif; }
        .pr-credits-math { text-align: right; }
        .pr-credits-rate { font-size: 13px; font-weight: 600; color: #0C0C0B; font-family: 'Inter', sans-serif; }
        .pr-credits-rate-sub { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }

        .pr-plan-features { padding: 24px 28px; flex: 1; }
        .pr-plan-feature { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 13px; color: #1E1D1B; line-height: 1.4; font-family: 'Inter', sans-serif; }
        .pr-plan-feature svg { flex-shrink: 0; margin-top: 1px; color: #BF7B2E; }
        .pr-plan-feature:last-child { margin-bottom: 0; }

        .pr-plan-cta { padding: 20px 28px 28px; }
        .pr-plan-btn { display: block; width: 100%; background: #0C0C0B; color: #F4EEE3; border: none; border-radius: 2px; padding: 15px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; text-align: center; transition: background 0.15s; }
        .pr-plan-btn:hover { background: #1E1D1B; }
        .pr-plan-btn.featured { background: #BF7B2E; color: #0C0C0B; }
        .pr-plan-btn.featured:hover { background: #d48c37; }
        .pr-plan-btn-sub { text-align: center; font-size: 11px; color: #847C72; margin-top: 10px; font-family: 'Inter', sans-serif; }

        .pr-included-header { text-align: center; padding: 0 40px 20px; }
        .pr-included-title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #847C72; font-family: 'Inter', sans-serif; }

        .pr-all-plans { max-width: 1000px; margin: 0 auto; padding: 0 40px 56px; }
        .pr-all-inner { background: #FFFFFF; border: 1px solid rgba(12,12,11,0.09); padding: 32px 40px; }
        .pr-all-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .pr-all-item { display: flex; align-items: flex-start; gap: 10px; }
        .pr-all-icon { width: 32px; height: 32px; background: rgba(191,123,46,0.10); border: 1px solid rgba(191,123,46,0.15); border-radius: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #BF7B2E; }
        .pr-all-label { font-size: 13px; font-weight: 600; color: #0C0C0B; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .pr-all-sub { font-size: 11px; color: #847C72; line-height: 1.4; font-family: 'Inter', sans-serif; }

        .pr-faq { max-width: 700px; margin: 0 auto; padding: 0 40px 60px; }
        .pr-faq-title { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #847C72; margin-bottom: 20px; text-align: center; font-family: 'Inter', sans-serif; }
        .pr-faq-item { border-bottom: 1px solid rgba(12,12,11,0.09); padding: 18px 0; cursor: pointer; }
        .pr-faq-item:first-of-type { border-top: 1px solid rgba(12,12,11,0.09); }
        .pr-faq-question { display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 14px; font-weight: 600; color: #0C0C0B; font-family: 'Inter', sans-serif; }
        .pr-faq-chevron { flex-shrink: 0; transition: transform 0.2s; color: #847C72; }
        .pr-faq-item.open .pr-faq-chevron { transform: rotate(180deg); }
        .pr-faq-answer { font-size: 13px; color: #847C72; line-height: 1.7; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding-top 0.2s; font-family: 'Inter', sans-serif; }
        .pr-faq-item.open .pr-faq-answer { max-height: 200px; padding-top: 12px; }

        .pr-course-strip { background: #0C0C0B; padding: 40px 0; }
        .pr-course-strip-inner { max-width: 1000px; margin: 0 auto; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
        .pr-cs-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #BF7B2E; text-transform: uppercase; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .pr-cs-title { font-size: 24px; font-weight: 700; color: #F4EEE3; letter-spacing: -0.03em; margin-bottom: 6px; font-family: 'Inter', sans-serif; }
        .pr-cs-sub { font-size: 13px; color: #847C72; font-family: 'Inter', sans-serif; }
        .pr-cs-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(244,238,227,0.2); border-radius: 2px; padding: 12px 22px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: #F4EEE3; text-transform: uppercase; text-decoration: none; transition: all 0.15s; flex-shrink: 0; white-space: nowrap; }
        .pr-cs-btn:hover { border-color: #BF7B2E; color: #BF7B2E; }

        .pr-footer { background: #0C0C0B; border-top: 1px solid rgba(244,238,227,0.08); padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .pr-footer-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 20px; color: #F4EEE3; letter-spacing: -0.02em; text-decoration: none; }
        .pr-footer-links { display: flex; gap: 24px; }
        .pr-footer-links a { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .pr-footer-links a:hover { color: #F4EEE3; }
        .pr-footer-copy { font-size: 11px; color: #847C72; font-family: 'Inter', sans-serif; }

        @media (max-width: 800px) {
          .pr-plans-grid { grid-template-columns: 1fr; gap: 16px; }
          .pr-all-grid { grid-template-columns: 1fr 1fr; }
          .pr-page-header { padding: 40px 20px 36px; }
          .pr-plans-wrap, .pr-all-plans, .pr-faq { padding-left: 20px; padding-right: 20px; }
          .pr-course-strip-inner { flex-direction: column; align-items: flex-start; }
          .pr-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; gap: 16px; }
        }
        @media (max-width: 500px) { .pr-all-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}
