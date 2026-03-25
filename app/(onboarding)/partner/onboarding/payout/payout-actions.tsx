'use client'
import { useTransition } from 'react'
import { initiateStripeConnect, skipStripeConnect } from '@/actions/partner/connect-stripe'

export function PayoutActions() {
  const [pending, startTransition] = useTransition()

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => initiateStripeConnect())}
        style={{
          background: pending ? '#A8621E' : '#BF7B2E',
          color: '#fff',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '14px 28px', border: 'none', borderRadius: 2,
          cursor: pending ? 'not-allowed' : 'pointer',
          width: '100%', maxWidth: 380,
          transition: 'background 0.15s',
        }}
      >
        Connect Bank Account →
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => skipStripeConnect())}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#847C72', textDecoration: 'underline',
          padding: '4px 0',
        }}
      >
        Skip for now — I'll connect later
      </button>
    </div>
  )
}
