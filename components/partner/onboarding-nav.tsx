export function OnboardingNav() {
  return (
    <nav style={{
      height: 58,
      background: '#0C0C0B',
      borderBottom: '1px solid rgba(229,221,211,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 40px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.03em',
          color: '#F4EEE3',
        }}>
          gimmelab
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#847C72',
        }}>
          Partner Setup
        </span>
      </div>
    </nav>
  )
}
