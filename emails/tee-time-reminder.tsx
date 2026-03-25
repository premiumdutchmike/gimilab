import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface TeeTimeReminderProps {
  memberName: string
  courseName: string
  courseAddress: string
  date: string
  time: string
  players: number
  creditCost: number
  qrCode?: string
}

export default function TeeTimeReminder({
  memberName, courseName, courseAddress, date, time, players, creditCost,
}: TeeTimeReminderProps) {
  const firstName = memberName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>Tee time tomorrow at {courseName} — {time}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Tomorrow</Text>
            <Text style={heroTitle}>You're up, {firstName}.</Text>
            <Text style={heroSub}>
              Quick reminder — your tee time is tomorrow. Here are the details.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Booking details</Text>
            <Section style={detailBox}>
              <Text style={detailLabel}>Course</Text>
              <Text style={detailValue}>{courseName}</Text>
              <Text style={detailSub}>{courseAddress}</Text>

              <Hr style={{ borderColor: '#f0f0f0', margin: '12px 0' }} />

              <Section style={{ display: 'flex' as const, gap: '16px' }}>
                <Section>
                  <Text style={detailLabel}>Date</Text>
                  <Text style={detailValue}>{date}</Text>
                </Section>
                <Section>
                  <Text style={detailLabel}>Tee time</Text>
                  <Text style={detailValue}>{time}</Text>
                </Section>
              </Section>

              <Hr style={{ borderColor: '#f0f0f0', margin: '12px 0' }} />

              <Section style={{ display: 'flex' as const, gap: '16px' }}>
                <Section>
                  <Text style={detailLabel}>Players</Text>
                  <Text style={detailValue}>{players}</Text>
                </Section>
                <Section>
                  <Text style={detailLabel}>Credits used</Text>
                  <Text style={detailValue}>{creditCost}</Text>
                </Section>
              </Section>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Check-in</Text>
            <Text style={stepText}>
              Show your <strong>QR code</strong> at the pro shop when you arrive. Open it from your bookings page.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>View your booking</Text>
            <Text style={ctaLink}>gimmelab.com/dashboard</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Need to cancel? You can cancel up to 2 hours before your tee time{'\n'}
            for a full credit refund at gimmelab.com/dashboard.
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
const detailBox: React.CSSProperties = {
  backgroundColor: '#fafafa', borderRadius: 4, padding: '16px 20px', border: '1px solid #f0f0f0',
}
const detailLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.35)', margin: '0 0 4px',
}
const detailValue: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#111', margin: '0 0 2px' }
const detailSub: React.CSSProperties = { fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: 0 }
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#a855f7', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
