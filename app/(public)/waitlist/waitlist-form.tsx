'use client'

import { useActionState, useState } from 'react'
import { joinWaitlist, completeWaitlistProfile } from '@/actions/waitlist'

const ROUNDS_OPTIONS = [
  { value: '1-2', label: '1–2 rounds', desc: 'Casual weekender' },
  { value: '3-4', label: '3–4 rounds', desc: 'Regular player' },
  { value: '5+', label: '5+ rounds', desc: 'Committed golfer' },
]

export default function WaitlistForm({ referral }: { referral?: string }) {
  const [step, setStep] = useState<'email' | 'profile' | 'done'>('email')
  const [referralCode, setReferralCode] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedRounds, setSelectedRounds] = useState('')

  const [joinState, joinAction, joinPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await joinWaitlist(null, formData)
      if (result.success && result.referralCode) {
        setReferralCode(result.referralCode)
        setEmail(formData.get('email')?.toString() || '')
        setStep('profile')
      }
      return result
    },
    null,
  )

  const [, profileAction, profilePending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await completeWaitlistProfile(null, formData)
      if (result.success) setStep('done')
      return result
    },
    null,
  )

  const copyCode = () => {
    const url = `${window.location.origin}/waitlist?ref=${referralCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {step === 'email' && (
        <form action={joinAction} className="wl-form">
          <input type="hidden" name="ref" value={referral || ''} />
          <input
            name="name"
            type="text"
            placeholder="Full name"
            required
            autoComplete="name"
            className="wl-input"
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            required
            autoComplete="email"
            className="wl-input"
          />
          <button type="submit" disabled={joinPending} className="wl-btn">
            {joinPending ? 'Joining…' : 'Join the Waitlist'}
          </button>
          {joinState?.error && <p className="wl-error">{joinState.error}</p>}
          <p className="wl-fine">No spam. No credit card. Unsubscribe anytime.</p>
        </form>
      )}

      {step === 'profile' && (
        <form action={profileAction} className="wl-form">
          <input type="hidden" name="email" value={email} />
          <div className="wl-step-label">One more thing — helps us prioritize your access.</div>

          <div className="wl-q-label">How often do you play?</div>
          <div className="wl-options">
            {ROUNDS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`wl-option ${selectedRounds === opt.value ? 'wl-option-active' : ''}`}
              >
                <input
                  type="radio"
                  name="roundsPerMonth"
                  value={opt.value}
                  onChange={() => setSelectedRounds(opt.value)}
                  className="wl-radio-hidden"
                />
                <span className="wl-option-label">{opt.label}</span>
                <span className="wl-option-desc">{opt.desc}</span>
              </label>
            ))}
          </div>

          <div className="wl-q-label">Where do you play most?</div>
          <input
            name="city"
            type="text"
            placeholder="City or region"
            autoComplete="address-level2"
            className="wl-input"
          />

          <button type="submit" disabled={profilePending} className="wl-btn">
            {profilePending ? 'Saving…' : 'Complete'}
          </button>
          <button type="button" onClick={() => setStep('done')} className="wl-skip">
            Skip for now
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="wl-done">
          <div className="wl-check">✓</div>
          <div className="wl-done-title">You're in.</div>
          <p className="wl-done-sub">We'll email you when it's your turn. Share your link to move up the list.</p>

          <div className="wl-ref-box">
            <span className="wl-ref-code">{referralCode}</span>
            <button onClick={copyCode} className="wl-copy-btn">
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .wl-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .wl-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(244,238,227,0.06);
          border: 1px solid rgba(244,238,227,0.12);
          border-radius: 2px;
          color: #F4EEE3;
          font-size: 14px;
          font-family: var(--font-inter), 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .wl-input:focus {
          border-color: #BF7B2E;
        }
        .wl-input::placeholder {
          color: rgba(244,238,227,0.3);
        }
        .wl-btn {
          width: 100%;
          padding: 14px;
          background: #BF7B2E;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          font-family: var(--font-inter), 'Inter', sans-serif;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .wl-btn:hover { background: #a86b28; }
        .wl-btn:disabled { opacity: 0.6; cursor: wait; }
        .wl-error {
          font-size: 13px;
          color: #ef4444;
          margin: 0;
          text-align: center;
        }
        .wl-fine {
          font-size: 12px;
          color: rgba(244,238,227,0.25);
          text-align: center;
          margin: 4px 0 0;
        }

        /* Step 2: Profile */
        .wl-step-label {
          font-size: 14px;
          color: rgba(244,238,227,0.5);
          text-align: center;
          margin-bottom: 8px;
        }
        .wl-q-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(244,238,227,0.35);
          margin: 8px 0 8px;
        }
        .wl-options {
          display: flex;
          gap: 8px;
        }
        .wl-option {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 8px;
          background: rgba(244,238,227,0.04);
          border: 1px solid rgba(244,238,227,0.10);
          border-radius: 2px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-align: center;
        }
        .wl-option:hover { border-color: rgba(244,238,227,0.2); }
        .wl-option-active {
          border-color: #BF7B2E !important;
          background: rgba(191,123,46,0.08);
        }
        .wl-radio-hidden { position: absolute; opacity: 0; pointer-events: none; }
        .wl-option-label {
          font-size: 14px;
          font-weight: 700;
          color: #F4EEE3;
        }
        .wl-option-desc {
          font-size: 11px;
          color: rgba(244,238,227,0.35);
        }
        .wl-skip {
          background: none;
          border: none;
          color: rgba(244,238,227,0.3);
          font-size: 13px;
          font-family: var(--font-inter), 'Inter', sans-serif;
          cursor: pointer;
          padding: 8px;
          transition: color 0.2s;
        }
        .wl-skip:hover { color: rgba(244,238,227,0.5); }

        /* Step 3: Done */
        .wl-done {
          text-align: center;
        }
        .wl-check {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(191,123,46,0.12);
          color: #BF7B2E;
          font-size: 24px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .wl-done-title {
          font-size: 28px;
          font-weight: 800;
          color: #F4EEE3;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .wl-done-sub {
          font-size: 14px;
          color: rgba(244,238,227,0.45);
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .wl-ref-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(244,238,227,0.06);
          border: 1px solid rgba(244,238,227,0.12);
          border-radius: 2px;
          padding: 12px 16px;
        }
        .wl-ref-code {
          flex: 1;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #F4EEE3;
        }
        .wl-copy-btn {
          padding: 8px 16px;
          background: #BF7B2E;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-inter), 'Inter', sans-serif;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .wl-copy-btn:hover { background: #a86b28; }

        @media (max-width: 480px) {
          .wl-options { flex-direction: column; }
        }
      `}</style>
    </>
  )
}
