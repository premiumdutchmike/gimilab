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

      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F4EEE3', letterSpacing: '-0.03em', marginBottom: 8 }}>
        Pricing
      </h1>
      <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.4)', marginBottom: 32 }}>
        Set your base credit rate and per-block overrides. Changes apply to newly generated slots.
      </p>

      {/* Base rate */}
      <div style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '24px', marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 16 }}>
          Base rate
        </p>
        <BaseRateEditor
          courseId={course.id}
          initialRate={course.baseCreditCost}
          floor={course.creditFloor ?? null}
          ceiling={course.creditCeiling ?? null}
        />
        <p style={{ fontSize: 11, color: 'rgba(244,238,227,0.3)', marginTop: 12, lineHeight: 1.6 }}>
          Applied to all tee time slots unless a block override is set below.
          1 credit = $1.00 member value · your payout is {course.payoutRate ? `${Math.round(Number(course.payoutRate) * 100)}%` : '70%'} per credit.
        </p>
      </div>

      {/* Block overrides */}
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.35)', marginBottom: 12 }}>
        Block overrides
      </p>

      {activeBlocks.length === 0 ? (
        <div style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(244,238,227,0.35)', marginBottom: 6 }}>No inventory blocks set up yet.</p>
          <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.25)' }}>
            Add blocks in <a href="/partner/inventory" style={{ color: '#BF7B2E', textDecoration: 'none' }}>Inventory</a> to set per-block pricing.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="p-pri-desktop" style={{ background: '#1E1D1B', border: '1px solid rgba(244,238,227,0.08)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 120px 220px',
              padding: '10px 20px', borderBottom: '1px solid rgba(244,238,227,0.08)',
            }}>
              {['Days', 'Time', 'Base rate', 'Override'].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,238,227,0.3)' }}>
                  {h}
                </span>
              ))}
            </div>

            {activeBlocks.map((block, i) => (
              <div key={block.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 120px 220px',
                padding: '14px 20px', alignItems: 'center',
                borderBottom: i < activeBlocks.length - 1 ? '1px solid rgba(244,238,227,0.08)' : 'none',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F4EEE3' }}>
                  {formatDays(block.dayOfWeek)}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.5)' }}>
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(244,238,227,0.4)' }}>
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

          {/* Mobile card list */}
          <div className="p-pri-cards">
            {activeBlocks.map((block) => (
              <div key={block.id} className="p-pri-card">
                <div className="p-pri-card-primary">{formatDays(block.dayOfWeek)}</div>
                <div className="p-pri-card-row">
                  <span className="p-pri-card-label">Time</span>
                  <span className="p-pri-card-value">{formatTime(block.startTime)} – {formatTime(block.endTime)}</span>
                </div>
                <div className="p-pri-card-row">
                  <span className="p-pri-card-label">Base rate</span>
                  <span className="p-pri-card-value" style={{ color: 'rgba(244,238,227,0.5)' }}>{course.baseCreditCost} cr</span>
                </div>
                <div className="p-pri-card-override">
                  <span className="p-pri-card-label" style={{ marginBottom: 6, display: 'block' }}>Override</span>
                  <BlockOverrideEditor
                    blockId={block.id}
                    initialOverride={block.creditOverride ?? null}
                    baseRate={course.baseCreditCost}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .p-pri-cards { display: none; }
        @media (max-width: 899px) {
          .p-pri-desktop { display: none !important; }
          .p-pri-cards {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .p-pri-card {
            background: #1E1D1B;
            border: 1px solid rgba(244,238,227,0.08);
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .p-pri-card-primary {
            font-size: 15px;
            font-weight: 700;
            color: #F4EEE3;
            letter-spacing: -0.01em;
          }
          .p-pri-card-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
          }
          .p-pri-card-label {
            font-size: 11px;
            color: #847C72;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
          }
          .p-pri-card-value {
            font-size: 13px;
            color: #F4EEE3;
            font-weight: 600;
          }
          .p-pri-card-override {
            padding-top: 4px;
            border-top: 1px solid rgba(244,238,227,0.05);
            margin-top: 2px;
          }
        }
        @media (max-width: 640px) {
          .p-pri-card { padding: 16px; }
        }
      `}</style>

      {/* Info box */}
      <div style={{
        marginTop: 24,
        background: 'rgba(191,123,46,0.05)', border: '1px solid rgba(191,123,46,0.15)',
        padding: '14px 20px',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(244,238,227,0.4)', lineHeight: 1.6 }}>
          <span style={{ color: '#BF7B2E', fontWeight: 700 }}>How overrides work: </span>
          When a block has a credit override, all slots generated from that block use that cost instead of the base rate.
          Useful for peak/off-peak pricing (e.g. weekends cost more, early morning less).
          Changes only affect <em>newly generated</em> slots — existing booked slots are unaffected.
        </p>
      </div>
    </div>
  )
}
