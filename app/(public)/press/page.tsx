import { ComingSoonLayout } from '../coming-soon-layout'

export const metadata = {
  title: 'Press — Gimmelab',
  description:
    'Media inquiries, press kit, and coverage of Gimmelab. Contact info@dutchmike.com.',
  alternates: { canonical: '/press' },
}

export default function PressPage() {
  return (
    <ComingSoonLayout
      kicker="Press & media"
      title="Writing about"
      titleItalic="Gimmelab?"
      body="We're pre-launch in Philly. If you're covering golf, local business, or the credit-based membership model, we'd love to talk. Press kit and coverage index coming soon."
      contactLabel="Media inquiries"
      primaryCta={{ href: '/about', label: 'About us' }}
      secondaryCta={{ href: '/', label: 'Back to home' }}
    />
  )
}
