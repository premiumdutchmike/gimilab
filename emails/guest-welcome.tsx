import {
  Body, Button, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface GuestWelcomeProps {
  guestFirstName: string
  hostName: string
  courseName: string
  courseAddress: string
  date: string
  time: string
  signupUrl: string
}

export default function GuestWelcome({
  guestFirstName,
  hostName,
  courseName,
  courseAddress,
  date,
  time,
  signupUrl,
}: GuestWelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>{hostName} booked you a round at {courseName}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>You&apos;re on the tee sheet</Text>
            <Text style={heroTitle}>{courseName}</Text>
            <Text style={heroSub}>{courseAddress}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={bodyText}>
              Hey {guestFirstName} — <strong>{hostName}</strong> just booked a round
              with you at <strong>{courseName}</strong> on{' '}
              <strong>{date}</strong> at <strong>{time}</strong>.
            </Text>
            <Text style={bodyText}>
              They covered your spot with Gimmelab credits, so you&apos;ve got
              nothing to pay at the course. Just show up and play.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px', textAlign: 'center' }}>
            <Text style={pitchLabel}>Liked it? Get your own.</Text>
            <Text style={pitchCopy}>
              Gimmelab is one membership that works at every partner course.
              Monthly credits, zero booking fees, no phone calls.
            </Text>
            <Button href={signupUrl} style={ctaButton}>
              See plans →
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This is a one-time notification for your upcoming round.{'\n'}
            Questions? Reply to this email and we&apos;ll help.
          </Text>

        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0, padding: '32px 0',
}

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  maxWidth: 520,
  margin: '0 auto',
  borderRadius: 4,
  overflow: 'hidden',
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
  textTransform: 'uppercase', color: '#C4893A',
  margin: '0 0 8px',
}

const heroTitle: React.CSSProperties = {
  fontSize: 24, fontWeight: 900, color: '#111',
  letterSpacing: '-0.02em', margin: '0 0 4px',
}

const heroSub: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0,
}

const divider: React.CSSProperties = {
  borderColor: '#f0f0f0', margin: 0,
}

const bodyText: React.CSSProperties = {
  fontSize: 14, color: 'rgba(0,0,0,0.75)',
  lineHeight: '1.6', margin: '0 0 12px',
}

const pitchLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: '#C4893A',
  margin: '0 0 10px',
}

const pitchCopy: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.55)',
  lineHeight: '1.6', margin: '0 0 18px',
}

const ctaButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#C84B2A',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  textDecoration: 'none',
}

const footer: React.CSSProperties = {
  fontSize: 11, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center', padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line',
}
