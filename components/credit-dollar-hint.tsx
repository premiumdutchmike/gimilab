import { formatCreditsAsDollars, type PlanKey } from '@/lib/credits/pricing'

interface CreditDollarHintProps {
  credits: number
  plan?: PlanKey
}

export default function CreditDollarHint({ credits, plan = 'core' }: CreditDollarHintProps) {
  const label = plan.charAt(0).toUpperCase() + plan.slice(1)
  return (
    <div
      style={{
        fontSize: 11,
        fontFamily: 'var(--font-space-mono), monospace',
        color: '#847C72',
        letterSpacing: '0.05em',
        lineHeight: 1.4,
        marginTop: 4,
      }}
    >
      {`\u2248 ${formatCreditsAsDollars(credits, plan)} on ${label}`}
    </div>
  )
}
