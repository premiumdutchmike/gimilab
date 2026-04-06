import Link from 'next/link'

/**
 * Self-contained footer for /vs-teetimegolfpass.
 * Duplicated from app/(public)/page.tsx so this route's layout can be deleted
 * as a single unit. Includes the "vs Tee Time Golf Pass" link (not in the
 * canonical homepage footer — that's SEO-landing-only).
 *
 * Not imported anywhere else. Safe to delete with the route folder.
 */
export default function VsFooter() {
  return (
    <>
      <footer className="vs-footer">
        <div className="vs-footer-top">
          <div>
            <span className="vs-footer-wm vs-footer-brand-name">gimmelab</span>
            <p className="vs-footer-brand-p">
              Credit-based golf memberships. No blackout dates, no rate games, no gatekeeping.
              Just the game you love.
            </p>
          </div>
          <div>
            <div className="vs-footer-col-h">Product</div>
            <ul className="vs-footer-links">
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
              <li>
                <Link href="/courses">Courses</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/pricing">Credits explained</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="vs-footer-col-h">Compare</div>
            <ul className="vs-footer-links">
              <li>
                <Link href="/vs-teetimegolfpass">vs Tee Time Golf Pass</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="vs-footer-col-h">Company</div>
            <ul className="vs-footer-links">
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/press">Press</Link>
              </li>
              <li>
                <Link href="/careers">Careers</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="vs-footer-col-h">Support</div>
            <ul className="vs-footer-links">
              <li>
                <Link href="/help">Help center</Link>
              </li>
              <li>
                <Link href="/contact">Contact us</Link>
              </li>
              <li>
                <Link href="/partners">Partner courses</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="vs-footer-bottom">
          <span className="vs-footer-copy">© 2026 Gimmelab, Inc. All rights reserved.</span>
          <div className="vs-footer-legal-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/terms">Cookies</Link>
          </div>
        </div>
        <span className="vs-footer-big-word">GIMMELAB</span>
      </footer>

      <style>{`
        .vs-footer { background: #0C0C0B; padding: 72px 56px 48px; position: relative; overflow: hidden; }
        .vs-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 56px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .vs-footer-wm { font-family: var(--font-nunito), 'Nunito', sans-serif; font-weight: 900; letter-spacing: -0.03em; line-height: 1; }
        .vs-footer-brand-name { font-size: 22px; color: #fff; display: block; margin-bottom: 16px; }
        .vs-footer-brand-p { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.7; max-width: 260px; font-family: 'Inter', sans-serif; }
        .vs-footer-col-h { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 20px; font-family: 'Inter', sans-serif; }
        .vs-footer-links { list-style: none; display: flex; flex-direction: column; gap: 12px; padding: 0; margin: 0; }
        .vs-footer-links a { font-size: 13px; color: rgba(255,255,255,0.45); transition: color 0.2s; font-family: 'Inter', sans-serif; text-decoration: none; }
        .vs-footer-links a:hover { color: #fff; }
        .vs-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 32px; flex-wrap: wrap; gap: 12px; }
        .vs-footer-copy { font-size: 12px; color: rgba(255,255,255,0.2); font-family: 'Inter', sans-serif; }
        .vs-footer-legal-links { display: flex; gap: 20px; }
        .vs-footer-legal-links a { font-size: 12px; color: rgba(255,255,255,0.2); transition: color 0.2s; font-family: 'Inter', sans-serif; text-decoration: none; }
        .vs-footer-legal-links a:hover { color: rgba(255,255,255,0.6); }
        .vs-footer-big-word { font-size: clamp(64px, 12vw, 160px); font-weight: 700; letter-spacing: -0.06em; color: rgba(255,255,255,0.05); display: block; text-align: center; line-height: 1; margin-top: 48px; user-select: none; font-family: var(--font-inter), 'Inter', sans-serif; }

        @media (max-width: 1024px) {
          .vs-footer { padding-left: 28px; padding-right: 28px; }
          .vs-footer-top { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .vs-footer-top { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
