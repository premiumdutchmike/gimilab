import type React from 'react'
import Link from 'next/link'

const navLinkStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#6b7280',
  textDecoration: 'none',
}

export default function PublicNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: '3px',
          color: '#0d0d0d',
          textDecoration: 'none',
          textTransform: 'uppercase',
        }}
      >
        ONEGOLF
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Link href="#how-it-works" className="hidden md:block" style={navLinkStyle}>
          How It Works
        </Link>
        <Link href="#courses" className="hidden md:block" style={navLinkStyle}>
          Courses
        </Link>
        <Link href="/pricing" className="hidden md:block" style={navLinkStyle}>
          Pricing
        </Link>
        <Link href="/login" style={navLinkStyle}>
          Log In
        </Link>
        <Link
          href="/signup"
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
            background: '#1a5c38', color: '#fff',
            padding: '10px 22px', textDecoration: 'none', borderRadius: 6,
          }}
        >
          JOIN NOW
        </Link>
      </div>
    </nav>
  )
}
