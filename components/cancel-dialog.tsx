'use client'

import { useState, useTransition } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import { cancelSlot } from '@/actions/booking'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface CancelDialogProps {
  bookingId: string
  teeTime: string
  courseName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${date} • ${time}`
}

export function CancelDialog({
  bookingId,
  teeTime,
  courseName,
  open,
  onOpenChange,
}: CancelDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const formattedDateTime = formatDateTime(teeTime)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await cancelSlot(bookingId, reason.trim() || undefined)
      if (result?.error) {
        setError(result.error)
      } else {
        setReason('')
        onOpenChange(false)
      }
    })
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return
    if (!next) {
      setError(null)
      setReason('')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#0f1923] border-white/10 text-white max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-red-400 shrink-0" />
            <DialogTitle className="text-base font-semibold text-white">
              Cancel Booking
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-white/50">
            This action cannot be undone. Credits will be refunded to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {/* Booking summary */}
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-start gap-2">
              <span className="text-white/60 shrink-0">Course</span>
              <span className="font-medium text-white text-right">{courseName}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-white/60 shrink-0">Tee time</span>
              <span className="text-white text-right">{formattedDateTime}</span>
            </div>
          </div>

          {/* Optional reason */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cancel-reason"
              className="text-xs font-medium text-white/60"
            >
              Reason <span className="text-white/30">(optional)</span>
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="Let us know why you're cancelling…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-white/10 resize-none min-h-20"
            />
          </div>

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
            Keep Booking
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-500 text-white hover:bg-red-500/90 font-semibold disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
