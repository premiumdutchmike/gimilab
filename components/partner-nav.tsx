'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PartnerNavProps {
  businessName: string
}

const activeTabs = [
  { label: 'Dashboard', href: '/partner/dashboard' },
  { label: 'Course', href: '/partner/course' },
  { label: 'Inventory', href: '/partner/inventory' },
  { label: 'Bookings', href: '/partner/bookings' },
  { label: 'Check-in', href: '/partner/checkin' },
  { label: 'Payouts', href: '/partner/payouts' },
  { label: 'Analytics', href: '/partner/analytics' },
  { label: 'Pricing', href: '/partner/pricing' },
  { label: 'Settings', href: '/partner/settings' },
] as const

const lockedTabs: string[] = []

export default function PartnerNav({ businessName }: PartnerNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      {/* Top bar */}
      <div
        style={{
          height: 52,
          background: '#0C0C0B',
          borderBottom: '1px solid rgba(244,238,227,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
          fontFamily: "var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <Link
          href="/partner/dashboard"
          style={{
            fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#F4EEE3',
            textDecoration: 'none',
            lineHeight: 1,
          }}
        >
          gimmelab
        </Link>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#847C72',
          }}
        >
          {businessName}
        </span>
      </div>

      {/* Tab strip */}
      <div
        style={{
          height: 48,
          background: '#0C0C0B',
          borderBottom: '1px solid rgba(244,238,227,0.08)',
          display: 'flex',
          padding: '0 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          fontFamily: "var(--font-geist-sans), 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {/* Active tabs */}
        {activeTabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                height: 48,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: active ? '#F4EEE3' : '#847C72',
                borderBottom: active ? '2px solid #BF7B2E' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}

        {/* Locked tabs — not yet built */}
        {lockedTabs.map((label) => (
          <span
            key={label}
            style={{
              height: 48,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(244,238,227,0.2)',
              borderBottom: '2px solid transparent',
              flexShrink: 0,
              cursor: 'default',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
