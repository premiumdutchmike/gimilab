'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PublicNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ firstName: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'there'
        setUser({ firstName })
      }
    })
  }, [])

  // Auth pages render their own nav — suppress the shared nav
  if (pathname === '/login' || pathname === '/signup') return null

  const isLight = pathname.startsWith('/courses') || pathname.startsWith('/pricing') || pathname.startsWith('/partners')
  const showTicker = pathname === '/' || pathname === '/courses'
  const isMinimal = pathname.startsWith('/pricing')

  if (isLight) {
    return (
      <>
        {showTicker && (
          <div style={{ background: '#0C0C0B', overflow: 'hidden', height: 32, display: 'flex', alignItems: 'center' }}>
            <div className="ticker-track">
              {['Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
                'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
                'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
                'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
              ].map((item, i) => (
                <span key={i} className={item.startsWith('+') ? 'ticker-item accent' : 'ticker-item'}>{item}</span>
              ))}
            </div>
          </div>
        )}

        <nav className="light-nav">
          {isMinimal ? (
            <div className="light-nav-inner">
              <Link href="/" className="light-wm">gimmelab</Link>
              {user ? (
                <Link href="/dashboard" className="light-nav-login">Hi, {user.firstName} →</Link>
              ) : (
                <Link href="/login" className="light-nav-login">Already a member? Log in →</Link>
              )}
            </div>
          ) : (
            <div className="light-nav-inner">
              <Link href="/" className="light-wm">gimmelab</Link>
              <ul className="light-nav-links">
                <li><Link href="/#how-it-works">How It Works</Link></li>
                <li><Link href="/courses" className={pathname.startsWith('/courses') ? 'active' : ''}>Courses</Link></li>
                <li><Link href="/pricing" className={pathname === '/pricing' ? 'active' : ''}>Pricing</Link></li>
                <li><Link href="/partners" className={pathname === '/partners' ? 'active' : ''}>For Courses</Link></li>
              </ul>
              <div className="light-nav-right">
                {user ? (
                  <Link href="/dashboard" className="light-nav-join">Hi, {user.firstName} →</Link>
                ) : (
                  <>
                    <Link href="/login" className="light-nav-login">Log In</Link>
                    <Link href="/signup" className="light-nav-join">Join Now →</Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        <style>{`
          .ticker-track { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
          .ticker-item { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(244,238,227,0.5); padding: 0 28px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
          .ticker-item.accent { color: #BF7B2E; }
          @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

          .light-nav { background: #FDFAF6; border-bottom: 1px solid rgba(12,12,11,0.09); position: sticky; top: 0; z-index: 100; }
          .light-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
          .light-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 24px; letter-spacing: -0.02em; color: #0C0C0B; text-decoration: none; line-height: 1; flex-shrink: 0; }
          .light-nav-links { display: flex; align-items: center; gap: 32px; list-style: none; margin: 0; padding: 0; }
          .light-nav-links a { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
          .light-nav-links a:hover, .light-nav-links a.active { color: #0C0C0B; }
          .light-nav-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
          .light-nav-login { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
          .light-nav-login:hover { color: #0C0C0B; }
          .light-nav-join { background: #0C0C0B; color: #F4EEE3; border-radius: 2px; padding: 10px 20px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
          .light-nav-join:hover { background: #1E1D1B; }
          @media (max-width: 768px) { .light-nav-inner { padding: 0 20px; } .light-nav-links { display: none; } }
        `}</style>
      </>
    )
  }

  // Dark nav (homepage, login, signup, etc.)
  return (
    <>
      <div style={{ background: '#0C0C0B', overflow: 'hidden', height: 32, display: 'flex', alignItems: 'center' }}>
        <div className="ticker-track">
          {['Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
            'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
            'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
            'Monthly credits', '+ Any course', 'Zero booking fees', '+ Cancel anytime', 'From $99/mo', '+ 03 tiers',
          ].map((item, i) => (
            <span key={i} className={item.startsWith('+') ? 'ticker-item accent' : 'ticker-item'}>{item}</span>
          ))}
        </div>
      </div>

      <nav className="public-nav">
        <Link href="/" className="wm nav-wordmark">gimmelab</Link>
        <ul className="nav-links">
          <li><Link href="/#how-it-works">How it works</Link></li>
          <li><Link href="/courses">Courses</Link></li>
          <li><Link href="/pricing">Pricing</Link></li>
          <li><Link href="/partners">For Courses</Link></li>
        </ul>
        <div className="nav-right">
          {user ? (
            <Link href="/dashboard" className="nav-cta">Hi, {user.firstName} →</Link>
          ) : (
            <>
              <Link href="/login" className="nav-login">Log in</Link>
              <Link href="/dashboard" className="nav-login">My account</Link>
              <Link href="/signup" className="nav-cta">Join now →</Link>
            </>
          )}
        </div>
      </nav>

      <style>{`
        .ticker-track { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
        .ticker-item { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(244,238,227,0.5); padding: 0 28px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .ticker-item.accent { color: #BF7B2E; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .public-nav { position: sticky; top: 0; z-index: 100; height: 58px; background: #0C0C0B; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
        .nav-wordmark { font-size: 20px; color: #F4EEE3; text-decoration: none; }
        .nav-links { display: flex; gap: 28px; list-style: none; margin: 0; padding: 0; }
        .nav-links a { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; text-decoration: none; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .nav-links a:hover { color: #F4EEE3; }
        .nav-right { display: flex; align-items: center; gap: 20px; }
        .nav-login { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #847C72; text-decoration: none; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .nav-login:hover { color: #F4EEE3; }
        .nav-cta { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #BF7B2E; text-decoration: none; transition: opacity 0.15s; font-family: 'Inter', sans-serif; }
        .nav-cta:hover { opacity: 0.75; }
        @media (max-width: 1024px) { .public-nav { padding: 0 28px; } }
        @media (max-width: 640px) { .public-nav { padding: 0 20px; } .nav-links { display: none; } }
      `}</style>
    </>
  )
}
