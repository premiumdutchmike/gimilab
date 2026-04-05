export const PLAN_COST_PER_CREDIT = {
  casual: 0.99,
  core: 149 / 170, // compute so we never drift from CLAUDE.md
  heavy: 199 / 250,
} as const

export type PlanKey = keyof typeof PLAN_COST_PER_CREDIT

export function creditsToDollars(credits: number, plan: PlanKey): number {
  return credits * PLAN_COST_PER_CREDIT[plan]
}

export function formatCreditsAsDollars(credits: number, plan: PlanKey): string {
  const dollars = creditsToDollars(credits, plan)
  return `$${Math.round(dollars)}`
}
