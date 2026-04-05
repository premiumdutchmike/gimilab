'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

/**
 * Fires ttgp_* analytics events for the /vs-teetimegolfpass page.
 * - ttgp_page_viewed: on mount (once)
 * - ttgp_table_scrolled: IntersectionObserver on [data-vs-table]
 * - ttgp_cta_clicked: event delegation on [data-vs-cta]
 * - ttgp_faq_opened: delegated to <details data-vs-faq>
 * Note: ttgp_math_adjusted is fired from math-block.tsx directly (it owns the state).
 */
export default function VsAnalytics() {
  useEffect(() => {
    if (!posthog.__loaded) return

    // Page view
    posthog.capture('ttgp_page_viewed', {
      source: typeof document !== 'undefined' ? document.referrer || null : null,
    })

    // Table scroll observer
    const table = document.querySelector('[data-vs-table]')
    let tableFired = false
    let observer: IntersectionObserver | null = null
    if (table) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && !tableFired) {
              tableFired = true
              posthog.capture('ttgp_table_scrolled')
              observer?.disconnect()
            }
          }
        },
        { threshold: 0.3 }
      )
      observer.observe(table)
    }

    // CTA click delegation
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      const cta = target?.closest('[data-vs-cta]') as HTMLElement | null
      if (cta) {
        posthog.capture('ttgp_cta_clicked', {
          cta_type: cta.getAttribute('data-vs-cta'),
        })
      }
    }
    document.addEventListener('click', onClick)

    // FAQ open delegation
    function onToggle(e: Event) {
      const el = e.target as HTMLDetailsElement
      if (el.matches('[data-vs-faq]') && el.open) {
        const q = el.querySelector('[data-vs-faq-q]')?.textContent?.trim() || ''
        posthog.capture('ttgp_faq_opened', { question: q })
      }
    }
    document.addEventListener('toggle', onToggle, true)

    return () => {
      observer?.disconnect()
      document.removeEventListener('click', onClick)
      document.removeEventListener('toggle', onToggle, true)
    }
  }, [])

  return null
}
