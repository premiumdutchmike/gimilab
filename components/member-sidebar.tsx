'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/actions/auth'

interface MemberSidebarProps {
  fullName: string
  email: string
  tier: string | null
  credits: number
  creditResetLabel: string
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="6" height="7" />
        <rect x="11" y="3" width="6" height="4" />
        <rect x="11" y="10" width="6" height="7" />
        <rect x="3" y="13" width="6" height="4" />
      </svg>
    ),
  },
  {
    href: '/rounds',
    label: 'My Rounds',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <line x1="5" y1="2" x2="5" y2="18" />
        <path d="M5 4h9l-2 4 2 4H5" />
      </svg>
    ),
  },
  {
    href: '/credits',
    label: 'Credits',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 7v6M8.5 8.5h2.5a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H11" />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    icon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6" />
      </svg>
    ),
  },
]

export default function MemberSidebar({ fullName, email, tier, credits, creditResetLabel }: MemberSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const displayTier = tier
    ? tier.charAt(0).toUpperCase() + tier.slice(1)
    : 'Member'

  const firstName = fullName.split(' ')[0]

  return (
    <>
      {/* ── Sidebar ── */}
      <aside className="member-sidebar">
        {/* Wordmark */}
        <div className="sidebar-top">
          <Link href="/dashboard" className="sidebar-wordmark">gimilab</Link>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link${active ? ' active' : ''}`}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: user info */}
        <div className="sidebar-bottom">
          <div className="tier-badge">
            <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
              <path d="M5 0l1.12 3.45H9.76L6.82 5.59l1.12 3.46L5 7 1.06 9.05l1.12-3.46L-.24 3.45H3.88z" />
            </svg>
            {displayTier} Member
          </div>
          <div className="member-name">{firstName}</div>
          <div className="member-email">{email}</div>
          <form action={signOut}>
            <button type="submit" className="signout-btn">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M13 3h4v14h-4M8 14l4-4-4-4M12 10H3" />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <style>{`
        .member-sidebar {
          width: 228px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid rgba(12,12,11,0.09);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
          font-family: 'Inter', sans-serif;
        }
        .sidebar-top {
          padding: 26px 24px 22px;
          border-bottom: 1px solid rgba(12,12,11,0.09);
          flex-shrink: 0;
        }
        .sidebar-wordmark {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          font-size: 26px;
          letter-spacing: -0.02em;
          color: #0C0C0B;
          text-decoration: none;
          display: block;
          line-height: 1;
        }
        .sidebar-nav {
          flex: 1;
          padding: 18px 0;
          overflow-y: auto;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 24px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #847C72;
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }
        .sidebar-link:hover { color: #0C0C0B; background: #FDFAF6; }
        .sidebar-link.active { color: #0C0C0B; }
        .sidebar-link.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 18px;
          background: #BF7B2E;
          border-radius: 0 1px 1px 0;
        }
        .sidebar-link-icon {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          opacity: 0.5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-link.active .sidebar-link-icon { opacity: 1; }
        .sidebar-bottom {
          padding: 18px 24px;
          border-top: 1px solid rgba(12,12,11,0.09);
          flex-shrink: 0;
        }
        .tier-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(191,123,46,0.10);
          border: 1px solid rgba(191,123,46,0.22);
          border-radius: 2px;
          padding: 4px 9px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #BF7B2E;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .member-name {
          font-size: 13px;
          font-weight: 700;
          color: #0C0C0B;
          margin-bottom: 1px;
        }
        .member-email {
          font-size: 11px;
          color: #847C72;
          margin-bottom: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .signout-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #847C72;
          text-transform: uppercase;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0;
          transition: color 0.15s;
        }
        .signout-btn:hover { color: #0C0C0B; }
      `}</style>
    </>
  )
}
