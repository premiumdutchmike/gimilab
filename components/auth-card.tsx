'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/actions/auth'
import { createBrowserClient } from '@supabase/ssr'

type Tab = 'signin' | 'signup'

interface AuthCardProps {
  defaultTab?: Tab
  plan?: string
}

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password required'),
})

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

type SignInValues = z.infer<typeof signinSchema>
type SignUpValues = z.infer<typeof signupSchema>

export function AuthCard({ defaultTab = 'signin', plan }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [showPw, setShowPw] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const signinForm = useForm<SignInValues>({ resolver: zodResolver(signinSchema) })
  const signupForm = useForm<SignUpValues>({ resolver: zodResolver(signupSchema) })

  function handleSignIn(values: SignInValues) {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', values.email)
      fd.set('password', values.password)
      const result = await signInWithEmail(fd)
      if (result?.error) setError(result.error)
    })
  }

  function handleSignUp(values: SignUpValues) {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('email', values.email)
      fd.set('password', values.password)
      fd.set('fullName', `${values.firstName} ${values.lastName}`)
      fd.set('plan', plan ?? 'core')
      const result = await signUpWithEmail(fd)
      if (result?.error) setError(result.error)
    })
  }

  function handleGoogle() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle(plan ?? 'core')
      if (result?.error) setError(result.error)
    })
  }

  async function handleForgotPassword() {
    const email = signinForm.getValues('email')
    if (!email) {
      setError('Enter your email address first, then click Forgot password.')
      return
    }
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setError(null)
    alert('Password reset email sent — check your inbox.')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FDFAF6', fontFamily: 'Inter, sans-serif' }}>

      {/* Minimal nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(12,12,11,0.09)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-nunito), Nunito, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.02em', color: '#0C0C0B', textDecoration: 'none', lineHeight: 1 }}>
          gimmelab
        </Link>
        <a href="mailto:help@gimmelab.com" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: '#847C72', textDecoration: 'none', textTransform: 'uppercase' as const }}>
          Need help?
        </a>
      </nav>

      {/* Card wrapper */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(12,12,11,0.09)', width: '100%', maxWidth: 420, padding: '40px 40px 36px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(12,12,11,0.09)', marginBottom: 28 }}>
            {(['signin', 'signup'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null) }}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase' as const,
                  color: activeTab === tab ? '#0C0C0B' : '#847C72',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #BF7B2E' : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: -1,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Server / validation error */}
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 2, padding: '10px 14px', fontSize: 13, color: '#c53030', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* ── Sign In Panel ── */}
          {activeTab === 'signin' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0C0C0B', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back</div>
                <div style={{ fontSize: 13, color: '#847C72', lineHeight: 1.5 }}>Sign in to book tee times and manage your credits.</div>
              </div>

              <form onSubmit={signinForm.handleSubmit(handleSignIn)}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...signinForm.register('email')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                  />
                  {signinForm.formState.errors.email && (
                    <div style={fieldErrorStyle}>{signinForm.formState.errors.email.message}</div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...signinForm.register('password')}
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={pwToggleStyle}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {signinForm.formState.errors.password && (
                    <div style={fieldErrorStyle}>{signinForm.formState.errors.password.message}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ fontSize: 11, color: '#847C72', background: 'none', border: 'none', cursor: 'pointer', display: 'block', textAlign: 'right', width: '100%', marginTop: -8, marginBottom: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
                >
                  Forgot password?
                </button>

                <button type="submit" disabled={isPending} style={{ ...submitStyle, opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div style={dividerContainerStyle}>
                <div style={divLineStyle} />
                <span style={divTextStyle}>or</span>
                <div style={divLineStyle} />
              </div>

              <button type="button" onClick={handleGoogle} disabled={isPending} style={{ ...socialBtnStyle, opacity: isPending ? 0.7 : 1 }}>
                <GoogleIcon />
                Continue with Google
              </button>

              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#847C72' }}>
                New to Gimmelab?{' '}
                <button
                  onClick={() => { setActiveTab('signup'); setError(null) }}
                  style={{ color: '#BF7B2E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                >
                  Create an account
                </button>
              </div>
            </div>
          )}

          {/* ── Create Account Panel ── */}
          {activeTab === 'signup' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0C0C0B', letterSpacing: '-0.02em', marginBottom: 6 }}>Join Gimmelab</div>
                <div style={{ fontSize: 13, color: '#847C72', lineHeight: 1.5 }}>Book tee times at top courses with a single credit balance.</div>
              </div>

              {/* Tier teaser */}
              <div style={{ background: '#FDFAF6', border: '1px solid rgba(12,12,11,0.09)', padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, background: 'rgba(191,123,46,0.10)', border: '1px solid rgba(191,123,46,0.2)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#BF7B2E' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="10" cy="10" r="8" />
                    <path d="M10 6v4l2.5 2.5" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0C0C0B', marginBottom: 2 }}>Choose your plan after signup</div>
                  <div style={{ fontSize: 11, color: '#847C72', lineHeight: 1.4 }}>Casual $99 · Core $149 · Heavy $199 — credits never expire mid-month</div>
                </div>
              </div>

              <form onSubmit={signupForm.handleSubmit(handleSignUp)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input
                      type="text"
                      placeholder="First"
                      {...signupForm.register('firstName')}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                    />
                    {signupForm.formState.errors.firstName && (
                      <div style={fieldErrorStyle}>{signupForm.formState.errors.firstName.message}</div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Last name</label>
                    <input
                      type="text"
                      placeholder="Last"
                      {...signupForm.register('lastName')}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                    />
                    {signupForm.formState.errors.lastName && (
                      <div style={fieldErrorStyle}>{signupForm.formState.errors.lastName.message}</div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...signupForm.register('email')}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                  />
                  {signupForm.formState.errors.email && (
                    <div style={fieldErrorStyle}>{signupForm.formState.errors.email.message}</div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="8+ characters"
                      {...signupForm.register('password')}
                      style={{ ...inputStyle, paddingRight: 42 }}
                      onFocus={e => (e.target.style.borderColor = '#BF7B2E')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(12,12,11,0.15)')}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)} style={pwToggleStyle}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: '#847C72', marginTop: 5 }}>Minimum 8 characters</div>
                  {signupForm.formState.errors.password && (
                    <div style={fieldErrorStyle}>{signupForm.formState.errors.password.message}</div>
                  )}
                </div>

                <button type="submit" disabled={isPending} style={{ ...submitStyle, opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <div style={{ fontSize: 11, color: '#847C72', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                By creating an account you agree to our{' '}
                <a href="/terms" style={{ color: '#847C72', textDecoration: 'underline' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" style={{ color: '#847C72', textDecoration: 'underline' }}>Privacy Policy</a>.
              </div>

              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#847C72' }}>
                Already have an account?{' '}
                <button
                  onClick={() => { setActiveTab('signin'); setError(null) }}
                  style={{ color: '#BF7B2E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom brand strip */}
      <div style={{ padding: '22px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid rgba(12,12,11,0.09)' }}>
        <span style={{ fontSize: 11, color: '#847C72' }}>Gimmelab — Book smarter, play more.</span>
      </div>

    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#847C72',
  marginBottom: 7,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FDFAF6',
  border: '1px solid rgba(12,12,11,0.15)',
  borderRadius: 2,
  padding: '12px 14px',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  color: '#0C0C0B',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const fieldErrorStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#c53030',
  marginTop: 5,
}

const pwToggleStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#847C72',
  display: 'flex',
  alignItems: 'center',
  padding: 2,
}

const submitStyle: React.CSSProperties = {
  width: '100%',
  background: '#BF7B2E',
  border: 'none',
  borderRadius: 2,
  padding: 14,
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.09em',
  color: '#0C0C0B',
  textTransform: 'uppercase',
  cursor: 'pointer',
  marginTop: 8,
  transition: 'background 0.15s',
}

const dividerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '20px 0',
}

const divLineStyle: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: 'rgba(12,12,11,0.09)',
}

const divTextStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#847C72',
}

const socialBtnStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid rgba(12,12,11,0.15)',
  borderRadius: 2,
  padding: 12,
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: '#0C0C0B',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 8,
  transition: 'background 0.15s',
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
        <circle cx="10" cy="10" r="2.5" />
        <path d="M3 3l14 14" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
