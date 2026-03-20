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

export const metadata = { title: 'Inventory — OneGolf' }

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
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
          Partner Portal
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-1px', color: '#fff', lineHeight: 1, margin: 0 }}>
          Inventory
        </h1>
      </div>

      {/* ── Blocks section ── */}
      <div style={{ borderTop: '1px solid #1a1a1a', marginBottom: 48 }}>
        {/* Section label bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase' }}>
            AVAILABILITY BLOCKS — {blocks.length}
          </span>
          <Link
            href="/partner/inventory/new"
            style={{
              background: '#fff',
              color: '#000',
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
          <div style={{ padding: '32px 0', color: '#444', fontSize: 13 }}>
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
                borderBottom: '1px solid #111',
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
                      background: '#1a1a1a',
                      color: '#fff',
                    }}
                  >
                    {DAY_ABBR[d]}
                  </span>
                ))}
              </div>

              {/* Time range */}
              <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-geist-mono)', flexShrink: 0 }}>
                {formatTime(block.startTime)} – {formatTime(block.endTime)}
              </span>

              {/* Slots per interval */}
              <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
                {block.slotsPerInterval} slot{block.slotsPerInterval !== 1 ? 's' : ''}/10min
              </span>

              {/* Credit cost */}
              <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>
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
                  color: block.isActive ? '#fff' : 'rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }}
              >
                {block.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>

              {/* Actions — pushed to the right */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
                <Link
                  href={`/partner/inventory/${block.id}`}
                  style={{ fontSize: 11, color: '#38bdf8', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase' }}
                >
                  EDIT →
                </Link>
                {/* @ts-expect-error -- bound Server Action */}
                <form action={toggleBlock.bind(null, block.id)}>
                  <button
                    type="submit"
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.4)',
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
                      color: 'rgba(255,255,255,0.2)',
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
      <div style={{ borderTop: '1px solid #1a1a1a' }}>
        {/* Section label bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '3px', color: '#444', textTransform: 'uppercase' }}>
            UPCOMING SLOTS — NEXT 14 DAYS
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: '#444', textTransform: 'uppercase' }}>
            {slots.length} SLOTS
          </span>
        </div>

        {slots.length === 0 ? (
          <div style={{ padding: '32px 0', color: '#444', fontSize: 13 }}>
            No slots yet. Slots are generated nightly — check back tomorrow, or ensure your course status is active.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 120px', gap: 8, padding: '10px 0', borderBottom: '1px solid #111' }}>
              {['DATE', 'TIME', 'CREDITS', 'STATUS'].map((col) => (
                <span key={col} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#333', textTransform: 'uppercase' }}>
                  {col}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {visibleSlots.map((slot) => {
              const statusColor =
                slot.status === 'BOOKED' ? '#38bdf8' :
                slot.status === 'AVAILABLE' ? 'rgba(255,255,255,0.8)' : '#333'

              return (
                <div
                  key={slot.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 120px',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid #0d0d0d',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
                    {slot.date}
                  </span>
                  <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
                    {formatTime(slot.startTime)}
                  </span>
                  <span style={{ fontSize: 12, color: '#888', fontFamily: 'var(--font-geist-mono)' }}>
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
              <div style={{ padding: '12px 0', fontSize: 11, color: '#444' }}>
                Showing 100 of {slots.length} slots
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
