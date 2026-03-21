'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateFullName, sendPasswordReset, openStripePortal } from '@/actions/account'

interface Props {
  fullName: string
  email: string
  tier: string | null
  memberSince: string | null
  renewLabel: string
  tierName: string
  tierPrice: number
  tierCredits: number
}

const TIER_CONFIG: Record<string, { name: string; price: number; credits: number }> = {
  casual: { name: 'Casual', price: 99,  credits: 100 },
  core:   { name: 'Core',   price: 149, credits: 150 },
  heavy:  { name: 'Heavy',  price: 199, credits: 210 },
}

export function AccountClient({
  fullName: initialName,
  email,
  tier,
  memberSince,
  renewLabel,
  tierName,
  tierPrice,
  tierCredits,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(initialName)
  const [displayName, setDisplayName] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tierKey = tier ?? 'core'
  const cfg = TIER_CONFIG[tierKey] ?? TIER_CONFIG.core

  const handleSaveName = () => {
    setNameError(null)
    const fd = new FormData()
    fd.set('fullName', nameVal)
    startTransition(async () => {
      const res = await updateFullName(fd)
      if (res?.error) {
        setNameError(res.error)
      } else {
        setDisplayName(nameVal)
        setEditing(false)
      }
    })
  }

  const handlePasswordReset = () => {
    startTransition(async () => {
      const res = await sendPasswordReset()
      if (res?.error) {
        setPwMsg(res.error)
      } else {
        setPwMsg('Password reset email sent.')
      }
      setTimeout(() => setPwMsg(null), 4000)
    })
  }

  const handleStripePortal = () => {
    startTransition(async () => {
      await openStripePortal()
    })
  }

  return (
    <>
      <header className="pg-topbar">
        <span className="pg-topbar-title">My Account</span>
      </header>

      <div className="pg-content">

        {/* ── Profile ── */}
        <span className="sec-label">Profile</span>
        <div className="section-card">
          <div className="section-head">
            <span className="section-head-title">Personal Information</span>
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="edit-btn" onClick={() => { setEditing(false); setNameVal(displayName); setNameError(null) }} disabled={isPending}>
                  Cancel
                </button>
                <button className="edit-btn save" onClick={handleSaveName} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>

          <div className="field-row">
            <span className="field-label">Name</span>
            {editing ? (
              <input
                className="field-input"
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                autoFocus
              />
            ) : (
              <span className="field-value">{displayName}</span>
            )}
            {nameError && <span style={{ fontSize: 11, color: '#b84444', flexShrink: 0 }}>{nameError}</span>}
          </div>

          <div className="field-row">
            <span className="field-label">Email</span>
            <span className="field-value">{email}</span>
          </div>

          <div className="field-row">
            <span className="field-label">Password</span>
            <span className="field-value muted">••••••••••</span>
            <button className="field-change-btn" onClick={handlePasswordReset} disabled={isPending}>
              {pwMsg ?? 'Change →'}
            </button>
          </div>

          <div className="field-row">
            <span className="field-label">Member Since</span>
            <span className="field-value">{memberSince ?? '—'}</span>
          </div>
        </div>

        {/* ── Membership ── */}
        <span className="sec-label">Membership</span>
        <div className="section-card">
          <div className="membership-inner">
            <div>
              <div className="mc-tier">{cfg.name} — ${cfg.price} / month</div>
              <div className="mc-detail">
                {cfg.credits} credits per cycle · Renews {renewLabel}
                {memberSince && <><br />Member since {memberSince}</>}
              </div>
            </div>
            <div className="mc-actions">
              <Link href="/credits" className="btn btn-ghost">Manage Plan</Link>
              {tierKey !== 'heavy' && (
                <Link href="/credits" className="btn btn-primary">Upgrade</Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Billing ── */}
        <span className="sec-label">Billing</span>
        <div className="section-card">
          <div className="section-head">
            <span className="section-head-title">Payment Method</span>
            <button className="edit-btn" onClick={handleStripePortal} disabled={isPending}>
              Manage
            </button>
          </div>
          <div className="payment-row">
            <div className="card-icon">
              <svg width="22" height="14" viewBox="0 0 32 22" fill="none">
                <rect x="0.5" y="0.5" width="31" height="21" rx="2.5" fill="#f8f5f0" stroke="rgba(12,12,11,0.1)" />
                <rect x="0" y="7" width="32" height="5" fill="rgba(12,12,11,0.04)" />
                <circle cx="11" cy="11" r="5.5" fill="#d4802a" opacity="0.7" />
                <circle cx="18" cy="11" r="5.5" fill="#e09030" opacity="0.6" />
              </svg>
            </div>
            <div className="card-info">
              <div className="card-name">Managed via Stripe</div>
              <div className="card-exp">Click Manage to update payment details</div>
            </div>
            <button className="field-change-btn" onClick={handleStripePortal} disabled={isPending}>
              Open →
            </button>
          </div>
        </div>

        {/* ── Billing History ── */}
        <span className="sec-label">Billing History</span>
        <div className="section-card">
          <div className="billing-empty">
            <span>Billing history is available in the Stripe portal.</span>
            <button className="edit-btn save" onClick={handleStripePortal} disabled={isPending}>
              View History →
            </button>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <span className="sec-label">Danger Zone</span>
        <div className="danger-row">
          <div>
            <div className="danger-title">Cancel Membership</div>
            <div className="danger-sub">Access and credits remain active through the end of the billing period.</div>
          </div>
          <button className="danger-btn" onClick={handleStripePortal} disabled={isPending}>
            Cancel Membership
          </button>
        </div>

      </div>

      <style>{`
        .pg-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 36px;
          border-bottom: 1px solid rgba(12,12,11,0.09);
          background: #fff;
          position: sticky; top: 0; z-index: 50;
          font-family: 'Inter', sans-serif;
        }
        .pg-topbar-title { font-size: 17px; font-weight: 700; color: #0C0C0B; letter-spacing: -0.02em; }

        .pg-content {
          flex: 1; padding: 24px 36px 60px;
          max-width: 680px; font-family: 'Inter', sans-serif;
        }

        .sec-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #847C72;
          margin-bottom: 10px; margin-top: 28px; display: block;
        }
        .sec-label:first-child { margin-top: 0; }

        .section-card {
          background: #fff; border: 1px solid rgba(12,12,11,0.09);
          overflow: hidden; margin-bottom: 4px;
        }
        .section-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid rgba(12,12,11,0.09);
          background: #FDFAF6;
        }
        .section-head-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          color: #847C72; text-transform: uppercase;
        }
        .edit-btn {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          color: #847C72; background: none; border: none; cursor: pointer;
          text-transform: uppercase; font-family: 'Inter', sans-serif;
          transition: color 0.15s; padding: 0;
        }
        .edit-btn:hover { color: #BF7B2E; }
        .edit-btn.save { color: #BF7B2E; }
        .edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .field-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid rgba(12,12,11,0.09); gap: 12px;
        }
        .field-row:last-child { border-bottom: none; }
        .field-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          color: #847C72; text-transform: uppercase; width: 110px; flex-shrink: 0;
        }
        .field-value { font-size: 13px; color: #0C0C0B; flex: 1; }
        .field-value.muted { color: #847C72; }
        .field-input {
          font-size: 13px; color: #0C0C0B; flex: 1;
          border: 1px solid rgba(12,12,11,0.2); border-radius: 2px;
          padding: 6px 10px; font-family: 'Inter', sans-serif;
          background: #FDFAF6; outline: none;
        }
        .field-input:focus { border-color: #BF7B2E; }
        .field-change-btn {
          font-size: 11px; color: #847C72; background: none; border: none;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: color 0.15s; flex-shrink: 0; padding: 0;
        }
        .field-change-btn:hover { color: #BF7B2E; }
        .field-change-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .membership-inner {
          padding: 20px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .mc-tier { font-size: 15px; font-weight: 700; color: #0C0C0B; margin-bottom: 4px; }
        .mc-detail { font-size: 12px; color: #847C72; line-height: 1.6; }
        .mc-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

        .btn {
          border-radius: 2px; padding: 9px 16px; font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer; transition: all 0.15s;
          text-decoration: none; display: inline-block;
        }
        .btn-ghost {
          background: transparent; color: #847C72;
          border: 1px solid rgba(12,12,11,0.15);
        }
        .btn-ghost:hover { border-color: #0C0C0B; color: #0C0C0B; }
        .btn-primary { background: #BF7B2E; color: #0C0C0B; border: none; }
        .btn-primary:hover { background: #d48c37; }

        .payment-row {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 20px; border-bottom: 1px solid rgba(12,12,11,0.09);
        }
        .payment-row:last-child { border-bottom: none; }
        .card-icon {
          width: 38px; height: 26px; background: #FDFAF6;
          border: 1px solid rgba(12,12,11,0.09); border-radius: 2px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .card-info { flex: 1; }
        .card-name { font-size: 13px; font-weight: 600; color: #0C0C0B; margin-bottom: 2px; }
        .card-exp { font-size: 11px; color: #847C72; }

        .billing-empty {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; gap: 12px;
          font-size: 13px; color: #847C72;
        }

        .danger-row {
          background: rgba(180,60,60,0.08); border: 1px solid rgba(180,60,60,0.2);
          padding: 20px; display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
        }
        .danger-title { font-size: 13px; font-weight: 700; color: #b84444; margin-bottom: 3px; }
        .danger-sub { font-size: 12px; color: #847C72; }
        .danger-btn {
          background: transparent; border: 1px solid rgba(180,60,60,0.2);
          border-radius: 2px; padding: 9px 18px; font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          color: #b84444; text-transform: uppercase; cursor: pointer;
          transition: all 0.15s; flex-shrink: 0; white-space: nowrap;
        }
        .danger-btn:hover { background: rgba(180,60,60,0.08); border-color: rgba(180,60,60,0.4); }
        .danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 860px) {
          .pg-content { padding: 20px 24px 40px; }
          .pg-topbar { padding: 16px 24px; }
        }
        @media (max-width: 560px) {
          .membership-inner { flex-direction: column; align-items: flex-start; }
          .mc-actions { justify-content: flex-start; }
        }
      `}</style>
    </>
  )
}
