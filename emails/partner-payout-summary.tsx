import {
  Body, Container, Head, Hr, Html, Preview,
  Section, Text,
} from '@react-email/components'

interface PartnerPayoutSummaryProps {
  partnerName: string
  courseName: string
  periodStart: string
  periodEnd: string
  totalBookings: number
  totalRevenue: string
  commissionRate: string
  commissionAmount: string
  payoutAmount: string
  payoutDate: string
  stripeConnected: boolean
}

export default function PartnerPayoutSummary({
  partnerName, courseName, periodStart, periodEnd,
  totalBookings, totalRevenue, commissionRate, commissionAmount,
  payoutAmount, payoutDate, stripeConnected,
}: PartnerPayoutSummaryProps) {
  const firstName = partnerName?.split(' ')[0] || 'there'

  return (
    <Html>
      <Head />
      <Preview>Your {periodStart}–{periodEnd} payout summary — {payoutAmount}</Preview>
      <Body style={body}>
        <Container style={container}>

          <Text style={wordmark}>GIMMELAB</Text>

          <Section style={hero}>
            <Text style={heroLabel}>Monthly payout</Text>
            <Text style={heroTitle}>{payoutAmount}</Text>
            <Text style={heroSub}>
              Your earnings for {periodStart} – {periodEnd} at {courseName}.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Earnings breakdown</Text>
            <Section style={detailBox}>
              <Text style={detailRow}>
                <span style={detailLabel}>Total bookings</span>
                <span style={detailValue}>{totalBookings}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Gross revenue</span>
                <span style={detailValue}>{totalRevenue}</span>
              </Text>
              <Text style={detailRow}>
                <span style={detailLabel}>Gimmelab commission ({commissionRate})</span>
                <span style={{ ...detailValue, color: 'rgba(0,0,0,0.45)' }}>−{commissionAmount}</span>
              </Text>
              <Text style={{ ...detailRow, borderBottom: 'none', paddingBottom: 0 }}>
                <span style={{ ...detailLabel, fontWeight: 700, color: '#111' }}>Your payout</span>
                <span style={{ ...detailValue, color: '#2E6B38', fontSize: 18 }}>{payoutAmount}</span>
              </Text>
            </Section>
          </Section>

          <Hr style={divider} />

          <Section style={{ padding: '20px 24px' }}>
            <Text style={sectionTitle}>Payout status</Text>
            {stripeConnected ? (
              <>
                <Text style={stepText}>
                  <span style={{ color: '#2E6B38', fontWeight: 700 }}>✓ Scheduled</span> — Your payout of {payoutAmount} will be deposited to your bank account on <strong>{payoutDate}</strong>.
                </Text>
                <Text style={stepText}>
                  Transfers are processed via Stripe Connect. You'll see it in your bank within 2–3 business days.
                </Text>
              </>
            ) : (
              <>
                <Text style={stepText}>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>⚠ On hold</span> — Your bank account is not connected. Connect via Stripe to receive this payout.
                </Text>
                <Text style={stepText}>
                  Your earnings are safe and will be released once you connect your account.
                </Text>
              </>
            )}
          </Section>

          <Hr style={divider} />

          {!stripeConnected && (
            <>
              <Section style={{ padding: '16px 24px', textAlign: 'center' as const }}>
                <Text style={ctaText}>Connect your bank</Text>
                <Text style={{ ...ctaLink, color: '#d97706' }}>gimmelab.com/partner/settings</Text>
              </Section>
              <Hr style={divider} />
            </>
          )}

          <Section style={{ padding: '16px 24px 24px', textAlign: 'center' as const }}>
            <Text style={ctaText}>View full payout history</Text>
            <Text style={ctaLink}>gimmelab.com/partner/payouts</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            This is your monthly earnings summary from Gimmelab.{'\n'}
            Questions about your payout? Reply to this email.
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
const ctaLink: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#BF7B2E', margin: 0 }
const footer: React.CSSProperties = {
  fontSize: 12, color: 'rgba(0,0,0,0.35)', textAlign: 'center' as const,
  padding: '16px 24px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' as const,
}
