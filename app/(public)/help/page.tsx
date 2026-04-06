import { ComingSoonLayout } from '../coming-soon-layout'

export const metadata = {
  title: 'Help Center — Gimmelab',
  description:
    'Answers to common questions about Gimmelab memberships, credits, bookings, and partner courses.',
  alternates: { canonical: '/help' },
}

export default function HelpPage() {
  return (
    <ComingSoonLayout
      kicker="Help center"
      title="Need a hand?"
      titleItalic="We've got you."
      body="Self-serve docs and common questions are coming soon. In the meantime, the fastest way to get a question answered is to email us directly — we read every message."
      contactLabel="Email support"
      primaryCta={{ href: '/pricing', label: 'See plans' }}
      secondaryCta={{ href: '/about', label: 'About us' }}
    />
  )
}
