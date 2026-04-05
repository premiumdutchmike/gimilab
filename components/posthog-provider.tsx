'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
    if (!key) return
    if (posthog.__loaded) return
    posthog.init(key, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: false, // we capture manually on route change
      capture_pageleave: true,
      person_profiles: 'identified_only',
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewCapture />
      </Suspense>
      {children}
    </PHProvider>
  )
}

function PageViewCapture() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    if (!posthog.__loaded) return
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}
