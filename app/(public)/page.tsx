import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'OneGolf — One Membership. Every Course.',
  description: 'Monthly credit subscription for golf. Book tee times at top courses, no booking fees.',
}

// Set to true once public/hero-golf.jpg is placed (Unsplash free license, B&W golf course)
const HERO_IMAGE_READY = false

const steps = [
  {
    num: '01',
    title: 'Choose your membership',
    desc: 'Casual, Core, or Heavy. Credits renew monthly. Unused credits roll over — up to half your monthly allowance.',
    stat: 'From\n$99/mo',
  },
  {
    num: '02',
    title: 'Browse partner courses',
    desc: 'Find courses near you. View live availability. Filter by date, time, and players — no phone calls, no waiting.',
    stat: 'Any\ncourse',
  },
  {
    num: '03',
    title: 'Book with credits',
    desc: 'Confirm in seconds. Show your QR code at the course. No surprise fees. Ever.',
    stat: 'Zero\nfees',
  },
]

export default function HomePage() {
  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          minHeight: 600,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: '#111',
        }}
      >
        {/* Background image — flip HERO_IMAGE_READY to true once public/hero-golf.jpg is placed */}
        {HERO_IMAGE_READY && (
          <Image
            src="/hero-golf.jpg"
            alt=""
            fill
            priority
            style={{
              objectFit: 'cover',
              objectPosition: 'center 40%',
              filter: 'grayscale(100%) brightness(0.4)',
            }}
          />
        )}

        {/* Headline */}
        <div
          style={{
            position: 'absolute',
            zIndex: 5,
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-52%)',
            textAlign: 'center',
            padding: '0 20px',
          }}
        >
          {['ONE', 'GOLF'].map((word) => (
            <span
              key={word}
              style={{
                display: 'block',
                fontSize: 'clamp(80px, 16vw, 220px)',
                fontWeight: 900,
                letterSpacing: '-4px',
                lineHeight: 0.88,
                color: '#fff',
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '20px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.8,
              maxWidth: 360,
              margin: 0,
            }}
          >
            Monthly credits · Any partner course · No booking fees · Cancel anytime
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link
              href="/signup"
              style={{
                background: '#fff',
                color: '#000',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                padding: '12px 28px',
                textDecoration: 'none',
              }}
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
              }}
            >
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ borderTop: '1px solid #1a1a1a' }}>
        {/* Section label */}
        <div
          style={{
            padding: '14px 32px',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#444',
            }}
          >
            How it works
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#444',
            }}
          >
            03 steps
          </span>
        </div>

        {/* Steps */}
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              borderBottom: '1px solid #111',
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: 64,
                padding: '32px 0 32px 32px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-geist-mono)',
                color: '#333',
                letterSpacing: '1px',
                flexShrink: 0,
              }}
            >
              {step.num}
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: 32, borderLeft: '1px solid #111' }}>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: '#fff',
                  marginBottom: 8,
                  marginTop: 0,
                }}
              >
                {step.title}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: '#555',
                  lineHeight: 1.7,
                  maxWidth: 440,
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>

            {/* Aside stat */}
            <div
              style={{
                width: 160,
                padding: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#222',
                  textAlign: 'right',
                  whiteSpace: 'pre-line',
                }}
              >
                {step.stat}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* ── PRICING CTA ── */}
      <section
        style={{
          padding: '72px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #1a1a1a',
        }}
      >
        <div>
          <p
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: '-2px',
              color: '#fff',
              lineHeight: 1.0,
              margin: 0,
            }}
          >
            Plans from<br />$99/mo
          </p>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#444',
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            Casual · Core · Heavy
          </p>
        </div>
        <Link
          href="/pricing"
          style={{
            border: '1px solid #fff',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            padding: '14px 32px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View all plans
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          padding: '20px 32px',
          borderTop: '1px solid #111',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '4px',
            color: '#fff',
          }}
        >
          ONEGOLF
        </span>
        <span style={{ fontSize: 10, color: '#333' }}>© 2026 OneGolf</span>
      </footer>

    </main>
  )
}
