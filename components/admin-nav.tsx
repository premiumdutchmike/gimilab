'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Members',  href: '/admin/members' },
  { label: 'Courses',  href: '/admin/courses' },
  { label: 'Credits',  href: '/admin/credits' },
  { label: 'Revenue',  href: '/admin/revenue' },
  { label: 'Payouts',  href: '/admin/payouts' },
] as const

const LOCKED: string[] = []

export default function AdminNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      {/* Top bar */}
      <div style={{
        height: 48, background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <Link href="/admin/members" style={{
          fontSize: 12, fontWeight: 900, letterSpacing: '4px',
          color: '#111', textDecoration: 'none',
        }}>
          GIMMELAB
        </Link>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#a855f7',
          background: 'rgba(168,85,247,0.08)',
          border: '1px solid rgba(168,85,247,0.2)',
          padding: '3px 10px', borderRadius: 2,
        }}>
          Admin Console
        </span>
      </div>

      {/* Tab strip */}
      <div style={{
        height: 44, background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex', padding: '0 20px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = isActive(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{
              height: 44, padding: '0 16px',
              display: 'flex', alignItems: 'center',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', textDecoration: 'none',
              color: active ? '#111' : 'rgba(0,0,0,0.35)',
              borderBottom: active ? '2px solid #a855f7' : '2px solid transparent',
              flexShrink: 0, transition: 'color 0.15s',
            }}>
              {tab.label}
            </Link>
          )
        })}
        {LOCKED.map(label => (
          <span key={label} style={{
            height: 44, padding: '0 16px',
            display: 'flex', alignItems: 'center',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.18)',
            borderBottom: '2px solid transparent',
            flexShrink: 0, cursor: 'default',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
