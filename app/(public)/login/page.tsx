import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'

export const metadata: Metadata = {
  title: 'Sign In — gimmelab',
  description: 'Sign in to your gimmelab account to book tee times and manage your credits.',
}

export default function LoginPage() {
  return <AuthCard defaultTab="signin" />
}
