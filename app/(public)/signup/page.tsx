import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'
import { safeRedirect } from '@/lib/auth/redirect'

export const metadata: Metadata = {
  title: 'Create Account — gimmelab',
  description: 'Join gimmelab and start booking tee times at top courses with monthly credits.',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; redirectTo?: string }>
}) {
  const { plan, redirectTo } = await searchParams

  return (
    <AuthCard
      defaultTab="signup"
      plan={plan}
      redirectTo={safeRedirect(redirectTo) ?? undefined}
    />
  )
}
