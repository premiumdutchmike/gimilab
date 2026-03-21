import type { Metadata } from 'next'
import { AuthCard } from '@/components/auth-card'

export const metadata: Metadata = {
  title: 'Sign In — gimilab',
  description: 'Sign in to your gimilab account to book tee times and manage your credits.',
}

export default function LoginPage() {
  return <AuthCard defaultTab="signin" />
}
