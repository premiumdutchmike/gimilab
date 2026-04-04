import Link from 'next/link'

type Variant = 'primary' | 'ghost'

interface AnimatedButtonProps {
  href: string
  children: React.ReactNode
  variant?: Variant
}

/**
 * Animated pill button with a circular icon badge that slides from the
 * right to the left on hover (and rotates 45°). Inspired by
 * shadcnspace/button-witn-icon on 21st.dev.
 */
export default function AnimatedButton({
  href,
  children,
  variant = 'primary',
}: AnimatedButtonProps) {
  return (
    <Link href={href} className={`ab ab-${variant}`}>
      <span className="ab-text">{children}</span>
      <span className="ab-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </span>
      <style>{`
        .ab {
          position: relative;
          display: inline-flex;
          align-items: center;
          height: 48px;
          padding: 4px 56px 4px 24px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          text-decoration: none;
          overflow: hidden;
          transition: padding 0.5s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, color 0.3s ease;
          cursor: pointer;
        }
        .ab-primary {
          background: #C84B2A;
          color: #fff;
        }
        .ab-primary:hover { background: #b03d21; }
        .ab-ghost {
          background: transparent;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.35);
        }
        .ab-ghost:hover { border-color: #fff; }
        .ab:hover {
          padding: 4px 24px 4px 56px;
        }
        .ab-text {
          position: relative;
          z-index: 2;
          transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .ab-icon {
          position: absolute;
          right: 4px;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          background: #fff;
          color: #131110;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: right 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .ab-ghost .ab-icon {
          background: #fff;
          color: #131110;
        }
        .ab:hover .ab-icon {
          right: calc(100% - 44px);
          transform: rotate(45deg);
        }
      `}</style>
    </Link>
  )
}
