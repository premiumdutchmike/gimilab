import Link from 'next/link'

export default function PublicNav() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      {/* Utility text — hidden on mobile */}
      <div
        className="hidden md:block"
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.6,
        }}
      >
        One membership.<br />Every course. ■
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        <Link
          href="#how-it-works"
          className="hidden md:block"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          How it works
        </Link>
        <Link
          href="/pricing"
          className="hidden md:block"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          Pricing
        </Link>
        <Link
          href="/login"
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
          }}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            background: '#fff',
            color: '#000',
            padding: '8px 20px',
            textDecoration: 'none',
            borderRadius: 0,
          }}
        >
          Join
        </Link>
      </div>
    </nav>
  )
}
