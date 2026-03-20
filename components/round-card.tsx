'use client'

import { useState } from 'react'
import { Calendar, Clock, Coins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CancelDialog } from './cancel-dialog'

interface RoundCardProps {
  booking: {
    id: string
    courseName: string
    teeTime: string
    creditCost: number
    status: 'BOOKED' | 'CANCELLED' | 'COMPLETED'
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function RoundCard({ booking }: RoundCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false)

  const isFuture = new Date(booking.teeTime) > new Date()
  const isCancellable = booking.status === 'BOOKED' && isFuture

  const isActive = booking.status === 'BOOKED'
  const isMuted = booking.status === 'CANCELLED' || booking.status === 'COMPLETED'

  return (
    <>
      <div
        className={[
          'relative rounded-xl border p-4 flex flex-col gap-3 transition-opacity',
          isActive
            ? 'bg-[#0f1923] border-[#4ade80]/30 border-l-2 border-l-[#4ade80]'
            : 'bg-[#0f1923] border-white/10',
          isMuted ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        {/* Header row: course name + status badge */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={[
              'font-semibold text-sm leading-snug',
              isActive ? 'text-white' : 'text-white/70',
            ].join(' ')}
          >
            {booking.courseName}
          </h3>
          <StatusBadge status={booking.status} />
        </div>

        {/* Details row */}
        <div className="flex flex-col gap-1.5 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formatDate(booking.teeTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            <span>{formatTime(booking.teeTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="size-3.5 shrink-0" />
            <span>
              {booking.creditCost} credit{booking.creditCost !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Cancel button */}
        {isCancellable && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/50 text-xs h-8"
            >
              Cancel Booking
            </Button>
          </div>
        )}
      </div>

      {isCancellable && (
        <CancelDialog
          bookingId={booking.id}
          teeTime={booking.teeTime}
          courseName={booking.courseName}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
    </>
  )
}

function StatusBadge({ status }: { status: RoundCardProps['booking']['status'] }) {
  if (status === 'BOOKED') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 shrink-0">
        Upcoming
      </span>
    )
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-white/5 text-white/50 border border-white/10 shrink-0">
        Completed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
      Cancelled
    </span>
  )
}
