'use client'
import { useState } from 'react'
import { motion } from 'motion/react'

export function LiveScreen({
  courseName,
  courseType,
  holes,
  location,
  gimmelabRate,
  slotCount,
  stripeConnected,
  slug,
}: {
  courseName: string
  courseType: string
  holes: number
  location: string
  gimmelabRate: number
  slotCount: number
  stripeConnected: boolean
  slug: string
}) {
  const [copied, setCopied] = useState(false)
  const listingUrl = `gimmelab.com/courses/${slug}`

  function copyLink() {
    navigator.clipboard.writeText(`https://${listingUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0C0C0B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px 80px',
    }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(191,123,46,0.15)',
            border: '2px solid #BF7B2E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            fontSize: 36, color: '#BF7B2E',
          }}
        >
          ✓
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{
            fontSize: 40, fontWeight: 700, letterSpacing: '-0.025em',
            color: '#F4EEE3', marginBottom: 16,
          }}
        >
          You're live.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{
            fontSize: 15, color: '#847C72', lineHeight: 1.6,
            marginBottom: 40, maxWidth: 400, margin: '0 auto 40px',
          }}
        >
          Your course is now listed on Gimmelab. Members in your area can book
          available slots immediately.
        </motion.p>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          style={{
            background: '#1E1D1B',
            border: '1px solid rgba(229,221,211,0.1)',
            borderTop: '2px solid #BF7B2E',
            borderRadius: 2,
            padding: '24px 28px',
            marginBottom: 28,
            textAlign: 'left',
          }}
        >
          {courseName && (
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F4EEE3', marginBottom: 4 }}>
              {courseName}
            </p>
          )}
          <p style={{ fontSize: 13, color: '#847C72', marginBottom: 20 }}>
            {[courseType, holes ? `${holes} holes` : null, location].filter(Boolean).join(' · ')}
          </p>

          {[
            { label: 'Rate per slot', value: gimmelabRate ? `${gimmelabRate} credits ($${gimmelabRate})` : '—' },
            { label: 'Slots added', value: String(slotCount || 0) },
            {
              label: 'Payout account',
              value: stripeConnected ? '✓ Connected' : '⚠ Pending',
              valueColor: stripeConnected ? '#2E6B38' : '#BF7B2E',
            },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0',
              borderTop: '1px solid rgba(229,221,211,0.08)',
            }}>
              <span style={{ fontSize: 13, color: '#847C72' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: row.valueColor ?? '#F4EEE3' }}>
                {row.value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}
        >
          <a href="/partner/dashboard" style={{
            display: 'block',
            width: '100%',
            background: '#BF7B2E',
            color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '14px 28px', borderRadius: 2, textDecoration: 'none', textAlign: 'center',
          }}>
            Open Dashboard →
          </a>

          {slug && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#847C72', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Share your listing
              </span>
              <button
                type="button"
                onClick={copyLink}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(229,221,211,0.05)',
                  border: '1px solid rgba(229,221,211,0.1)',
                  borderRadius: 2,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  color: copied ? '#2E6B38' : '#847C72',
                  fontSize: 13,
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {listingUrl}
                <span style={{ fontSize: 15 }}>{copied ? '✓' : '📋'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
