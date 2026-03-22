import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text, Row, Column,
} from '@react-email/components'

interface BookingConfirmationProps {
  memberName: string
  courseName: string
  courseAddress: string
  date: string         // e.g. "Saturday, March 22, 2026"
  time: string         // e.g. "9:00 AM"
  players: number
  creditCost: number
  qrCode: string
}

export default function BookingConfirmation({
  memberName,
  courseName,
  courseAddress,
  date,
  time,
  players,
  creditCost,
  qrCode,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>You're booked at {courseName} on {date} at {time}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Wordmark */}
          <Text style={wordmark}>GIMMELAB</Text>

          {/* Hero */}
          <Section style={hero}>
            <Text style={heroLabel}>Booking confirmed</Text>
            <Text style={heroTitle}>{courseName}</Text>
            <Text style={heroSub}>{courseAddress}</Text>
          </Section>

          <Hr style={divider} />

          {/* Details */}
          <Section style={detailsSection}>
            <Row>
              <Column style={detailCol}>
                <Text style={detailLabel}>Date</Text>
                <Text style={detailValue}>{date}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>Tee time</Text>
                <Text style={detailValue}>{time}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Column style={detailCol}>
                <Text style={detailLabel}>Players</Text>
                <Text style={detailValue}>{players}</Text>
              </Column>
              <Column style={detailCol}>
                <Text style={detailLabel}>Credits used</Text>
                <Text style={detailValue}>{creditCost} cr</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* QR code info */}
          <Section style={{ padding: '0 24px 8px' }}>
            <Text style={detailLabel}>Check-in code</Text>
            <Text style={qrCodeText}>{qrCode}</Text>
            <Text style={helpText}>Show this code at the pro shop when you arrive.</Text>
          </Section>

          <Hr style={divider} />

          {/* Cancellation policy */}
          <Section style={{ padding: '8px 24px 24px' }}>
            <Text style={policyText}>
              Free cancellation up to 24 hours before your tee time. After that, no credits are refunded.
              Cancel anytime in your <strong>Rounds</strong> page.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            Hi {memberName} — enjoy your round.{'\n'}
            Questions? Reply to this email and we'll help.
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
  textTransform: 'uppercase', color: '#a855f7',
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

const detailsSection: React.CSSProperties = {
  padding: '20px 24px',
}

const detailCol: React.CSSProperties = {
  width: '50%',
}

const detailLabel: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
  margin: '0 0 4px',
}

const detailValue: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: '#111',
  margin: 0,
}

const qrCodeText: React.CSSProperties = {
  fontSize: 13, fontFamily: 'monospace',
  color: '#111', background: '#f5f5f5',
  padding: '8px 12px', borderRadius: 2,
  letterSpacing: '0.05em', margin: '4px 0',
}

const helpText: React.CSSProperties = {
  fontSize: 11, color: 'rgba(0,0,0,0.4)', margin: '4px 0 0',
}

const policyText: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: '1.6',
  margin: 0,
}

const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center', padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line',
}
