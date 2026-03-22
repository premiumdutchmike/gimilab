import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface WelcomeProps {
  memberName: string
  tier: string        // 'casual' | 'core' | 'heavy'
  credits: number
}

const TIER_LABEL: Record<string, string> = {
  casual: 'Casual',
  core: 'Core',
  heavy: 'Heavy',
}

export default function Welcome({ memberName, tier, credits }: WelcomeProps) {
  const tierLabel = TIER_LABEL[tier] ?? tier
  const firstName = memberName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>Welcome to Gimmelab — {String(credits)} credits are ready to use</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>{tierLabel} membership</Text>
            <Text style={heroTitle}>You're in, {firstName}.</Text>
            <Text style={heroSub}>
              Your {credits} monthly credits are ready. Start booking tee times at any Gimmelab course.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>How it works</Text>
            <Text style={stepText}>
              <strong>1. Browse courses</strong> — explore all member courses and find your tee time.
            </Text>
            <Text style={stepText}>
              <strong>2. Book with credits</strong> — each round costs a set number of credits. No extra fees.
            </Text>
            <Text style={stepText}>
              <strong>3. Show up & play</strong> — show your check-in code at the pro shop and tee off.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' }}>
            <Text style={ctaText}>Ready to book your first round?</Text>
            <Text style={ctaLink}>gimmelab.com/courses</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Questions? Reply to this email anytime.{'\n'}
            Manage your membership at gimmelab.com/account.
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
  textTransform: 'uppercase', color: '#a855f7',
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

const ctaText: React.CSSProperties = {
  fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px',
}

const ctaLink: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#a855f7', margin: 0,
}

const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center', padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line',
}
