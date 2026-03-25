import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface PartnerWelcomeProps {
  partnerName: string
  courseName: string
}

export default function PartnerWelcome({ partnerName, courseName }: PartnerWelcomeProps) {
  const firstName = partnerName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>Welcome to Gimmelab Partner — let's get {courseName || 'your course'} listed</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Partner account created</Text>
            <Text style={heroTitle}>Welcome, {firstName}.</Text>
            <Text style={heroSub}>
              Your partner account is ready. Complete the onboarding steps to get {courseName || 'your course'} live on Gimmelab.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What's next</Text>
            <Text style={stepText}>
              <strong>1. Course profile</strong> — add your course details, address, and description.
            </Text>
            <Text style={stepText}>
              <strong>2. Set your rate</strong> — choose your credit price per slot. The deeper the discount, the better your commission.
            </Text>
            <Text style={stepText}>
              <strong>3. Connect payout</strong> — link your bank via Stripe to receive monthly payouts.
            </Text>
            <Text style={stepText}>
              <strong>4. Add tee times</strong> — list your first available slots.
            </Text>
            <Text style={stepText}>
              <strong>5. Go live</strong> — members in your area can start booking immediately.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Ready to finish setup?</Text>
            <Text style={ctaLink}>gimmelab.com/partner/onboarding/course</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Questions? Reply to this email anytime.{'\n'}
            We're here to help you get listed.
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
  backgroundColor: '#ffffff',
  maxWidth: 520, margin: '0 auto',
  borderRadius: 4, overflow: 'hidden',
  border: '1px solid #e8e8e8',
}

const wordmark: React.CSSProperties = {
  fontSize: 11, fontWeight: 900, letterSpacing: '4px',
  color: '#111', textAlign: 'center' as const,
  padding: '20px 24px 0', margin: 0,
}

const hero: React.CSSProperties = {
  padding: '20px 24px 24px', textAlign: 'center' as const,
}

const heroLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase' as const, color: '#BF7B2E',
  margin: '0 0 8px',
}

const heroTitle: React.CSSProperties = {
  fontSize: 28, fontWeight: 900, color: '#111',
  letterSpacing: '-0.03em', margin: '0 0 10px',
}

const heroSub: React.CSSProperties = {
  fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: '1.6', margin: 0,
}

const divider: React.CSSProperties = {
  borderColor: '#f0f0f0', margin: 0,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.35)',
  margin: '0 0 14px',
}

const stepText: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6',
  margin: '0 0 8px',
}

const ctaText: React.CSSProperties = {
  fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px',
}

const ctaLink: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#BF7B2E', margin: 0,
}

const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center' as const, padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line' as const,
}
