export interface TemplateVars {
  gmName: string | null
  courseName: string
  estimatedMonthlyEarn: number | null
  hook: string | null
  rackRateAvg: number | null
}

export const TOUCH_TEMPLATES = {
  1: {
    subjectHint: 'Reference their off-peak tee times specifically',
    bodyHint: `Introduce Gimmelab in 3 short paragraphs:
1. Hook: what happens to their empty tee times (reference the course by name, use the hook if provided)
2. What Gimmelab does: subscription platform for Philly-area golfers, they list only the slots they want, set their own rate, we handle bookings and pay them monthly
3. CTA: ask for a 15-minute call. Sign off with "Gimmelab · gimmelab.com"
Keep it under 120 words. No bullet points. No jargon. Plain text.`,
  },
  2: {
    subjectHint: 'Lead with a specific earnings number for their course',
    bodyHint: `Follow up on the first email. Three short paragraphs:
1. Brief follow-up reference
2. Earnings math: if estimated_monthly_earn is available, use it. Otherwise use "30 off-peak slots at [rack rate avg] per round"
3. Mention the discount tier model: the more they discount off rack rate, the higher their commission (10% off → keep 85%, 30%+ off → keep 90%). CTA: short call this week.
Keep it under 100 words. Plain text.`,
  },
  3: {
    subjectHint: '"Last note on this — then I\'ll leave you alone"',
    bodyHint: `Final touch. Three short paragraphs:
1. Acknowledge you've reached out twice, no pressure if timing is wrong
2. Quick value reminder: no setup fee, no monthly cost, pull slots any time, onboarding is 20 minutes
3. Referral ask: if they know another course manager in the area who struggles with off-peak bookings, you'd appreciate an intro.
Keep it under 90 words. Plain text.`,
  },
}
