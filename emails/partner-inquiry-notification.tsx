import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface Props {
  name: string
  title?: string
  courseName: string
  email: string
  phone?: string
  message?: string
}

export default function PartnerInquiryNotification({
  name, title, courseName, email, phone, message,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New partner inquiry from {name} at {courseName}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB — INTERNAL</Text>

          <Section style={hero}>
            <Text style={heroLabel}>New partner inquiry</Text>
            <Text style={heroTitle}>{courseName}</Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={label}>Contact</Text>
            <Text style={value}>{name}{title ? ` — ${title}` : ''}</Text>

            <Text style={{ ...label, marginTop: 12 }}>Email</Text>
            <Text style={value}>{email}</Text>

            {phone && (
              <>
                <Text style={{ ...label, marginTop: 12 }}>Phone</Text>
                <Text style={value}>{phone}</Text>
              </>
            )}

            {message && (
              <>
                <Text style={{ ...label, marginTop: 12 }}>Message</Text>
                <Text style={{ ...value, fontWeight: 400, color: 'rgba(0,0,0,0.6)' }}>{message}</Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px', textAlign: 'center' }}>
            <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: '0 0 4px' }}>
              Respond within one business day.
            </Text>
            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', margin: 0 }}>
              This inquiry has been saved to the partner_inquiries table.
            </Text>
          </Section>

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
  color: '#111', textAlign: 'center', padding: '20px 24px 0', margin: 0,
}
const hero: React.CSSProperties = { padding: '20px 24px 24px', textAlign: 'center' }
const heroLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#f59e0b', margin: '0 0 8px',
}
const heroTitle: React.CSSProperties = {
  fontSize: 24, fontWeight: 900, color: '#111', letterSpacing: '-0.02em', margin: 0,
}
const divider: React.CSSProperties = { borderColor: '#f0f0f0', margin: 0 }
const label: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', margin: '0 0 4px',
}
const value: React.CSSProperties = {
  fontSize: 15, fontWeight: 700, color: '#111', margin: 0,
}
