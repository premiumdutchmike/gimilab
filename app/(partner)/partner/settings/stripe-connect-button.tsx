'use client'

import { useState, useTransition } from 'react'
import { initiateStripeConnect } from '@/actions/partner'

export default function StripeConnectButton({ label }: { label: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await initiateStripeConnect()
      if (result.error) { setError(result.error); return }
      if (result.url) window.location.href = result.url
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          background: '#635BFF', border: 'none', borderRadius: 4,
          padding: '13px 28px', cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.04em', color: '#fff',
          transition: 'opacity 0.15s',
        }}
      >
        {/* Stripe "S" mark */}
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <path d="M15.04 12.56c0-1.12.92-1.56 2.44-1.56 2.18 0 4.94.66 7.12 1.84V6.62C22.14 5.62 19.74 5 17.48 5 11.6 5 7.6 8.04 7.6 12.86c0 7.44 10.24 6.24 10.24 9.44 0 1.32-1.14 1.74-2.74 1.74-2.38 0-5.42-.98-7.82-2.3v6.32c2.66 1.14 5.34 1.62 7.82 1.62 6.02 0 10.18-2.98 10.18-7.86-.02-8.04-10.24-6.58-10.24-9.26z" fill="white"/>
        </svg>
        {isPending ? 'Redirecting to Stripe…' : label}
      </button>
      {error && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#f87171' }}>{error}</p>
      )}
    </div>
  )
}
