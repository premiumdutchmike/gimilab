import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface ReviewRequestProps {
  memberName: string
  courseName: string
  date: string
  courseSlug: string
}

export default function ReviewRequest({
  memberName, courseName, date, courseSlug,
}: ReviewRequestProps) {
  const firstName = memberName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>How was your round at {courseName}?</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Post-round</Text>
            <Text style={heroTitle}>How was it, {firstName}?</Text>
            <Text style={heroSub}>
              You played {courseName} on {date}. Take 30 seconds to rate your experience — it helps other members and the course.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '24px', textAlign: 'center' as const }}>
            <Text style={sectionTitle}>Rate your round</Text>
            <Text style={{ fontSize: 36, margin: '0 0 12px', letterSpacing: '8px' }}>
              ★ ★ ★ ★ ★
            </Text>
            <Text style={stepText}>
              Tap a star to rate. Your review helps other Gimmelab members find great courses — and helps courses know what they're doing right.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Leave your review</Text>
            <Text style={ctaLink}>gimmelab.com/courses/{courseSlug}/review</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because you played a round via Gimmelab.{'\n'}
            No reply needed — just tap above to rate.
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
  textTransform: 'uppercase' as const, color: '#BF7B2E', margin: '0 0 8px',
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
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#a855f7', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
