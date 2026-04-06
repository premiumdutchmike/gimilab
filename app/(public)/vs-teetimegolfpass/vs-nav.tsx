'use client'

/**
 * Self-contained nav for /vs-teetimegolfpass.
 * Duplicated from components/public-nav.tsx (light-nav variant) so this route
 * and its layout can be deleted as a single unit without affecting other pages.
 *
 * Not imported anywhere else. Safe to delete with the route folder.
 */

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VsNav() {
  const [user, setUser] = useState<{ firstName: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const firstName =
          user.user_metadata?.first_name ||
          user.user_metadata?.name?.split(' ')[0] ||
          'there'
        setUser({ firstName })
      }
    })
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <nav className="vs-light-nav">
        <div className="vs-light-nav-inner">
          <Link href="/" className="vs-light-wm">
            gimmelab
          </Link>
          <ul className="vs-light-nav-links">
            <li>
              <Link href="/#how-it-works">How It Works</Link>
            </li>
            <li>
              <Link href="/courses">Courses</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/partners">For Courses</Link>
            </li>
          </ul>
          <div className="vs-light-nav-right">
            {user ? (
              <Link href="/dashboard" className="vs-light-nav-join">
                Hi, {user.firstName} →
              </Link>
            ) : (
              <>
                <Link href="/login" className="vs-light-nav-login">
                  Log In
                </Link>
                <Link href="/waitlist" className="vs-light-nav-join">
                  Join Now →
                </Link>
              </>
            )}
          </div>
          <button
            className="vs-light-nav-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        className={`vs-light-menu-overlay${menuOpen ? ' open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMenu()
        }}
      >
        <div className="vs-light-menu-header">
          <Link href="/" className="vs-light-menu-wm" onClick={closeMenu}>
            gimmelab
          </Link>
          <button
            className="vs-light-menu-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            Close
            <span className="vs-light-menu-close-x">&times;</span>
          </button>
        </div>
        <div className="vs-light-menu-body">
          <Link href="/#how-it-works" className="vs-light-menu-link" onClick={closeMenu}>
            How it works <span>03 steps</span>
          </Link>
          <Link href="/courses" className="vs-light-menu-link" onClick={closeMenu}>
            Courses <span>50+ partner</span>
          </Link>
          <Link href="/pricing" className="vs-light-menu-link" onClick={closeMenu}>
            Pricing <span>3 plans</span>
          </Link>
          <Link href="/partners" className="vs-light-menu-link" onClick={closeMenu}>
            For Courses <span>Partner portal</span>
          </Link>
        </div>
        <div className="vs-light-menu-footer">
          {user ? (
            <Link
              href="/dashboard"
              className="vs-light-menu-footer-cta"
              onClick={closeMenu}
            >
              Hi, {user.firstName} →
            </Link>
          ) : (
            <>
              <Link
                href="/waitlist"
                className="vs-light-menu-footer-cta"
                onClick={closeMenu}
              >
                Join Gimmelab →
              </Link>
              <Link
                href="/login"
                className="vs-light-menu-footer-login"
                onClick={closeMenu}
              >
                Already a member? Log in
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .vs-light-nav { background: #FDFAF6; border-bottom: 1px solid rgba(12,12,11,0.09); position: sticky; top: 0; z-index: 100; }
        .vs-light-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 40px; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .vs-light-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 24px; letter-spacing: -0.02em; color: #0C0C0B; text-decoration: none; line-height: 1; flex-shrink: 0; }
        .vs-light-nav-links { display: flex; align-items: center; gap: 32px; list-style: none; margin: 0; padding: 0; }
        .vs-light-nav-links a { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .vs-light-nav-links a:hover { color: #0C0C0B; }
        .vs-light-nav-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
        .vs-light-nav-login { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: #847C72; text-decoration: none; text-transform: uppercase; transition: color 0.15s; font-family: 'Inter', sans-serif; }
        .vs-light-nav-login:hover { color: #0C0C0B; }
        .vs-light-nav-join { background: #0C0C0B; color: #F4EEE3; border-radius: 2px; padding: 10px 20px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none; transition: background 0.15s; }
        .vs-light-nav-join:hover { background: #1E1D1B; }
        .vs-light-nav-hamburger { display: none; background: none; border: none; cursor: pointer; flex-direction: column; gap: 5px; padding: 8px; margin-left: 4px; flex-shrink: 0; }
        .vs-light-nav-hamburger span { display: block; width: 22px; height: 1.5px; background: #0C0C0B; border-radius: 1px; }
        .vs-light-nav-hamburger:hover { opacity: 0.7; }

        .vs-light-menu-overlay { position: fixed; inset: 0; z-index: 500; display: flex; flex-direction: column; background: rgba(253,250,246,0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); opacity: 0; pointer-events: none; transition: opacity 0.35s ease; }
        .vs-light-menu-overlay.open { opacity: 1; pointer-events: all; }
        .vs-light-menu-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(12,12,11,0.09); }
        .vs-light-menu-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; font-size: 22px; letter-spacing: -0.03em; color: #0C0C0B; text-decoration: none; }
        .vs-light-menu-close { background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #847C72; display: flex; align-items: center; gap: 12px; transition: color 0.3s ease; }
        .vs-light-menu-close:hover { color: #0C0C0B; }
        .vs-light-menu-close-x { font-size: 24px; font-weight: 300; line-height: 1; color: #0C0C0B; }
        .vs-light-menu-body { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 24px; }
        .vs-light-menu-link { display: block; font-size: clamp(28px, 7vw, 48px); font-weight: 700; color: #0C0C0B; text-decoration: none; padding: 14px 0; border-bottom: 1px solid rgba(12,12,11,0.09); transition: color 0.3s ease, padding-left 0.3s ease; letter-spacing: -0.02em; font-family: 'Inter', sans-serif; }
        .vs-light-menu-link:first-child { border-top: 1px solid rgba(12,12,11,0.09); }
        .vs-light-menu-link:hover { color: #BF7B2E; padding-left: 12px; }
        .vs-light-menu-link span { font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #847C72; margin-left: 12px; vertical-align: middle; }
        .vs-light-menu-footer { padding: 24px; border-top: 1px solid rgba(12,12,11,0.09); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .vs-light-menu-footer-cta { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #BF7B2E; text-decoration: none; }
        .vs-light-menu-footer-cta:hover { opacity: 0.7; }
        .vs-light-menu-footer-login { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.08em; color: #847C72; text-decoration: none; }
        .vs-light-menu-footer-login:hover { color: #0C0C0B; }

        @media (max-width: 768px) {
          .vs-light-nav-inner { padding: 0 20px; }
          .vs-light-nav-links { display: none; }
          .vs-light-nav-right { display: none; }
          .vs-light-nav-hamburger { display: flex; }
        }
      `}</style>
    </>
  )
}
