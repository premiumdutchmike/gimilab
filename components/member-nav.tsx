'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MemberNavProps {
  credits: number
  firstName: string
}

const tabs = [
  { label: 'Book', href: '/book' },
  { label: 'Courses', href: '/courses' },
  { label: 'My Rounds', href: '/rounds' },
  { label: 'Credits', href: '/credits' },
] as const

export default function MemberNav({ credits, firstName }: MemberNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <div className="member-nav-wrap">
        {/* Top bar */}
        <div className="member-topbar">
          <Link href="/dashboard" className="wm member-wordmark">gimilab</Link>
          <Link href="/credits" className="member-credits-pill">
            <span className="member-credits-num">{credits}</span>
            <span className="member-credits-label">credits · {firstName}</span>
          </Link>
        </div>

        {/* Tab strip */}
        <div className="member-tabs">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`member-tab${active ? ' active' : ''}`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <style>{`
        .member-nav-wrap {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #0C0C0B;
          border-bottom: 1px solid rgba(244,238,227,0.07);
        }
        .member-topbar {
          height: 52px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 32px;
        }
        .wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .member-wordmark {
          font-size: 18px;
          color: #F4EEE3;
          text-decoration: none;
        }
        .member-credits-pill {
          display: flex;
          align-items: baseline;
          gap: 5px;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .member-credits-pill:hover { opacity: 0.75; }
        .member-credits-num {
          font-size: 13px;
          font-weight: 700;
          color: #BF7B2E;
          font-family: 'Inter', sans-serif;
        }
        .member-credits-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #847C72;
          font-family: 'Inter', sans-serif;
        }
        .member-tabs {
          height: 40px;
          display: flex;
          padding: 0 32px;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .member-tabs::-webkit-scrollbar { display: none; }
        .member-tab {
          height: 40px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          color: #847C72;
          border-bottom: 2px solid transparent;
          flex-shrink: 0;
          transition: color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .member-tab:hover { color: #F4EEE3; }
        .member-tab.active {
          color: #F4EEE3;
          border-bottom-color: #BF7B2E;
        }
        @media (max-width: 640px) {
          .member-topbar { padding: 0 20px; }
          .member-tabs { padding: 0 20px; }
        }
      `}</style>
    </>
  )
}
