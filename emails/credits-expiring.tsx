import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface CreditsExpiringProps {
  memberName: string
  expiringCredits: number
  expirationDate: string
  currentBalance: number
  tier: string
  daysLeft: number
}

export default function CreditsExpiring({
  memberName, expiringCredits, expirationDate,
  currentBalance, tier, daysLeft,
}: CreditsExpiringProps) {
  const firstName = memberName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>{`${expiringCredits} credits expire in ${daysLeft} days — use them before ${expirationDate}`}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Credits expiring</Text>
            <Text style={heroTitle}>{expiringCredits} credits</Text>
            <Text style={heroSub}>
              {firstName}, you have {expiringCredits} credits expiring on {expirationDate}. That's {daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}. Book a round to use them.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Your credits</Text>
            <Section style={detailBox}>
              <Text style={detailRow}>
                <span style={detailLabel}>Current balance</span>
                <span style={detailValue}>{currentBalance} credits</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Expiring on {expirationDate}</span>
                <span style={{ ...detailValue, color: '#d97706' }}>{expiringCredits} credits</span>
              </Text>
              <Text style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <span style={detailLabel}>After expiry</span>
                <span style={detailValue}>{currentBalance - expiringCredits} credits</span>
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>How to keep them</Text>
            <Text style={stepText}>
              <strong>Book a tee time</strong> — browse available courses and book a round before {expirationDate}. Each booking uses credits immediately, so they won't expire.
            </Text>
            {tier === 'casual' && (
              <Text style={stepText}>
                <strong>Upgrade to Core or Heavy</strong> — higher tiers include credit rollover so unused credits carry forward to next month.
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Browse courses and book</Text>
            <Text style={ctaLink}>gimmelab.com/courses</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Credits expire at the end of your billing cycle.{'\n'}
            View your credit history at gimmelab.com/credits.
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
  textTransform: 'uppercase' as const, color: '#d97706', margin: '0 0 8px',
}
const heroTitle: React.CSSProperties = {
  fontSize: 40, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', margin: '0 0 10px',
}
const heroSub: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: '1.6', margin: 0 }
const divider: React.CSSProperties = { borderColor: '#f0f0f0', margin: 0 }
const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase' as const, color: 'rgba(0,0,0,0.35)', margin: '0 0 14px',
}
const stepText: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.6)', lineHeight: '1.6', margin: '0 0 8px' }
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
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#a855f7', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
