import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text, Row, Column,
} from '@react-email/components'

interface BookingCancellationProps {
  memberName: string
  courseName: string
  date: string
  time: string
  creditsRefunded: number
}

export default function BookingCancellation({
  memberName,
  courseName,
  date,
  time,
  creditsRefunded,
}: BookingCancellationProps) {
  return (
    <Html>
      <Head />
      <Preview>Booking cancelled — {courseName} on {date}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Booking cancelled</Text>
            <Text style={heroTitle}>{courseName}</Text>
            <Text style={heroSub}>{date} at {time}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            {creditsRefunded > 0 ? (
              <>
                <Text style={refundTitle}>{creditsRefunded} credits refunded</Text>
                <Text style={refundSub}>
                  Credits have been returned to your account and are available to use on your next booking.
                </Text>
              </>
            ) : (
              <>
                <Text style={noRefundTitle}>No refund issued</Text>
                <Text style={refundSub}>
                  Cancellations within 24 hours of the tee time are not eligible for a credit refund.
                </Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Hi {memberName} — sorry to see you go.{'\n'}
            Book your next round at gimmelab.com.
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
  textTransform: 'uppercase', color: '#d97706',
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

const refundTitle: React.CSSProperties = {
  fontSize: 18, fontWeight: 900, color: '#16a34a',
  letterSpacing: '-0.02em', margin: '0 0 6px',
}

const noRefundTitle: React.CSSProperties = {
  fontSize: 18, fontWeight: 900, color: '#111',
  letterSpacing: '-0.02em', margin: '0 0 6px',
}

const refundSub: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: '1.6', margin: 0,
}

const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)',
  textAlign: 'center', padding: '16px 24px',
  lineHeight: '1.6', margin: 0,
  whiteSpace: 'pre-line',
}
