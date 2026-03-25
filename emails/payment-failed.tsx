import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface PaymentFailedProps {
  memberName: string
  tier: string
  amount: string
  retryDate: string
}

export default function PaymentFailed({
  memberName, tier, amount, retryDate,
}: PaymentFailedProps) {
  const firstName = memberName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>Action needed — your Gimmelab payment didn't go through</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Payment issue</Text>
            <Text style={heroTitle}>Heads up, {firstName}.</Text>
            <Text style={heroSub}>
              We weren't able to process your {tier} membership payment of {amount}. Your membership is still active, but we need you to update your payment method.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What happened</Text>
            <Section style={alertBox}>
              <Text style={alertRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Plan</span>
                <span style={{ fontWeight: 700 }}>{tier} membership</span>
              </Text>
              <Text style={alertRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Amount</span>
                <span style={{ fontWeight: 700 }}>{amount}</span>
              </Text>
              <Text style={alertRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Status</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>Payment failed</span>
              </Text>
              <Text style={alertRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Next retry</span>
                <span style={{ fontWeight: 700 }}>{retryDate}</span>
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What to do</Text>
            <Text style={stepText}>
              <strong>Update your payment method</strong> — make sure your card details are current and has sufficient funds. We'll automatically retry on {retryDate}.
            </Text>
            <Text style={stepText}>
              If payment fails again, your membership will be paused and you won't be able to book tee times until it's resolved.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Update payment method</Text>
            <Text style={ctaLink}>gimmelab.com/account/billing</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Need help? Reply to this email and we'll sort it out.{'\n'}
            Your credits and bookings are safe while we work this out.
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
  color: '#111', textAlign: 'center' as const, padding: '20px 24px 0', margin: 0,
}
const hero: React.CSSProperties = { padding: '20px 24px 24px', textAlign: 'center' as const }
const heroLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const, color: '#d97706', margin: '0 0 8px',
}
const heroTitle: React.CSSProperties = {
  fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 10px',
}
const heroSub: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: '1.6', margin: 0 }
const divider: React.CSSProperties = { borderColor: '#f0f0f0', margin: 0 }
const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.35)', margin: '0 0 14px',
}
const stepText: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6', margin: '0 0 8px' }
const alertBox: React.CSSProperties = {
  backgroundColor: '#fffbeb', borderRadius: 4, padding: '14px 18px',
  border: '1px solid #fde68a',
}
const alertRow: React.CSSProperties = {
  fontSize: 13, color: '#111', margin: '0 0 6px', display: 'flex' as const,
  justifyContent: 'space-between' as const,
}
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#d97706', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
