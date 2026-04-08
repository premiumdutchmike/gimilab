import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface Props {
  name: string
  courseName: string
}

export default function PartnerInquiryConfirmation({ name, courseName }: Props) {
  const firstName = name?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>We received your inquiry for {courseName}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Partner inquiry received</Text>
            <Text style={heroTitle}>Thanks, {firstName}.</Text>
            <Text style={heroSub}>
              We received your inquiry about listing <strong>{courseName}</strong> on Gimmelab.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What happens next</Text>
            <Text style={stepText}>
              <strong>1. We review your inquiry</strong> — typically within one business day.
            </Text>
            <Text style={stepText}>
              <strong>2. Quick intro call</strong> — 15 minutes. We'll walk through how credits work,
              what your payout looks like, and answer any questions.
            </Text>
            <Text style={stepText}>
              <strong>3. Go live</strong> — set your inventory, set your price, and start receiving bookings.
              Most courses are live within 48 hours of signing up.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Why courses partner with us</Text>
            <Text style={stepText}>
              <strong>Fill unsold tee times</strong> — Gimmelab members book slots that would otherwise go empty.
              You set the inventory and the price. We send the golfers.
            </Text>
            <Text style={stepText}>
              <strong>Predictable revenue</strong> — get paid per booking at rates you control.
              No rev-share surprises. Payouts hit your account weekly.
            </Text>
            <Text style={stepText}>
              <strong>Zero integration work</strong> — no POS changes, no API setup.
              Members check in with a QR code at the pro shop. That's it.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Questions before our call? Just reply to this email.{'\n'}
            We're a small team and we read every message.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0, padding: '32px 0',
}
const container: React.CSSProperties = {
  backgroundColor: '#ffffff', maxWidth: 520, margin: '0 auto',
  borderRadius: 4, overflow: 'hidden', border: '1px solid #e8e8e8',
}
const wordmark: React.CSSProperties = {
  fontSize: 11, fontWeight: 900, letterSpacing: '4px',
  color: '#111', textAlign: 'center', padding: '20px 24px 0', margin: 0,
}
const hero: React.CSSProperties = { padding: '20px 24px 24px', textAlign: 'center' }
const heroLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#4ade80', margin: '0 0 8px',
}
const heroTitle: React.CSSProperties = {
  fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 10px',
}
const heroSub: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: '1.6', margin: 0 }
const divider: React.CSSProperties = { borderColor: '#f0f0f0', margin: 0 }
const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', margin: '0 0 14px',
}
const stepText: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6', margin: '0 0 12px' }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center',
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line',
}
