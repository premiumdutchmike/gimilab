import Link from 'next/link'

/**
 * Shared layout for stub pages that don't have real content yet
 * (/blog, /press, /careers, /help, /contact). Matches the off-white hero
 * design language of /about and /partners. Replace with full pages as they
 * get built — this is a placeholder, not a permanent home.
 */
export function ComingSoonLayout({
  kicker,
  title,
  titleItalic,
  body,
  contactLabel = 'For now, email',
  contactEmail = 'info@dutchmike.com',
  primaryCta,
  secondaryCta,
}: {
  kicker: string
  title: string
  titleItalic: string
  body: string
  contactLabel?: string
  contactEmail?: string
  primaryCta?: { href: string; label: string }
  secondaryCta?: { href: string; label: string }
}) {
  return (
    <>
      <div className="cs-root">
        <section className="cs-hero">
          <div className="cs-hero-bg" />
          <div className="cs-hero-grid" />
          <div className="cs-hero-content">
            <div className="cs-kicker">
              <span className="cs-kicker-dot" />
              {kicker}
            </div>
            <h1 className="cs-hl cs-title">
              {title}
              <br />
              <em>{titleItalic}</em>
            </h1>
            <p className="cs-body">{body}</p>

            <div className="cs-contact">
              <div className="cs-contact-label">{contactLabel}</div>
              <a href={`mailto:${contactEmail}`} className="cs-contact-link">
                {contactEmail}
              </a>
            </div>

            {(primaryCta || secondaryCta) && (
              <div className="cs-actions">
                {primaryCta && (
                  <Link href={primaryCta.href} className="cs-btn cs-btn-primary">
                    {primaryCta.label}
                  </Link>
                )}
                {secondaryCta && (
                  <Link href={secondaryCta.href} className="cs-btn cs-btn-ghost">
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="cs-footer">
          <div className="cs-footer-top">
            <div>
              <span className="cs-footer-wm">gimmelab</span>
              <p className="cs-footer-tagline">Credit-based golf memberships. No blackout dates, no rate games, no gatekeeping. Just the game you love.</p>
            </div>
            <div>
              <div className="cs-footer-col-h">Product</div>
              <ul className="cs-footer-links">
                <li><Link href="/#how-it-works">How it works</Link></li>
                <li><Link href="/courses">Courses</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/pricing">Credits explained</Link></li>
              </ul>
            </div>
            <div>
              <div className="cs-footer-col-h">Company</div>
              <ul className="cs-footer-links">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/press">Press</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <div className="cs-footer-col-h">Support</div>
              <ul className="cs-footer-links">
                <li><Link href="/help">Help center</Link></li>
                <li><Link href="/contact">Contact us</Link></li>
                <li><Link href="/partners">Partner courses</Link></li>
              </ul>
            </div>
          </div>
          <div className="cs-footer-bottom">
            <span className="cs-footer-copy">© 2025 Gimmelab, Inc. All rights reserved.</span>
            <div className="cs-footer-legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/terms">Cookies</Link>
            </div>
          </div>
          <span className="cs-footer-big">GIMMELAB</span>
        </footer>
      </div>

      <style>{`
        :root {
          --cs-midnight: #0C0C0B;
          --cs-linen: #F4EEE3;
          --cs-amber: #BF7B2E;
          --cs-stone: #847C72;
          --cs-off-white: #FDFAF6;
        }
        .cs-root {
          background: var(--cs-off-white);
          color: var(--cs-midnight);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
          overflow-x: hidden;
        }
        .cs-hl {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        .cs-hl em {
          font-style: italic;
          font-weight: 700;
          color: var(--cs-amber);
        }

        .cs-hero {
          position: relative;
          min-height: 88vh;
          display: flex;
          align-items: center;
          padding: clamp(80px, 12vw, 160px) clamp(24px, 8vw, 120px);
          overflow: hidden;
        }
        .cs-hero-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 70% 50%, rgba(191,123,46,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 20% 30%, rgba(232,64,42,0.05) 0%, transparent 50%),
            var(--cs-off-white);
        }
        .cs-hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse 70% 80% at 60% 50%, black 30%, transparent 80%);
        }
        .cs-hero-content {
          position: relative;
          z-index: 2;
          max-width: 820px;
        }
        .cs-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(191,123,46,0.12);
          border: 1px solid rgba(191,123,46,0.3);
          border-radius: 999px;
          padding: 6px 14px 6px 10px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--cs-amber);
          margin-bottom: 36px;
        }
        .cs-kicker-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cs-amber);
        }
        .cs-title {
          font-size: clamp(48px, 7vw, 92px);
          color: var(--cs-midnight);
          margin-bottom: 32px;
        }
        .cs-body {
          font-size: clamp(17px, 1.5vw, 21px);
          line-height: 1.6;
          color: var(--cs-stone);
          max-width: 640px;
          margin-bottom: 48px;
        }

        .cs-contact {
          padding: 28px 0;
          border-top: 1px solid rgba(0,0,0,0.1);
          border-bottom: 1px solid rgba(0,0,0,0.1);
          margin-bottom: 40px;
          max-width: 640px;
        }
        .cs-contact-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cs-stone);
          margin-bottom: 10px;
        }
        .cs-contact-link {
          font-family: var(--font-space-grotesk), sans-serif;
          font-weight: 700;
          font-size: clamp(22px, 2.6vw, 32px);
          color: var(--cs-amber);
          text-decoration: none;
          letter-spacing: -0.02em;
          transition: opacity 0.2s ease;
        }
        .cs-contact-link:hover {
          opacity: 0.75;
        }

        .cs-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cs-btn {
          display: inline-flex;
          align-items: center;
          padding: 16px 32px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
          text-decoration: none;
        }
        .cs-btn:hover {
          opacity: 0.85;
        }
        .cs-btn-primary {
          background: var(--cs-amber);
          color: var(--cs-off-white);
        }
        .cs-btn-ghost {
          background: transparent;
          color: var(--cs-midnight);
          border: 1px solid rgba(12,12,11,0.3);
        }

        /* ── FOOTER ── */
        .cs-footer {
          background: var(--cs-midnight);
          padding: 72px 56px 48px;
          position: relative;
          overflow: hidden;
        }
        .cs-footer-top {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 48px;
        }
        .cs-footer-wm {
          font-family: var(--font-nunito), 'Nunito', sans-serif;
          font-weight: 900;
          font-size: 22px;
          color: #fff;
          display: block;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .cs-footer-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          line-height: 1.7;
          max-width: 260px;
          font-family: 'Inter', sans-serif;
        }
        .cs-footer-col-h {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cs-amber);
          margin-bottom: 20px;
        }
        .cs-footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0;
          margin: 0;
        }
        .cs-footer-links a {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          transition: color 0.2s;
          font-family: 'Inter', sans-serif;
          text-decoration: none;
        }
        .cs-footer-links a:hover { color: #fff; }
        .cs-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 24px;
        }
        .cs-footer-copy {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-family: 'Inter', sans-serif;
        }
        .cs-footer-legal {
          display: flex;
          gap: 20px;
        }
        .cs-footer-legal a {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          transition: color 0.2s;
          font-family: 'Inter', sans-serif;
          text-decoration: none;
        }
        .cs-footer-legal a:hover { color: rgba(255,255,255,0.6); }
        .cs-footer-big {
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(100px, 18vw, 260px);
          font-weight: 700;
          letter-spacing: -0.06em;
          color: rgba(255,255,255,0.025);
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .cs-footer { padding: 56px 28px 40px; }
          .cs-footer-top { grid-template-columns: 1fr 1fr; }
          .cs-footer-bottom { flex-direction: column; gap: 12px; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .cs-footer-top { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
