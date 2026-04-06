import { ComingSoonLayout } from '../coming-soon-layout'

export const metadata = {
  title: 'Careers — Gimmelab',
  description:
    'Join the Gimmelab team. We\'re not hiring yet, but we will be. Drop us a line.',
  alternates: { canonical: '/careers' },
}

export default function CareersPage() {
  return (
    <ComingSoonLayout
      kicker="Careers"
      title="We're small."
      titleItalic="Growing carefully."
      body="Gimmelab isn't hiring yet — we're focused on the Philly launch. When we do start hiring, we'll be looking for people who love the game and hate the gatekeeping. If that's you, send us a note."
      contactLabel="Introduce yourself"
      primaryCta={{ href: '/about', label: 'About us' }}
      secondaryCta={{ href: '/', label: 'Back to home' }}
    />
  )
}
