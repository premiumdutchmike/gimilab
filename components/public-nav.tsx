'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PublicNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<{ firstName: string } | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'there'
        setUser({ firstName })
      }
    })
  }, [])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  // Auth pages render their own nav
  if (pathname === '/login' || pathname === '/signup') return null

  // vs-* comparison landing pages ship their own self-contained nav so they can
  // be deleted independently. See app/(public)/vs-teetimegolfpass/vs-nav.tsx.
  if (pathname.startsWith('/vs-')) return null

  const isHomepage = pathname === '/'

  // Non-homepage pages get the light nav (unchanged behavior)
  if (!isHomepage) {
    const isLight = pathname.startsWith('/courses') || pathname.startsWith('/pricing') || pathname.startsWith('/partners')
    const showTicker = pathname === '/courses'
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
                <button
                  className="light-nav-hamburger"
                  onClick={() => setMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <span /><span /><span />
                </button>
              </div>
            )}
          </nav>

          {/* Full-screen menu overlay (light) */}
          <div
            className={`light-menu-overlay${menuOpen ? ' open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) closeMenu() }}
          >
            <div className="light-menu-header">
              <Link href="/" className="light-menu-wm" onClick={closeMenu}>gimmelab</Link>
              <button className="light-menu-close" onClick={closeMenu} aria-label="Close menu">
                Close
                <span className="light-menu-close-x">&times;</span>
              </button>
            </div>
            <div className="light-menu-body">
              <Link href="/#how-it-works" className="light-menu-link" onClick={closeMenu}>
                How it works <span>03 steps</span>
              </Link>
              <Link href="/courses" className="light-menu-link" onClick={closeMenu}>
                Courses <span>50+ partner</span>
              </Link>
              <Link href="/pricing" className="light-menu-link" onClick={closeMenu}>
                Pricing <span>3 plans</span>
              </Link>
              <Link href="/partners" className="light-menu-link" onClick={closeMenu}>
                For Courses <span>Partner portal</span>
              </Link>
            </div>
            <div className="light-menu-footer">
              {user ? (
                <Link href="/dashboard" className="light-menu-footer-cta" onClick={closeMenu}>Hi, {user.firstName} →</Link>
              ) : (
                <>
                  <Link href="/signup" className="light-menu-footer-cta" onClick={closeMenu}>Join Gimmelab →</Link>
                  <Link href="/login" className="light-menu-footer-login" onClick={closeMenu}>Already a member? Log in</Link>
                </>
              )}
            </div>
          </div>

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
            .light-nav-hamburger { display: none; background: none; border: none; cursor: pointer; flex-direction: column; gap: 5px; padding: 8px; margin-left: 4px; flex-shrink: 0; }
            .light-nav-hamburger span { display: block; width: 22px; height: 1.5px; background: #0C0C0B; border-radius: 1px; }
            .light-nav-hamburger:hover { opacity: 0.7; }

            /* Light menu overlay */
            .light-menu-overlay {
              position: fixed; inset: 0; z-index: 500;
              display: flex; flex-direction: column;
              background: rgba(253,250,246,0.98);
              backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
              opacity: 0; pointer-events: none;
              transition: opacity 0.35s ease;
            }
            .light-menu-overlay.open { opacity: 1; pointer-events: all; }
            .light-menu-header {
              display: flex; align-items: center; justify-content: space-between;
              padding: 20px 24px;
              border-bottom: 1px solid rgba(12,12,11,0.09);
            }
            .light-menu-wm {
              font-family: var(--font-nunito), 'Nunito', sans-serif;
              font-weight: 900; font-size: 22px;
              letter-spacing: -0.03em;
              color: #0C0C0B; text-decoration: none;
            }
            .light-menu-close {
              background: none; border: none; cursor: pointer;
              font-family: 'Inter', sans-serif;
              font-size: 11px; font-weight: 500;
              letter-spacing: 0.18em; text-transform: uppercase;
              color: #847C72;
              display: flex; align-items: center; gap: 12px;
              transition: color 0.3s ease;
            }
            .light-menu-close:hover { color: #0C0C0B; }
            .light-menu-close-x { font-size: 24px; font-weight: 300; line-height: 1; color: #0C0C0B; }
            .light-menu-body {
              flex: 1; display: flex; flex-direction: column;
              justify-content: center; padding: 0 24px;
            }
            .light-menu-link {
              display: block;
              font-size: clamp(28px, 7vw, 48px);
              font-weight: 700; color: #0C0C0B;
              text-decoration: none; padding: 14px 0;
              border-bottom: 1px solid rgba(12,12,11,0.09);
              transition: color 0.3s ease, padding-left 0.3s ease;
              letter-spacing: -0.02em;
              font-family: 'Inter', sans-serif;
            }
            .light-menu-link:first-child { border-top: 1px solid rgba(12,12,11,0.09); }
            .light-menu-link:hover { color: #BF7B2E; padding-left: 12px; }
            .light-menu-link span {
              font-size: 10px; font-weight: 600;
              letter-spacing: 0.15em; text-transform: uppercase;
              color: #847C72; margin-left: 12px; vertical-align: middle;
            }
            .light-menu-footer {
              padding: 24px; border-top: 1px solid rgba(12,12,11,0.09);
              display: flex; align-items: center; justify-content: space-between; gap: 16px;
            }
            .light-menu-footer-cta {
              font-family: 'Inter', sans-serif;
              font-size: 13px; font-weight: 700;
              letter-spacing: 0.1em; text-transform: uppercase;
              color: #BF7B2E; text-decoration: none;
            }
            .light-menu-footer-cta:hover { opacity: 0.7; }
            .light-menu-footer-login {
              font-family: 'Inter', sans-serif;
              font-size: 12px; font-weight: 500;
              letter-spacing: 0.08em;
              color: #847C72; text-decoration: none;
            }
            .light-menu-footer-login:hover { color: #0C0C0B; }

            @media (max-width: 768px) {
              .light-nav-inner { padding: 0 20px; }
              .light-nav-links { display: none; }
              .light-nav-right { display: none; }
              .light-nav-hamburger { display: flex; }
            }
          `}</style>
        </>
      )
    }
  }

  // ── Homepage: transparent centered nav + floating pill on scroll ──
  return (
    <>
      {/* Ticker bar */}
      <div
        className="gl-ticker"
        style={{
          transform: scrolled ? 'translateY(-100%)' : 'translateY(0)',
          opacity: scrolled ? 0 : 1,
        }}
      >
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

      {/* Transparent main nav */}
      <nav
        className="gl-nav-main"
        style={{
          opacity: scrolled ? 0 : 1,
          pointerEvents: scrolled ? 'none' : 'all',
          transform: scrolled ? 'translateY(-10px)' : 'translateY(0)',
        }}
      >
        <div className="gl-nav-top">
          <div className="gl-nav-top-left">
            <button
              className="gl-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span /><span />
            </button>
          </div>
          <Link href="/" className="gl-nav-wm">gimmelab</Link>
          <div className="gl-nav-top-right">
            {user ? (
              <Link href="/dashboard" className="gl-nav-icon" aria-label="Dashboard">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none">
                  <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" />
                </svg>
              </Link>
            ) : (
              <>
                <Link href="/login" className="gl-nav-icon" aria-label="Log in">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none">
                    <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Floating pill nav (appears on scroll) */}
      <div
        className={`gl-nav-float${scrolled ? ' visible' : ''}`}
        aria-hidden={!scrolled}
      >
        <Link href="/signup" className="gl-float-cta">Join Now</Link>
        <Link href="/" className="gl-float-wm">gimmelab</Link>
        <button
          className="gl-float-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          Menu
          <span className="gl-float-icon" aria-hidden="true"><span /><span /></span>
        </button>
      </div>

      {/* Full-screen menu overlay */}
      <div
        className={`gl-menu-overlay${menuOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) closeMenu() }}
      >
        <div className="gl-menu-header">
          <Link href="/" className="gl-menu-wm" onClick={closeMenu}>gimmelab</Link>
          <button className="gl-menu-close" onClick={closeMenu}>
            Close
            <span className="gl-menu-close-x">&times;</span>
          </button>
        </div>
        <div className="gl-menu-body">
          <Link href="/#how-it-works" className="gl-menu-link" onClick={closeMenu}>
            How it works <span>03 steps</span>
          </Link>
          <Link href="/courses" className="gl-menu-link" onClick={closeMenu}>
            Courses <span>50+ partner</span>
          </Link>
          <Link href="/pricing" className="gl-menu-link" onClick={closeMenu}>
            Pricing <span>3 plans</span>
          </Link>
          <Link href="/partners" className="gl-menu-link" onClick={closeMenu}>
            For Courses <span>Partner portal</span>
          </Link>
        </div>
        <div className="gl-menu-footer">
          <Link href="/signup" className="gl-menu-footer-cta" onClick={closeMenu}>Join Gimmelab →</Link>
          {user ? (
            <Link href="/dashboard" className="gl-menu-footer-login" onClick={closeMenu}>Hi, {user.firstName} →</Link>
          ) : (
            <Link href="/login" className="gl-menu-footer-login" onClick={closeMenu}>Already a member? Log in</Link>
          )}
        </div>
      </div>

      <style>{`
        /* ── TICKER ── */
        .gl-ticker {
          background: #0C0C0B;
          overflow: hidden;
          height: 32px;
          display: flex;
          align-items: center;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 300;
          border-bottom: 1px solid rgba(244,238,227,0.06);
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
        }
        .ticker-track { display: flex; white-space: nowrap; animation: ticker 28s linear infinite; }
        .ticker-item { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(244,238,227,0.5); padding: 0 28px; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .ticker-item.accent { color: #BF7B2E; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── TRANSPARENT MAIN NAV ── */
        .gl-nav-main {
          position: fixed;
          top: 32px; left: 0; right: 0;
          z-index: 200;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .gl-nav-top {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 20px 48px 16px;
        }
        .gl-nav-top-left { display: flex; align-items: center; }
        .gl-hamburger {
          background: none; border: none; cursor: pointer;
          display: flex; flex-direction: column; gap: 5px;
          padding: 4px 0;
          transition: opacity 0.3s ease;
        }
        .gl-hamburger:hover { opacity: 0.7; }
        .gl-hamburger span {
          display: block; width: 22px; height: 1.5px;
          background: #F4EEE3; border-radius: 1px;
        }
        .gl-nav-wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900; font-size: 26px;
          letter-spacing: -0.03em;
          color: #F4EEE3; text-decoration: none; text-align: center;
        }
        .gl-nav-top-right {
          display: flex; align-items: center;
          justify-content: flex-end; gap: 20px;
        }
        .gl-nav-icon {
          color: #F4EEE3; text-decoration: none;
          display: flex; align-items: center;
          transition: opacity 0.3s ease; opacity: 0.8;
        }
        .gl-nav-icon:hover { opacity: 1; }

        /* ── FLOATING PILL NAV ── */
        .gl-nav-float {
          position: fixed;
          top: 18px; left: 50%;
          transform: translateX(-50%) translateY(-20px);
          z-index: 250;
          background: rgba(18,17,14,0.94);
          border: 1px solid rgba(244,238,227,0.08);
          border-radius: 100px;
          height: 54px;
          padding: 0 8px 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          min-width: 520px; max-width: 620px; width: auto;
          box-shadow: 0 8px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
          opacity: 0; pointer-events: none;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease;
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        }
        .gl-nav-float.visible {
          transform: translateX(-50%) translateY(0);
          opacity: 1; pointer-events: all;
        }
        .gl-float-cta {
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #BF7B2E; text-decoration: none; white-space: nowrap;
          transition: color 0.3s ease;
        }
        .gl-float-cta:hover { color: #F4EEE3; }
        .gl-float-wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900; font-size: 17px;
          letter-spacing: -0.02em;
          color: #F4EEE3; text-decoration: none;
          position: absolute; left: 50%; transform: translateX(-50%);
          opacity: 0.9;
        }
        .gl-float-menu-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #F4EEE3;
          padding: 0 20px 0 0; height: 100%;
          transition: color 0.3s ease;
        }
        .gl-float-menu-btn:hover { color: #BF7B2E; }
        .gl-float-icon { display: flex; flex-direction: column; gap: 4px; }
        .gl-float-icon span {
          display: block; width: 18px; height: 1.5px;
          background: currentColor; border-radius: 1px;
        }

        /* ── MENU OVERLAY ── */
        .gl-menu-overlay {
          position: fixed; inset: 0; z-index: 500;
          display: flex; flex-direction: column;
          background: rgba(12,12,11,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          opacity: 0; pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .gl-menu-overlay.open { opacity: 1; pointer-events: all; }
        .gl-menu-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 28px 48px;
          border-bottom: 1px solid rgba(244,238,227,0.06);
        }
        .gl-menu-wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900; font-size: 22px;
          letter-spacing: -0.03em;
          color: #F4EEE3; text-decoration: none;
        }
        .gl-menu-close {
          background: none; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #847C72;
          display: flex; align-items: center; gap: 12px;
          transition: color 0.3s ease;
        }
        .gl-menu-close:hover { color: #F4EEE3; }
        .gl-menu-close-x { font-size: 24px; font-weight: 300; line-height: 1; color: #F4EEE3; }
        .gl-menu-body {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 0 48px;
        }
        .gl-menu-link {
          display: block;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 700; color: #F4EEE3;
          text-decoration: none; padding: 16px 0;
          border-bottom: 1px solid rgba(244,238,227,0.06);
          transition: color 0.3s ease, padding-left 0.3s ease;
          letter-spacing: -0.02em;
        }
        .gl-menu-link:first-child { border-top: 1px solid rgba(244,238,227,0.06); }
        .gl-menu-link:hover { color: #BF7B2E; padding-left: 16px; }
        .gl-menu-link span {
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #847C72; margin-left: 16px; vertical-align: middle;
        }
        .gl-menu-footer {
          padding: 28px 48px;
          border-top: 1px solid rgba(244,238,227,0.06);
          display: flex; align-items: center; justify-content: space-between;
        }
        .gl-menu-footer-cta {
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #BF7B2E; text-decoration: none;
          transition: opacity 0.3s ease;
        }
        .gl-menu-footer-cta:hover { opacity: 0.7; }
        .gl-menu-footer-login {
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 500;
          letter-spacing: 0.1em;
          color: #847C72; text-decoration: none;
          transition: color 0.3s ease;
        }
        .gl-menu-footer-login:hover { color: #F4EEE3; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .gl-nav-top { padding: 16px 24px 12px; }
          .gl-nav-float {
            min-width: 0; left: 16px; right: 16px; width: auto;
            padding: 0 8px 0 20px;
            transform: translateX(0) translateY(-20px);
          }
          .gl-nav-float.visible { transform: translateX(0) translateY(0); }
          .gl-menu-header { padding: 20px 24px; }
          .gl-menu-body { padding: 0 24px; }
          .gl-menu-footer { padding: 20px 24px; }
        }
      `}</style>
    </>
  )
}
