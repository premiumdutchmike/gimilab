import { Suspense } from 'react'
import Link from 'next/link'
import { SignupForm } from '@/components/signup-form'

const TIER_LABELS: Record<string, { name: string; price: string }> = {
  casual: { name: 'Casual', price: '$99/mo' },
  core: { name: 'Core', price: '$149/mo' },
  heavy: { name: 'Heavy', price: '$199/mo' },
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan = 'core' } = await searchParams
  const tier = TIER_LABELS[plan] ?? TIER_LABELS.core

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#090f1a' }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-sm text-green-400 mb-4">
            {tier.name} · {tier.price}
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-white/50 text-sm mt-1">Start booking tee times with credits</p>
        </div>

        <Suspense>
          <SignupForm />
        </Suspense>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-white/70 hover:text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
