'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createPartnerAccount } from '@/actions/partner/create-partner'

export default function PartnerSignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; server?: string }>({})
  const [pending, startTransition] = useTransition()

  function validate() {
    const e: typeof errors = {}
    if (!fullName.trim()) e.fullName = 'Full name is required'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    const fd = new FormData()
    fd.append('fullName', fullName)
    fd.append('email', email)
    fd.append('password', password)
    startTransition(async () => {
      const result = await createPartnerAccount(null, fd)
      if (result && 'error' in result) setErrors({ server: result.error })
    })
  }

  const inputBase: React.CSSProperties = {
    background: '#1E1D1B',
    border: '1px solid rgba(229,221,211,0.2)',
    borderRadius: 2,
    color: '#F4EEE3',
    fontSize: 15,
    padding: '12px 14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0C0C0B',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        height: 58,
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        borderBottom: '1px solid rgba(229,221,211,0.08)',
      }}>
        <span style={{
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.03em',
          color: '#F4EEE3',
        }}>
          gimmelab
        </span>
      </nav>

      {/* Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          background: '#1E1D1B',
          border: '1px solid rgba(229,221,211,0.1)',
          borderRadius: 2,
          padding: 48,
          width: '100%',
          maxWidth: 440,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 12,
          }}>
            Partner Account
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#F4EEE3',
            letterSpacing: '-0.025em', marginBottom: 8,
          }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#847C72', marginBottom: 32, lineHeight: 1.5 }}>
            You'll use this to manage your course, view bookings, and receive payouts.
          </p>

          <div style={{ borderTop: '1px solid rgba(229,221,211,0.1)', marginBottom: 28 }} />

          {errors.server && (
            <div style={{
              background: 'rgba(191,123,46,0.12)',
              border: '1px solid rgba(191,123,46,0.3)',
              borderRadius: 2,
              padding: '12px 16px',
              fontSize: 13,
              color: '#BF7B2E',
              marginBottom: 20,
            }}>
              {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{
                  ...inputBase,
                  border: errors.fullName ? '1px solid rgba(200,60,60,0.6)' : inputBase.border,
                }}
              />
              {errors.fullName && <span style={{ fontSize: 12, color: '#BF7B2E' }}>{errors.fullName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  ...inputBase,
                  border: errors.email ? '1px solid rgba(200,60,60,0.6)' : inputBase.border,
                }}
              />
              {errors.email && <span style={{ fontSize: 12, color: '#BF7B2E' }}>{errors.email}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    ...inputBase,
                    paddingRight: 44,
                    border: errors.password ? '1px solid rgba(200,60,60,0.6)' : inputBase.border,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#847C72', fontSize: 16, padding: 0,
                  }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <span style={{ fontSize: 12, color: '#BF7B2E' }}>{errors.password}</span>}
            </div>

            <button
              type="submit"
              disabled={pending}
              style={{
                marginTop: 8,
                background: pending ? '#A8621E' : '#BF7B2E',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '14px 28px',
                border: 'none',
                borderRadius: 2,
                cursor: pending ? 'not-allowed' : 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
            >
              {pending ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Creating account…
                </>
              ) : 'Create Partner Account →'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(229,221,211,0.1)', marginTop: 28, paddingTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#847C72' }}>
              Already have a partner account?{' '}
              <Link href="/login" style={{ color: '#BF7B2E', textDecoration: 'none', fontWeight: 600 }}>
                Sign in →
              </Link>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
