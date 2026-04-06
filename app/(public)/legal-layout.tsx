import Link from 'next/link'

/**
 * Shared layout for long-form legal pages (/privacy, /terms).
 * Light off-white body, Inter headlines, prose optimised for reading.
 * Includes a draft banner so visitors (and you) know the text is not final.
 */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="lg-root">
        {/* Draft banner */}
        <div className="lg-draft">
          <strong>Draft.</strong> This document is a working version and has not yet been
          reviewed by counsel. For questions contact{' '}
          <a href="mailto:info@dutchmike.com">info@dutchmike.com</a>.
        </div>

        {/* Header */}
        <header className="lg-header">
          <div className="lg-header-inner">
            <div className="lg-kicker">Legal</div>
            <h1 className="lg-hl lg-title">{title}</h1>
            <div className="lg-meta">
              <span>Last updated: {updated}</span>
              <span className="lg-meta-divider">·</span>
              <Link href="/">gimmelab.com</Link>
            </div>
          </div>
        </header>

        {/* Prose */}
        <article className="lg-article">{children}</article>

        {/* Footer nav */}
        <nav className="lg-footer-nav">
          <div className="lg-footer-inner">
            <Link href="/privacy" className="lg-footer-link">
              Privacy policy
            </Link>
            <Link href="/terms" className="lg-footer-link">
              Terms of service
            </Link>
            <Link href="/about" className="lg-footer-link">
              About
            </Link>
            <Link href="/" className="lg-footer-link">
              Back to home
            </Link>
          </div>
        </nav>
      </div>

      <style>{`
        :root {
          --lg-midnight: #0C0C0B;
          --lg-linen: #F4EEE3;
          --lg-amber: #BF7B2E;
          --lg-stone: #847C72;
          --lg-smoke: #E5DDD3;
          --lg-off-white: #FDFAF6;
        }
        .lg-root {
          background: var(--lg-off-white);
          color: var(--lg-midnight);
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .lg-hl {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }

        /* Draft banner */
        .lg-draft {
          background: var(--lg-midnight);
          color: var(--lg-linen);
          padding: 14px clamp(24px, 6vw, 80px);
          font-size: 13px;
          line-height: 1.5;
          border-bottom: 1px solid var(--lg-amber);
          text-align: center;
        }
        .lg-draft strong {
          color: var(--lg-amber);
          font-weight: 700;
          margin-right: 6px;
        }
        .lg-draft a {
          color: var(--lg-amber);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Header */
        .lg-header {
          padding: clamp(64px, 10vw, 120px) clamp(24px, 8vw, 120px) clamp(48px, 6vw, 80px);
          border-bottom: 1px solid rgba(0,0,0,0.08);
        }
        .lg-header-inner {
          max-width: 880px;
        }
        .lg-kicker {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--lg-amber);
          margin-bottom: 24px;
        }
        .lg-title {
          font-size: clamp(40px, 6vw, 72px);
          color: var(--lg-midnight);
          margin-bottom: 32px;
        }
        .lg-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: var(--lg-stone);
        }
        .lg-meta a {
          color: var(--lg-stone);
          text-decoration: none;
          transition: color 0.15s;
        }
        .lg-meta a:hover {
          color: var(--lg-amber);
        }
        .lg-meta-divider {
          opacity: 0.5;
        }

        /* Article prose */
        .lg-article {
          max-width: 760px;
          padding: clamp(48px, 6vw, 80px) clamp(24px, 8vw, 120px) clamp(80px, 10vw, 140px);
          font-size: 16px;
          line-height: 1.75;
          color: var(--lg-midnight);
        }
        .lg-article h2 {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 700;
          font-size: clamp(22px, 2.4vw, 30px);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 56px 0 20px;
          color: var(--lg-midnight);
        }
        .lg-article h2:first-child {
          margin-top: 0;
        }
        .lg-article h3 {
          font-family: var(--font-inter), 'Inter', sans-serif;
          font-weight: 600;
          font-size: 18px;
          letter-spacing: -0.01em;
          margin: 32px 0 12px;
          color: var(--lg-midnight);
        }
        .lg-article p {
          margin-bottom: 18px;
          color: var(--lg-midnight);
        }
        .lg-article p strong {
          font-weight: 600;
        }
        .lg-article ul {
          margin: 0 0 24px 0;
          padding-left: 24px;
        }
        .lg-article ul li {
          margin-bottom: 10px;
          color: var(--lg-midnight);
        }
        .lg-article ul li::marker {
          color: var(--lg-amber);
        }
        .lg-article a {
          color: var(--lg-amber);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .lg-article hr {
          border: none;
          border-top: 1px solid rgba(0,0,0,0.08);
          margin: 48px 0;
        }
        .lg-article .lg-callout {
          background: var(--lg-linen);
          border-left: 2px solid var(--lg-amber);
          padding: 20px 24px;
          margin: 32px 0;
          font-size: 14px;
          line-height: 1.65;
          color: var(--lg-stone);
        }
        .lg-article .lg-callout strong {
          color: var(--lg-midnight);
        }

        /* Footer nav */
        .lg-footer-nav {
          background: var(--lg-midnight);
          color: var(--lg-linen);
          padding: 40px clamp(24px, 8vw, 120px);
        }
        .lg-footer-inner {
          display: flex;
          gap: 32px;
          flex-wrap: wrap;
          max-width: 880px;
        }
        .lg-footer-link {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(244,238,227,0.55);
          text-decoration: none;
          transition: color 0.15s;
        }
        .lg-footer-link:hover {
          color: var(--lg-amber);
        }
      `}</style>
    </>
  )
}
