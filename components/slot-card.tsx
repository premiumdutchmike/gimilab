'use client'

import { useState } from 'react'
import { BookingDialog } from './booking-dialog'

interface SlotCardProps {
  slot: {
    id: string
    teeTime: string
    creditCost: number
    availableSpots: number
    courseName: string
  }
  userCredits: number
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function SlotCard({ slot, userCredits }: SlotCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const canAfford = userCredits >= slot.creditCost
  const isLowAvailability = slot.availableSpots <= 2

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className={[
          'w-full text-left rounded-xl border p-4 cursor-pointer transition-colors',
          'bg-[#0f1923] border-white/10',
          'hover:bg-[#162030] hover:border-white/20',
          'active:bg-[#1a2535]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4ade80]/50',
          !canAfford ? 'opacity-50' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Book ${slot.courseName} at ${formatTime(slot.teeTime)} for ${slot.creditCost} credits`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: time + course */}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-lg font-semibold tabular-nums text-white leading-none">
              {formatTime(slot.teeTime)}
            </span>
            <span className="text-sm text-white/60 truncate">{slot.courseName}</span>
          </div>

          {/* Right: credits + spots */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-sm font-semibold text-[#4ade80] flex items-center gap-1">
              🟢 {slot.creditCost} cr
            </span>
            <span
              className={[
                'text-xs font-medium',
                isLowAvailability ? 'text-amber-400' : 'text-white/40',
              ].join(' ')}
            >
              {slot.availableSpots === 1
                ? '1 spot left'
                : `${slot.availableSpots} spots left`}
            </span>
          </div>
        </div>

        {!canAfford && (
          <p className="mt-2 text-xs text-white/40">
            Need {slot.creditCost - userCredits} more credit
            {slot.creditCost - userCredits !== 1 ? 's' : ''}
          </p>
        )}
      </button>

      <BookingDialog
        slot={slot}
        userCredits={userCredits}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
