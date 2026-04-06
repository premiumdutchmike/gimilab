import { ComingSoonLayout } from '../coming-soon-layout'

export const metadata = {
  title: 'Blog — Gimmelab',
  description:
    'Notes from Gimmelab — the math, the launch, the people. Coming soon.',
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  return (
    <ComingSoonLayout
      kicker="Blog"
      title="Notes from"
      titleItalic="the Gimmelab."
      body="Posts on the math of golf pricing, how we're building the course network, and what we're learning along the way. Coming soon."
      contactLabel="Want to be first to read it?"
      primaryCta={{ href: '/signup', label: 'Join Gimmelab →' }}
      secondaryCta={{ href: '/about', label: 'About us' }}
    />
  )
}
