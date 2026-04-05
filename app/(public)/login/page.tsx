import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'
import { safeRedirect } from '@/lib/auth/redirect'

export const metadata: Metadata = {
  title: 'Sign In — gimmelab',
  description: 'Sign in to your gimmelab account to book tee times and manage your credits.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams
  return <AuthCard defaultTab="signin" redirectTo={safeRedirect(redirectTo) ?? undefined} />
}
