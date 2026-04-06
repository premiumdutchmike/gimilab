import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface WaitlistConfirmationProps {
  firstName: string
  referralCode: string
}

export default function WaitlistConfirmation({ firstName, referralCode }: WaitlistConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>You're on the Gimmelab waitlist — early access is coming</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Early access</Text>
            <Text style={heroTitle}>You're on the list, {firstName}.</Text>
            <Text style={heroSub}>
              We're rolling out access in waves. When it's your turn, you'll be the first to know.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Move up the list</Text>
            <Text style={stepText}>
              Share your referral code with friends who play. Every signup bumps you closer to the front.
            </Text>
            <Text style={codeBox}>{referralCode}</Text>
            <Text style={shareLink}>gimmelab.com/waitlist?ref={referralCode}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What you'll get</Text>
            <Text style={stepText}>
              <strong>Monthly credits</strong> — book any partner course, no phone calls, no rate anxiety.
            </Text>
            <Text style={stepText}>
              <strong>No booking fees</strong> — ever. Credits cover everything.
            </Text>
            <Text style={stepText}>
              <strong>50+ courses</strong> — and growing every week.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Questions? Reply to this email anytime.{'\n'}
            gimmelab.com
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
  color: '#111', textAlign: 'center',
  padding: '20px 24px 0', margin: 0,
}

const hero: React.CSSProperties = {
  padding: '20px 24px 24px', textAlign: 'center',
}

const heroLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#BF7B2E',
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
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
  margin: '0 0 14px',
}

const stepText: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6',
  margin: '0 0 8px',
}

const codeBox: React.CSSProperties = {
  fontSize: 22, fontWeight: 900, letterSpacing: '0.08em',
  color: '#111', textAlign: 'center',
  backgroundColor: '#f9f7f4', borderRadius: 4,
  padding: '14px 20px', margin: '16px 0 8px',
}

const shareLink: React.CSSProperties = {
  fontSize: 12, color: '#BF7B2E', textAlign: 'center',
  margin: '0 0 4px',
}

const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center', padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line',
}
