import Link from 'next/link'
import { EarningsCalculator } from '@/components/partner/earnings-calculator'

export default function PartnerApplyPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        background: '#0C0C0B',
        borderBottom: '1px solid rgba(229,221,211,0.08)',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.03em',
          color: '#F4EEE3',
        }}>
          gimmelab
        </span>
        <Link href="/login" style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#847C72',
          textDecoration: 'none',
        }}>
          Already a partner? <span style={{ color: '#BF7B2E' }}>Sign in →</span>
        </Link>
      </nav>

      {/* Hero */}
      <section className="pa-hero" style={{
        background: '#0C0C0B',
        padding: '80px 24px 0',
        flex: '0 0 auto',
      }}>
        <div className="pa-hero-grid" style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
          paddingBottom: 80,
        }}>
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#BF7B2E',
              marginBottom: 20,
            }}>
              Partner with Gimmelab
            </p>
            <h1 style={{
              fontSize: 'clamp(42px, 5vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#F4EEE3',
              lineHeight: 1.05,
              marginBottom: 20,
            }}>
              Sell tee times.<br />
              Get paid monthly.
            </h1>
            <p style={{
              fontSize: 16,
              color: '#847C72',
              lineHeight: 1.6,
              marginBottom: 36,
              maxWidth: 480,
            }}>
              Gimmelab connects your open slots with golfers in your region.
              You set the rate. We handle bookings, payments, and payouts.
            </p>
            <Link href="/partner/apply/signup" style={{
              display: 'inline-block',
              background: '#BF7B2E',
              color: '#FDFAF6',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 28px',
              borderRadius: 2,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}>
              List Your Course →
            </Link>
          </div>
          <div>
            <EarningsCalculator dark />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: '#E5DDD3', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 12, textAlign: 'center',
          }}>
            How it works
          </p>
          <h2 style={{
            fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em',
            color: '#0C0C0B', marginBottom: 48, textAlign: 'center',
          }}>
            Live in four steps
          </h2>
          <div className="pa-steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24,
          }}>
            {[
              { n: '01', title: 'Apply', body: 'Create your course profile in minutes.' },
              { n: '02', title: 'Set Your Rate', body: 'You control the credit price per slot.' },
              { n: '03', title: 'Get Bookings', body: 'Members book. You play host.' },
              { n: '04', title: 'Get Paid', body: 'Monthly via Stripe Connect.' },
            ].map(step => (
              <div key={step.n} style={{
                background: '#fff',
                border: '1px solid #D8D1C6',
                borderRadius: 2,
                padding: 28,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#BF7B2E', marginBottom: 12,
                }}>
                  {step.n}
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 700, color: '#0C0C0B', marginBottom: 8,
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#847C72', lineHeight: 1.5 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ background: '#F4EEE3', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#847C72', marginBottom: 16,
        }}>
          Ready to list your course?
        </p>
        <h2 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em',
          color: '#0C0C0B', marginBottom: 28,
        }}>
          Join the Gimmelab network.
        </h2>
        <Link href="/partner/apply/signup" style={{
          display: 'inline-block',
          background: '#BF7B2E',
          color: '#FDFAF6',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '14px 28px',
          borderRadius: 2,
          textDecoration: 'none',
        }}>
          List Your Course →
        </Link>
      </section>

      {/* Footer */}
      <footer className="pa-footer" style={{
        background: '#0C0C0B',
        borderTop: '1px solid rgba(229,221,211,0.08)',
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-nunito), Nunito, sans-serif',
          fontWeight: 900,
          fontSize: 16,
          letterSpacing: '-0.03em',
          color: '#F4EEE3',
        }}>
          gimmelab
        </span>
        <span style={{ fontSize: 12, color: '#847C72' }}>
          gimmelab.com · © 2026
        </span>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .pa-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
            padding-bottom: 64px !important;
          }
          .pa-steps-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .pa-hero {
            padding: 56px 20px 0 !important;
          }
          .pa-hero-grid {
            gap: 36px !important;
            padding-bottom: 48px !important;
          }
          .pa-steps-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .pa-footer {
            padding: 20px 20px !important;
            flex-direction: column !important;
            gap: 10px !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  )
}
