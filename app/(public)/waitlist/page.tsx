import type { Metadata } from 'next'
import WaitlistForm from './waitlist-form'

export const metadata: Metadata = {
  title: 'Join the Waitlist — Gimmelab',
  description: 'Get early access to Gimmelab. Book tee times at any course with monthly credits.',
}

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  return (
    <>
      <div className="wl-page">
        <div className="wl-container">
          <div className="wl-eyebrow">Early Access</div>
          <h1 className="wl-title">Get on the list.</h1>
          <p className="wl-sub">We're launching in waves. Join now and be first to book tee times with monthly credits — no booking fees, ever.</p>
          <WaitlistForm referral={ref} />
        </div>
      </div>

      <style>{`
        .wl-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          background: #0C0C0B;
          font-family: var(--font-inter), 'Inter', sans-serif;
        }
        .wl-container {
          max-width: 480px;
          width: 100%;
          text-align: center;
        }
        .wl-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #BF7B2E;
          margin-bottom: 16px;
        }
        .wl-title {
          font-size: clamp(32px, 7vw, 48px);
          font-weight: 800;
          color: #F4EEE3;
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin: 0 0 16px;
        }
        .wl-sub {
          font-size: 15px;
          color: rgba(244,238,227,0.45);
          line-height: 1.65;
          margin: 0 0 40px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
      `}</style>
    </>
  )
}
