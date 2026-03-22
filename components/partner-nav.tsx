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
          href="/partner/dashboard"
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          GIMMELAB
        </Link>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {businessName}
        </span>
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
        {/* Active tabs */}
        {activeTabs.map((tab) => {
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
                borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
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
              height: 44,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
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
