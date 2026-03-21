import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCreditBalance, getLedgerHistory } from '@/lib/credits/ledger'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const metadata = { title: 'Credits — gimilab' }

const TIER_CONFIG: Record<string, { name: string; price: number; credits: number }> = {
  casual: { name: 'Casual', price: 99, credits: 100 },
  core:   { name: 'Core',   price: 149, credits: 150 },
  heavy:  { name: 'Heavy',  price: 199, credits: 210 },
}
const TIER_ORDER = ['casual', 'core', 'heavy'] as const

function getCreditRenewDate(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getLedgerLabel(type: string, notes: string | null): { title: string; sub: string } {
  switch (type) {
    case 'SUBSCRIPTION_GRANT': return { title: 'Credits renewed', sub: 'Monthly renewal' }
    case 'BOOKING_DEBIT':      return { title: 'Tee time booking', sub: notes ?? 'Credit debit' }
    case 'BOOKING_REFUND':     return { title: 'Booking cancelled', sub: 'Credit refund' }
    case 'TOP_UP_PURCHASE':    return { title: 'Top-up purchase', sub: 'Credit top-up' }
    case 'ADMIN_ADJUSTMENT':   return { title: 'Admin adjustment', sub: notes ?? '' }
    case 'BONUS_GRANT':        return { title: 'Bonus credits', sub: notes ?? '' }
    case 'CREDIT_EXPIRY':      return { title: 'Credits expired', sub: 'Expiry event' }
    default:                    return { title: 'Credit event', sub: type }
  }
}

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [balance, dbUser, ledger] = await Promise.all([
    getCreditBalance(user.id),
    db.select().from(users).where(eq(users.id, user.id)).then(r => r[0] ?? null),
    getLedgerHistory(user.id, 20),
  ])

  const tier = dbUser?.subscriptionTier ?? null
  const tierConfig = tier ? TIER_CONFIG[tier] : null
  const totalCredits = tierConfig?.credits ?? 0
  const usedCredits = Math.max(0, totalCredits - balance)
  const usedPct = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0
  const renewDate = getCreditRenewDate()

  return (
    <>
      <header className="pg-topbar">
        <span className="pg-topbar-title">Credits</span>
      </header>

      <div className="pg-content">

        {/* ── Available Balance ── */}
        <span className="sec-label">Available Balance</span>
        <div className="balance-hero">
          <div>
            <div className="bal-label">Credits Available</div>
            <div className="bal-number">{balance}</div>
            <div className="bal-sub">
              of <strong>{totalCredits} credits</strong> remaining this cycle
            </div>
          </div>
          <div className="bal-track-wrap">
            <div className="bal-track-labels">
              <span>Used: {usedCredits}</span>
              <span>Total: {totalCredits}</span>
            </div>
            <div className="bal-track">
              <div className="bal-fill" style={{ width: `${100 - usedPct}%` }} />
            </div>
            <div className="bal-renew">Renews <strong>{renewDate}</strong></div>
          </div>
        </div>

        {/* ── Your Plan ── */}
        {tierConfig && (
          <>
            <span className="sec-label">Your Plan</span>
            <div className="plan-row">
              <div>
                <div className="plan-name">
                  {tierConfig.name} — ${tierConfig.price} / month
                </div>
                <div className="plan-detail">
                  {tierConfig.credits} credits per cycle · Renews {renewDate}
                </div>
              </div>
              <div className="plan-actions">
                <Link href="/pricing" className="btn btn-ghost">Change Plan</Link>
                <button className="btn btn-primary">Buy More Credits</button>
              </div>
            </div>
          </>
        )}

        {/* ── All Plans ── */}
        <span className="sec-label">All Plans</span>
        <div className="tier-grid">
          {TIER_ORDER.map((id) => {
            const t = TIER_CONFIG[id]
            const isCurrent = tier === id
            const isLower = TIER_ORDER.indexOf(id) < TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number])
            const btnLabel = !tier || !isCurrent
              ? isLower ? 'Downgrade' : 'Upgrade'
              : 'Current Plan'
            return (
              <div key={id} className={`tier-card${isCurrent ? ' current' : ''}`}>
                {isCurrent && <span className="current-tag">Current</span>}
                <div className="tier-name">{t.name}</div>
                <div className="tier-price"><sup>$</sup>{t.price}</div>
                <div className="tier-price-sub">per month</div>
                <div className="tier-credits">{t.credits}</div>
                <div className="tier-credits-label">credits / month</div>
                <button className="tier-select-btn" disabled={isCurrent}>
                  {btnLabel}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Credit History ── */}
        <span className="sec-label">Credit History</span>
        {ledger.length === 0 ? (
          <div className="history-empty">No credit history yet — your activity will appear here once your subscription activates.</div>
        ) : (
          ledger.map((entry) => {
            const isCredit = entry.amount > 0
            const { title, sub } = getLedgerLabel(entry.type, entry.notes)
            const dateLabel = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return (
              <div key={entry.id} className="history-row">
                <div className={`history-dot ${isCredit ? 'cr' : 'db'}`} />
                <div className="history-main">
                  <div className="history-title">{title}</div>
                  <div className="history-sub">{sub}</div>
                </div>
                <div className={`history-amount ${isCredit ? 'cr' : 'db'}`}>
                  {isCredit ? '+' : ''}{entry.amount}
                </div>
                <div className="history-date">{dateLabel}</div>
              </div>
            )
          })
        )}

      </div>

      <style>{`
        .pg-topbar {
          display: flex; align-items: center;
          padding: 18px 36px;
          border-bottom: 1px solid rgba(12,12,11,0.09);
          background: #fff;
          position: sticky; top: 0; z-index: 50;
          font-family: 'Inter', sans-serif;
        }
        .pg-topbar-title { font-size: 17px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; }
        .pg-content {
          flex: 1; padding: 24px 36px 48px;
          max-width: 820px;
          font-family: 'Inter', sans-serif;
        }
        .sec-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72;
          margin-bottom: 10px; margin-top: 24px;
          display: block;
        }
        .sec-label:first-child { margin-top: 0; }

        /* Balance hero */
        .balance-hero {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          border-left: 3px solid #BF7B2E;
          padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          margin-bottom: 4px;
        }
        .bal-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; margin-bottom: 8px; }
        .bal-number { font-size: 72px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.05em; line-height: 1; }
        .bal-sub { font-size: 13px; color: #847C72; }
        .bal-sub strong { color: #0C0C0B; font-weight: 600; }
        .bal-track-wrap { flex: 1; max-width: 260px; }
        .bal-track-labels { display: flex; justify-content: space-between; font-size: 11px; color: #847C72; margin-bottom: 8px; }
        .bal-track { height: 3px; background: rgba(12,12,11,0.15); }
        .bal-fill { height: 100%; background: #BF7B2E; }
        .bal-renew { font-size: 11px; color: #847C72; text-align: right; margin-top: 8px; }
        .bal-renew strong { color: #0C0C0B; }

        /* Plan row */
        .plan-row {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .plan-name { font-size: 15px; font-weight: 700; color: #0C0C0B; margin-bottom: 3px; }
        .plan-detail { font-size: 12px; color: #847C72; }
        .plan-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .btn {
          border-radius: 2px; padding: 9px 16px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s; text-decoration: none; display: inline-block;
        }
        .btn-ghost {
          background: transparent; color: #847C72;
          border: 1px solid rgba(12,12,11,0.15);
        }
        .btn-ghost:hover { border-color: #0C0C0B; color: #0C0C0B; }
        .btn-primary { background: #BF7B2E; color: #0C0C0B; border: none; }
        .btn-primary:hover { background: #d48c37; }

        /* Tier grid */
        .tier-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .tier-card {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 20px 22px; position: relative;
        }
        .tier-card.current { border-top: 2px solid #BF7B2E; }
        .current-tag {
          position: absolute; top: 10px; right: 10px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
          color: #BF7B2E; background: rgba(191,123,46,0.10);
          border: 1px solid rgba(191,123,46,0.2); border-radius: 2px;
          padding: 2px 7px; text-transform: uppercase;
        }
        .tier-name {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #847C72; margin-bottom: 10px;
        }
        .tier-card.current .tier-name { color: #BF7B2E; }
        .tier-price { font-size: 28px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.03em; line-height: 1; margin-bottom: 2px; }
        .tier-price sup { font-size: 14px; vertical-align: super; }
        .tier-price-sub { font-size: 11px; color: #847C72; margin-bottom: 14px; }
        .tier-credits { font-size: 24px; font-weight: 700; color: #BF7B2E; letter-spacing: -0.02em; margin-bottom: 2px; }
        .tier-credits-label { font-size: 11px; color: #847C72; margin-bottom: 14px; }
        .tier-select-btn {
          width: 100%; background: transparent;
          border: 1px solid rgba(12,12,11,0.15); border-radius: 2px; padding: 9px 0;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; color: #847C72; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s;
        }
        .tier-select-btn:hover:not(:disabled) { border-color: #BF7B2E; color: #BF7B2E; background: rgba(191,123,46,0.10); }
        .tier-card.current .tier-select-btn {
          background: rgba(191,123,46,0.10); border-color: rgba(191,123,46,0.25);
          color: #BF7B2E; cursor: default;
        }

        /* History */
        .history-row {
          display: flex; align-items: center; gap: 14px;
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 14px 18px; margin-bottom: 4px;
        }
        .history-row:last-child { margin-bottom: 0; }
        .history-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .history-dot.cr { background: #BF7B2E; }
        .history-dot.db { background: #847C72; opacity: 0.4; }
        .history-main { flex: 1; }
        .history-title { font-size: 13px; font-weight: 600; color: #0C0C0B; margin-bottom: 1px; }
        .history-sub { font-size: 11px; color: #847C72; }
        .history-amount { font-size: 13px; font-weight: 700; }
        .history-amount.cr { color: #BF7B2E; }
        .history-amount.db { color: #847C72; }
        .history-date { font-size: 11px; color: #847C72; width: 56px; text-align: right; flex-shrink: 0; }
        .history-empty {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          padding: 20px 18px; font-size: 13px; color: #847C72;
        }

        @media (max-width: 860px) {
          .pg-content { padding: 20px 24px 40px; }
          .tier-grid { grid-template-columns: 1fr; }
          .balance-hero { flex-direction: column; align-items: flex-start; }
          .bal-track-wrap { max-width: 100%; width: 100%; }
        }
        @media (max-width: 640px) {
          .plan-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  )
}
