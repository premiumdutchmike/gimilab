import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'

export const metadata: Metadata = {
  title: 'Create Account — gimmelab',
  description: 'Join gimmelab and start booking tee times at top courses with monthly credits.',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams

  return <AuthCard defaultTab="signup" plan={plan} />
}
