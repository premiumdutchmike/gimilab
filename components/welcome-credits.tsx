'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WelcomeCreditsProps {
  userId: string
  firstName: string
  tierName: string
  expectedCredits: number
}

export function WelcomeCredits({ userId, firstName, tierName, expectedCredits }: WelcomeCreditsProps) {
  const [credits, setCredits] = useState<number | null>(null)
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (credits !== null && credits > 0) return
    if (attempts >= 5) return // 5 attempts × 2s = 10s max

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/credits/balance')
        const data = await res.json()
        setCredits(data.balance ?? 0)
        setAttempts((a) => a + 1)
      } catch {
        setAttempts((a) => a + 1)
      }
    }, attempts === 0 ? 500 : 2000)

    return () => clearTimeout(timer)
  }, [credits, attempts, userId])

  // Set welcomed cookie so back-navigation redirects to dashboard
  useEffect(() => {
    document.cookie = 'gimmelab-welcomed=1; path=/; max-age=31536000; samesite=lax'
  }, [])

  const displayCredits = credits ?? '…'
  const isLoaded = credits !== null && credits > 0
  const isDelayed = attempts >= 5 && !isLoaded

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-6xl mb-4">⛳</div>
      <h1 className="text-3xl font-bold text-white mb-2">
        You&apos;re in{firstName ? `, ${firstName}` : ''}!
      </h1>

      <div className="my-6 flex flex-col items-center gap-1">
        <span className="text-6xl font-bold text-green-400">{displayCredits}</span>
        <span className="text-white/50">credits in your wallet</span>
        {isDelayed && (
          <span className="text-white/30 text-sm mt-1">
            Still processing…{' '}
            <button
              onClick={() => { setAttempts(0); setCredits(null) }}
              className="underline hover:text-white/50"
            >
              refresh
            </button>
          </span>
        )}
      </div>

      <div className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-4 mb-6 text-left">
        <p className="text-green-400 text-sm font-semibold mb-1">How credits work</p>
        <p className="text-white/50 text-sm leading-relaxed">
          Each tee time costs credits based on the course, time, and demand.
          Unused credits roll over each month — {tierName} members keep up to{' '}
          {tierName === 'Casual' ? '50' : tierName === 'Core' ? '75' : '105'}.
        </p>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full max-w-xs rounded-xl bg-green-400 hover:bg-green-300 text-black font-semibold py-3 transition-colors"
      >
        Start Booking →
      </button>
    </div>
  )
}
