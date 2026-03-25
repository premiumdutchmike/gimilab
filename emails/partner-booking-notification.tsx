import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface PartnerBookingNotificationProps {
  partnerName: string
  memberName: string
  courseName: string
  date: string
  time: string
  players: number
  creditCost: number
  partnerEarnings: string
  totalBookingsToday: number
}

export default function PartnerBookingNotification({
  partnerName, memberName, courseName, date, time,
  players, creditCost, partnerEarnings, totalBookingsToday,
}: PartnerBookingNotificationProps) {
  const firstName = partnerName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>New booking at {courseName} — {date} at {time}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>New booking</Text>
            <Text style={heroTitle}>Someone just booked.</Text>
            <Text style={heroSub}>
              A member booked a tee time at {courseName}. Here are the details.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Booking details</Text>
            <Section style={detailBox}>
              <Text style={detailRow}>
                <span style={detailLabel}>Member</span>
                <span style={detailValue}>{memberName}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Date</span>
                <span style={detailValue}>{date}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Tee time</span>
                <span style={detailValue}>{time}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Players</span>
                <span style={detailValue}>{players}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Credits charged</span>
                <span style={detailValue}>{creditCost} credits</span>
              </Text>
              <Text style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <span style={detailLabel}>Your earnings</span>
                <span style={{ ...detailValue, color: '#2E6B38', fontWeight: 700 }}>{partnerEarnings}</span>
              </Text>
            </Section>
          </Section>

          {totalBookingsToday > 1 && (
            <>
              <Hr style={divider} />
              <Section style={{ padding: '16px 24px' }}>
                <Text style={statText}>
                  You have <strong>{totalBookingsToday} bookings</strong> today.
                </Text>
              </Section>
            </>
          )}

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>View all bookings</Text>
            <Text style={ctaLink}>gimmelab.com/partner/bookings</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            You're receiving this because a member booked at your course.{'\n'}
            Manage notifications at gimmelab.com/partner/settings.
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
  textTransform: 'uppercase' as const, color: '#2E6B38', margin: '0 0 8px',
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
const detailBox: React.CSSProperties = {
  backgroundColor: '#fafafa', borderRadius: 4, padding: '4px 18px', border: '1px solid #f0f0f0',
}
const detailRow: React.CSSProperties = {
  fontSize: 13, color: '#111', margin: 0, display: 'flex' as const,
  justifyContent: 'space-between' as const, padding: '10px 0',
  borderBottom: '1px solid #f0f0f0',
}
const detailLabel: React.CSSProperties = { color: 'rgba(0,0,0,0.5)' }
const detailValue: React.CSSProperties = { fontWeight: 600 }
const statText: React.CSSProperties = {
  fontSize: 13, color: 'rgba(0,0,0,0.6)', textAlign: 'center' as const, margin: 0,
}
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#BF7B2E', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
