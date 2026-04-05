import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getPartnerByUserId,
  getPartnerCourse,
  getPartnerBlocks,
  getUpcomingSlots,
} from '@/lib/partner/queries'
import { toggleBlock, deleteBlock } from '@/actions/inventory'
import type { TeeTimeBlock } from '@/lib/db/schema'

export const metadata = { title: 'Inventory — Gimmelab' }

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function formatTime(t: string) {
  return t.slice(0, 5) // "HH:MM:SS" → "HH:MM"
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const partner = await getPartnerByUserId(user.id)
  if (!partner) redirect('/login')

  const course = await getPartnerCourse(partner.id)
  if (!course) redirect('/partner/course/new')

  const [blocks, slots] = await Promise.all([
    getPartnerBlocks(partner.id),
    getUpcomingSlots(course.id),
  ])

  const visibleSlots = slots.slice(0, 100)

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: 'rgba(244,238,227,0.35)', textTransform: 'uppercase', marginBottom: 8 }}>
          Partner Portal
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-1px', color: '#F4EEE3', lineHeight: 1, margin: 0 }}>
          Inventory
        </h1>
      </div>

      {/* ── Blocks section ── */}
      <div style={{ borderTop: '1px solid rgba(244,238,227,0.08)', marginBottom: 48 }}>
        {/* Section label bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(244,238,227,0.08)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: 'rgba(244,238,227,0.35)', textTransform: 'uppercase' }}>
            AVAILABILITY BLOCKS — {blocks.length}
          </span>
          <Link
            href="/partner/inventory/new"
            style={{
              background: '#F4EEE3',
              color: '#0C0C0B',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding: '8px 20px',
              textDecoration: 'none',
            }}
          >
            + ADD BLOCK
          </Link>
        </div>

        {blocks.length === 0 ? (
          <div style={{ padding: '32px 0', color: 'rgba(244,238,227,0.35)', fontSize: 13 }}>
            No blocks yet. Add your first availability block to start generating tee times.
          </div>
        ) : (
          blocks.map((block: TeeTimeBlock) => (
            <div
              key={block.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 0',
                borderBottom: '1px solid rgba(244,238,227,0.05)',
                flexWrap: 'wrap',
              }}
            >
              {/* Days pills */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {(block.dayOfWeek as number[]).sort().map((d) => (
                  <span
                    key={d}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      padding: '3px 6px',
                      background: 'rgba(244,238,227,0.08)',
                      color: '#F4EEE3',
                    }}
                  >
                    {DAY_ABBR[d]}
                  </span>
                ))}
              </div>

              {/* Time range */}
              <span style={{ fontSize: 13, color: '#F4EEE3', fontFamily: 'var(--font-geist-mono)', flexShrink: 0 }}>
                {formatTime(block.startTime)} – {formatTime(block.endTime)}
              </span>

              {/* Slots per interval */}
              <span style={{ fontSize: 11, color: '#847C72', flexShrink: 0 }}>
                {block.slotsPerInterval} slot{block.slotsPerInterval !== 1 ? 's' : ''}/10min
              </span>

              {/* Credit cost */}
              <span style={{ fontSize: 11, color: '#847C72', flexShrink: 0 }}>
                {block.creditOverride != null
                  ? `${block.creditOverride} cr (override)`
                  : `${course.baseCreditCost} cr (base)`}
              </span>

              {/* Status */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: block.isActive ? '#F4EEE3' : 'rgba(244,238,227,0.25)',
                  flexShrink: 0,
                }}
              >
                {block.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>

              {/* Actions — pushed to the right */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
                <Link
                  href={`/partner/inventory/${block.id}`}
                  style={{ fontSize: 11, color: '#BF7B2E', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}
                >
                  EDIT →
                </Link>
                {/* @ts-expect-error -- bound Server Action */}
                <form action={toggleBlock.bind(null, block.id)}>
                  <button
                    type="submit"
                    style={{
                      fontSize: 10,
                      color: 'rgba(244,238,227,0.4)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: 0,
                    }}
                  >
                    {block.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                  </button>
                </form>
                {/* @ts-expect-error -- bound Server Action */}
                <form action={deleteBlock.bind(null, block.id)}>
                  <button
                    type="submit"
                    style={{
                      fontSize: 10,
                      color: 'rgba(244,238,227,0.25)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: 0,
                    }}
                  >
                    DELETE
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Slots section ── */}
      <div style={{ borderTop: '1px solid rgba(244,238,227,0.08)' }}>
        {/* Section label bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(244,238,227,0.08)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: 'rgba(244,238,227,0.35)', textTransform: 'uppercase' }}>
            UPCOMING SLOTS — NEXT 14 DAYS
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: 'rgba(244,238,227,0.35)', textTransform: 'uppercase' }}>
            {slots.length} SLOTS
          </span>
        </div>

        {slots.length === 0 ? (
          <div style={{ padding: '32px 0', color: 'rgba(244,238,227,0.35)', fontSize: 13 }}>
            No slots yet. Slots are generated nightly — check back tomorrow, or ensure your course status is active.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', gap: 8, padding: '10px 0', borderBottom: '1px solid rgba(244,238,227,0.05)' }}>
              {['DATE', 'TIME', 'CREDITS', 'STATUS'].map((col) => (
                <span key={col} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: 'rgba(244,238,227,0.25)', textTransform: 'uppercase' }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {visibleSlots.map((slot) => {
              const statusColor =
                slot.status === 'BOOKED' ? '#BF7B2E' :
                slot.status === 'AVAILABLE' ? 'rgba(244,238,227,0.8)' : 'rgba(244,238,227,0.25)'

              return (
                <div
                  key={slot.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 120px',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(244,238,227,0.05)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.55)', fontFamily: 'var(--font-geist-mono)' }}>
                    {slot.date}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.55)', fontFamily: 'var(--font-geist-mono)' }}>
                    {formatTime(slot.startTime)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(244,238,227,0.55)', fontFamily: 'var(--font-geist-mono)' }}>
                    {slot.creditCost}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1px', color: statusColor, textTransform: 'uppercase' }}>
                    {slot.status}
                  </span>
                </div>
              )
            })}

            {/* Overflow note */}
            {slots.length > 100 && (
              <div style={{ padding: '12px 0', fontSize: 11, color: 'rgba(244,238,227,0.35)' }}>
                Showing 100 of {slots.length} slots
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
