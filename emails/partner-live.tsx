import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface PartnerLiveProps {
  partnerName: string
  courseName: string
  courseType: string
  holes: number
  location: string
  gimmelabRate: number
  slotsAdded: number
  slug: string
}

export default function PartnerLive({
  partnerName, courseName, courseType, holes, location,
  gimmelabRate, slotsAdded, slug,
}: PartnerLiveProps) {
  const firstName = partnerName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>{courseName || 'Your course'} is now live on Gimmelab</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>You're live</Text>
            <Text style={heroTitle}>Congratulations, {firstName}.</Text>
            <Text style={heroSub}>
              {courseName || 'Your course'} is now listed on Gimmelab. Members in your area can start booking immediately.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Course summary</Text>
            <Text style={detailRow}><strong>{courseName}</strong></Text>
            <Text style={detailRowSub}>
              {[courseType, holes ? `${holes} holes` : null, location].filter(Boolean).join(' · ')}
            </Text>
            <Section style={summaryBox}>
              <Text style={summaryRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Rate per slot</span>
                <span style={{ fontWeight: 700 }}>{gimmelabRate} credits (${gimmelabRate})</span>
              </Text>
              <Text style={summaryRow}>
                <span style={{ color: 'rgba(0,0,0,0.5)' }}>Slots added</span>
                <span style={{ fontWeight: 700 }}>{slotsAdded}</span>
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>What happens now</Text>
            <Text style={stepText}>
              <strong>Members discover you</strong> — golfers in your region will see your course when browsing.
            </Text>
            <Text style={stepText}>
              <strong>Bookings come in</strong> — you'll be notified when someone books a slot.
            </Text>
            <Text style={stepText}>
              <strong>Monthly payouts</strong> — earnings are settled to your bank account on the 1st of each month.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Share your listing</Text>
            <Text style={ctaLink}>gimmelab.com/courses/{slug}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Manage your course</Text>
            <Text style={ctaLink}>gimmelab.com/partner/dashboard</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Questions? Reply to this email anytime.{'\n'}
            We're here to help you succeed.
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
const stepText: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6', margin: '0 0 8px' }
const detailRow: React.CSSProperties = { fontSize: 16, color: '#111', margin: '0 0 4px' }
const detailRowSub: React.CSSProperties = { fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: '0 0 16px' }
const summaryBox: React.CSSProperties = {
  backgroundColor: '#fafafa', borderRadius: 4, padding: '12px 16px',
  border: '1px solid #f0f0f0',
}
const summaryRow: React.CSSProperties = {
  fontSize: 13, color: '#111', margin: '0 0 6px', display: 'flex' as const,
  justifyContent: 'space-between' as const,
}
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#BF7B2E', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
