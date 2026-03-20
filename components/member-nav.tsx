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
    <div
      style={{ position: 'sticky', top: 0, zIndex: 40 }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          background: '#090f1a',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        <Link
          href="/dashboard"
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          ONEGOLF
        </Link>

        <Link
          href="/credits"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
          }}
        >
          {credits} credits · {firstName}
        </Link>
      </div>

      {/* Tab strip */}
      <div
        style={{
          height: 44,
          background: '#090f1a',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          padding: '0 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                height: 44,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                borderBottom: active ? '2px solid #4ade80' : '2px solid transparent',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
