import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

export const metadata = { title: 'Sign In — OneGolf' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to your OneGolf account</p>
        </div>

        <LoginForm />

        <p className="text-center text-white/40 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/pricing" className="text-white/70 hover:text-white underline">
            Get started
          </Link>
        </p>
      </div>
    </main>
  )
}
