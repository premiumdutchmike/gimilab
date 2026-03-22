import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPartnerByUserId, getPartnerCourse, getPartnerBlocks } from '@/lib/partner/queries'
import BaseRateEditor from './base-rate-editor'
import BlockOverrideEditor from './block-override-editor'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pricing — Gimmelab Partner' }

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDays(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.length === 7) return 'Every day'
  if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays'
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) return 'Weekends'
  return sorted.map(d => DAY_LABELS[d]).join(', ')
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`
}

export default async function PartnerPricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/partner/dashboard')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course')

  const blocks = await getPartnerBlocks(partner.id)
  const activeBlocks = blocks.filter(b => b.isActive)

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>
        Pricing
      </h1>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
        Set your base credit rate and per-block overrides. Changes apply to newly generated slots.
      </p>

      {/* Base rate */}
      <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '24px', marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          Base rate
        </p>
        <BaseRateEditor
          courseId={course.id}
          initialRate={course.baseCreditCost}
          floor={course.creditFloor ?? null}
          ceiling={course.creditCeiling ?? null}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 12, lineHeight: 1.6 }}>
          Applied to all tee time slots unless a block override is set below.
          1 credit = $1.00 member value · your payout is {course.payoutRate ? `${Math.round(Number(course.payoutRate) * 100)}%` : '70%'} per credit.
        </p>
      </div>

      {/* Block overrides */}
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Block overrides
      </p>

      {activeBlocks.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>No inventory blocks set up yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            Add blocks in <a href="/partner/inventory" style={{ color: '#38bdf8', textDecoration: 'none' }}>Inventory</a> to set per-block pricing.
          </p>
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 160px 120px 220px',
            padding: '10px 20px', borderBottom: '1px solid #1f1f1f',
          }}>
            {['Days', 'Time', 'Base rate', 'Override'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                {h}
              </span>
            ))}
          </div>

          {activeBlocks.map((block, i) => (
            <div key={block.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 120px 220px',
              padding: '14px 20px', alignItems: 'center',
              borderBottom: i < activeBlocks.length - 1 ? '1px solid #1f1f1f' : 'none',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {formatDays(block.dayOfWeek)}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {formatTime(block.startTime)} – {formatTime(block.endTime)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                {course.baseCreditCost} cr
              </span>
              <BlockOverrideEditor
                blockId={block.id}
                initialOverride={block.creditOverride ?? null}
                baseRate={course.baseCreditCost}
              />
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 24,
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)',
        padding: '14px 20px',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>How overrides work: </span>
          When a block has a credit override, all slots generated from that block use that cost instead of the base rate.
          Useful for peak/off-peak pricing (e.g. weekends cost more, early morning less).
          Changes only affect <em>newly generated</em> slots — existing booked slots are unaffected.
        </p>
      </div>
    </div>
  )
}
