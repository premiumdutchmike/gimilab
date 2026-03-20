'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { bookSlot } from '@/actions/booking'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SlotSummary } from '@/lib/types/slot'

interface BookingDialogProps {
  slot: SlotSummary
  userCredits: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return { date, time }
}

export function BookingDialog({
  slot,
  userCredits,
  open,
  onOpenChange,
}: BookingDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const canAfford = userCredits >= slot.creditCost
  const balanceAfter = userCredits - slot.creditCost
  const { date, time } = formatDateTime(slot.teeTime)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await bookSlot(slot.id)
      if (result?.error) {
        setError(result.error)
      }
      // On success, bookSlot redirects to /rounds server-side
    })
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return
    if (!next) setError(null)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0f1923] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            Confirm Booking
          </DialogTitle>
          <DialogDescription className="text-sm text-white/50">
            Review your tee time details before confirming.
          </DialogDescription>
        </DialogHeader>

        {/* Booking summary */}
        <div className="flex flex-col gap-3 py-1">
          <div className="rounded-lg bg-white/5 border border-white/10 p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/60">Course</span>
              <span className="font-medium text-white">{slot.courseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Date</span>
              <span className="text-white">{date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Time</span>
              <span className="text-white">{time}</span>
            </div>
            <div className="border-t border-white/10 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-white/60">Cost</span>
              <span className="font-semibold text-[#4ade80]">
                <span aria-hidden="true">🟢</span> {slot.creditCost} credit{slot.creditCost !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Your balance</span>
              <span className="text-white">{userCredits} credits</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Balance after</span>
              <span
                className={
                  canAfford ? 'text-[#4ade80] font-semibold' : 'text-red-400 font-semibold'
                }
              >
                {balanceAfter} credits
              </span>
            </div>
          </div>

          {!canAfford && (
            <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              You don&apos;t have enough credits for this booking.
            </p>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canAfford || isPending}
            className="bg-[#4ade80] text-[#090f1a] hover:bg-[#4ade80]/90 font-semibold disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Booking…
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
