import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface CreditsSummaryProps {
  memberName: string
  currentBalance: number
  tier: string
  creditsUsedThisCycle: number
  creditsGrantedThisCycle: number
  roundsPlayed: number
  nextRefreshDate: string
  topCourse?: string
}

export default function CreditsSummary({
  memberName, currentBalance, tier, creditsUsedThisCycle,
  creditsGrantedThisCycle, roundsPlayed, nextRefreshDate, topCourse,
}: CreditsSummaryProps) {
  const firstName = memberName?.split(' ')[0] || 'there'
  const usagePct = creditsGrantedThisCycle > 0
    ? Math.round((creditsUsedThisCycle / creditsGrantedThisCycle) * 100)
    : 0

  return (
    <Html>
      <Head />
      <Preview>{`You have ${currentBalance} credits — here's your bi-weekly update`}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>{tier} member</Text>
            <Text style={heroTitle}>{currentBalance} credits</Text>
            <Text style={heroSub}>
              Here's where you stand, {firstName}. Your credits refresh on {nextRefreshDate}.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>This billing cycle</Text>

            {/* Usage bar */}
            <div style={{
              background: '#f0f0f0', borderRadius: 4, height: 8,
              overflow: 'hidden', marginBottom: 16,
            }}>
              <div style={{
                background: usagePct > 80 ? '#d97706' : '#a855f7',
                height: '100%', width: `${Math.min(usagePct, 100)}%`,
                borderRadius: 4, transition: 'width 0.3s',
              }} />
            </div>

            <Section style={detailBox}>
              <Text style={detailRow}>
                <span style={detailLabelStyle}>Credits granted</span>
                <span style={detailValueStyle}>{creditsGrantedThisCycle}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabelStyle}>Credits used</span>
                <span style={detailValueStyle}>{creditsUsedThisCycle}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabelStyle}>Remaining</span>
                <span style={{ ...detailValueStyle, color: currentBalance < 20 ? '#d97706' : '#111' }}>
                  {currentBalance}
                </span>
              </Text>
              <Text style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <span style={detailLabelStyle}>Rounds played</span>
                <span style={detailValueStyle}>{roundsPlayed}</span>
              </Text>
            </Section>
          </Section>

          {topCourse && (
            <>
              <Hr style={divider} />
              <Section style={{ padding: '16px 24px' }}>
                <Text style={sectionTitle}>Your most-played course</Text>
                <Text style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>
                  {topCourse}
                </Text>
              </Section>
            </>
          )}

          {currentBalance < 30 && (
            <>
              <Hr style={divider} />
              <Section style={{ padding: '16px 24px' }}>
                <Section style={alertBox}>
                  <Text style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: '1.6' }}>
                    <strong>Running low.</strong> You have {currentBalance} credits left this cycle. Credits refresh on {nextRefreshDate}, or you can top up anytime.
                  </Text>
                </Section>
              </Section>
            </>
          )}

          <Hr style={divider} />

          <Section style={{ padding: '16px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>Browse courses and book</Text>
            <Text style={ctaLink}>gimmelab.com/courses</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This is your bi-weekly credit summary from Gimmelab.{'\n'}
            View your full credit history at gimmelab.com/credits.
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
  textTransform: 'uppercase' as const, color: '#a855f7', margin: '0 0 8px',
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
const detailBox: React.CSSProperties = {
  backgroundColor: '#fafafa', borderRadius: 4, padding: '4px 18px', border: '1px solid #f0f0f0',
}
const detailRow: React.CSSProperties = {
  fontSize: 13, color: '#111', margin: 0, display: 'flex' as const,
  justifyContent: 'space-between' as const, padding: '10px 0',
  borderBottom: '1px solid #f0f0f0',
}
const detailLabelStyle: React.CSSProperties = { color: 'rgba(0,0,0,0.5)' }
const detailValueStyle: React.CSSProperties = { fontWeight: 600 }
const alertBox: React.CSSProperties = {
  backgroundColor: '#fffbeb', borderRadius: 4, padding: '14px 18px',
  border: '1px solid #fde68a',
}
const ctaText: React.CSSProperties = { fontSize: 14, color: 'rgba(0,0,0,0.5)', margin: '0 0 6px' }
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#a855f7', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
