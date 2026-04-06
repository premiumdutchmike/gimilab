import { ComingSoonLayout } from '../coming-soon-layout'

export const metadata = {
  title: 'Contact — Gimmelab',
  description: 'Get in touch with the Gimmelab team. info@dutchmike.com.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <ComingSoonLayout
      kicker="Contact"
      title="Say hello."
      titleItalic="We read everything."
      body="Questions, feedback, partnership ideas, bug reports, or just wanting to tell us we got something wrong — all of it lands in the same inbox and all of it gets read. A contact form is on the way. For now, email works great."
      contactLabel="Write to us"
      primaryCta={{ href: '/partners', label: 'Partner a course →' }}
      secondaryCta={{ href: '/about', label: 'About us' }}
    />
  )
}
