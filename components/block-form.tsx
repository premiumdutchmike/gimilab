'use client'

import { useTransition, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createBlock, updateBlock } from '@/actions/inventory'
import { createBlockSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Client-side schema: override coerce fields with plain types for RHF compatibility
const formSchema = z.object({
  dayOfWeek:        z.array(z.number().int().min(0).max(6)).min(1, 'Select at least one day'),
  startTime:        z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
  endTime:          z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time'),
  slotsPerInterval: z.number().int().min(1).max(4),
  creditOverride:   z.number().int().min(10).max(500).optional(),
  validFrom:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  validUntil:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isActive:         z.boolean(),
}).refine(
  (d) => d.startTime.slice(0, 5) < d.endTime.slice(0, 5),
  { message: 'End time must be after start time', path: ['endTime'] }
)
type FormValues = z.infer<typeof formSchema>

interface BlockInitialValues {
  dayOfWeek: number[]
  startTime: string       // "HH:MM" (trim from DB "HH:MM:SS")
  endTime: string
  slotsPerInterval: number
  creditOverride: number | null
  validFrom: string       // "YYYY-MM-DD"
  validUntil: string | null
  isActive: boolean
}

type BlockFormProps =
  | { mode: 'create' }
  | { mode: 'edit'; blockId: string; initialValues: BlockInitialValues }

export default function BlockForm(props: BlockFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const defaultValues: Partial<FormValues> =
    props.mode === 'edit'
      ? {
          dayOfWeek:        props.initialValues.dayOfWeek,
          startTime:        props.initialValues.startTime,
          endTime:          props.initialValues.endTime,
          slotsPerInterval: props.initialValues.slotsPerInterval,
          creditOverride:   props.initialValues.creditOverride ?? undefined,
          validFrom:        props.initialValues.validFrom,
          validUntil:       props.initialValues.validUntil ?? undefined,
          isActive:         props.initialValues.isActive,
        }
      : { dayOfWeek: [], slotsPerInterval: 1, isActive: true }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues })

  const selectedDays = watch('dayOfWeek') ?? []

  function toggleDay(day: number) {
    const current = selectedDays
    setValue(
      'dayOfWeek',
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    )
  }

  function onSubmit(data: FormValues) {
    setServerError(null)
    const fd = new FormData()

    // Append dayOfWeek as repeated keys
    data.dayOfWeek.forEach((d) => fd.append('dayOfWeek', String(d)))

    // Append remaining fields
    fd.append('startTime', data.startTime)
    fd.append('endTime', data.endTime)
    fd.append('slotsPerInterval', String(data.slotsPerInterval))
    fd.append('creditOverride', data.creditOverride != null ? String(data.creditOverride) : '')
    fd.append('validFrom', data.validFrom)
    fd.append('validUntil', data.validUntil ?? '')
    fd.append('isActive', data.isActive ? 'true' : 'false')

    startTransition(async () => {
      const result =
        props.mode === 'create'
          ? await createBlock(fd)
          : await updateBlock(props.blockId, fd)

      if (result && 'error' in result) {
        setServerError(result.error)
      } else if (props.mode === 'edit') {
        router.push('/partner/inventory')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">

      {/* Days of week */}
      <div className="space-y-2">
        <Label className="text-white">Days of week</Label>
        <div className="flex gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              title={DAY_NAMES[i]}
              style={{
                width: 36,
                height: 36,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: 'pointer',
                background: selectedDays.includes(i) ? '#fff' : 'transparent',
                color: selectedDays.includes(i) ? '#000' : 'rgba(255,255,255,0.4)',
                border: selectedDays.includes(i) ? '1px solid #fff' : '1px solid #333',
                borderRadius: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.dayOfWeek && (
          <p className="text-red-400 text-xs">{errors.dayOfWeek.message as string}</p>
        )}
      </div>

      {/* Start / End time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime" className="text-white">Start time</Label>
          <Input
            id="startTime"
            type="time"
            {...register('startTime')}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.startTime && (
            <p className="text-red-400 text-xs">{errors.startTime.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime" className="text-white">End time</Label>
          <Input
            id="endTime"
            type="time"
            {...register('endTime')}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.endTime && (
            <p className="text-red-400 text-xs">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {/* Slots per interval */}
      <div className="space-y-2">
        <Label htmlFor="slotsPerInterval" className="text-white">
          Slots per 10-min interval{' '}
          <span className="text-white/40 font-normal">(1–4)</span>
        </Label>
        <Input
          id="slotsPerInterval"
          type="number"
          min={1}
          max={4}
          {...register('slotsPerInterval', { valueAsNumber: true })}
          className="bg-[#0f1923] border-[#1a1a1a] text-white"
        />
        {errors.slotsPerInterval && (
          <p className="text-red-400 text-xs">{errors.slotsPerInterval.message}</p>
        )}
      </div>

      {/* Credit override */}
      <div className="space-y-2">
        <Label htmlFor="creditOverride" className="text-white">
          Credit override{' '}
          <span className="text-white/40 font-normal">(blank = use course base)</span>
        </Label>
        <Input
          id="creditOverride"
          type="number"
          min={10}
          max={500}
          {...register('creditOverride', { valueAsNumber: true })}
          className="bg-[#0f1923] border-[#1a1a1a] text-white"
        />
        {errors.creditOverride && (
          <p className="text-red-400 text-xs">{errors.creditOverride.message}</p>
        )}
      </div>

      {/* Valid from / until */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validFrom" className="text-white">Valid from</Label>
          <Input
            id="validFrom"
            type="date"
            {...register('validFrom')}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.validFrom && (
            <p className="text-red-400 text-xs">{errors.validFrom.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="validUntil" className="text-white">
            Valid until{' '}
            <span className="text-white/40 font-normal">(blank = ongoing)</span>
          </Label>
          <Input
            id="validUntil"
            type="date"
            {...register('validUntil')}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
        </div>
      </div>

      {/* Active */}
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          type="checkbox"
          {...register('isActive')}
          className="accent-[#38bdf8]"
          defaultChecked
        />
        <Label htmlFor="isActive" className="text-white/70 text-sm font-normal cursor-pointer">
          Active (block will generate tee time slots)
        </Label>
      </div>

      {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-white text-black hover:bg-white/90 rounded-none font-bold uppercase tracking-widest text-xs px-8"
      >
        {isPending
          ? props.mode === 'create' ? 'Adding block…' : 'Saving changes…'
          : props.mode === 'create' ? 'Add block' : 'Save changes'}
      </Button>
    </form>
  )
}
