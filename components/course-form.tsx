'use client'

import { useTransition, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCourse, updateCourse } from '@/actions/partner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Standalone form schema — mirrors createCourseSchema fields but:
// - holes kept as string enum (no transform) so the select element works
// - baseCreditCost typed as number (not coerced) so RHF resolver types align
const formSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  address: z.string().min(5),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  holes: z.enum(['9', '18']),
  baseCreditCost: z.number().int().min(10).max(500),
  amenities: z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof formSchema>

interface CourseInitialValues {
  name: string
  description: string | null
  address: string
  holes: 9 | 18
  baseCreditCost: number
  amenities: string[] | null
  photos: string[] | null
}

type CourseFormProps =
  | { mode: 'create'; partnerId: string }
  | { mode: 'edit'; courseId: string; initialValues: CourseInitialValues }

const AMENITIES = [
  'Driving Range',
  'Practice Green',
  'Pro Shop',
  'Caddies Available',
  'Golf Cart Included',
  'Walking Only',
  'Restaurant/Bar',
  'Changing Rooms',
]

export default function CourseForm(props: CourseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const photosRef = useRef<HTMLTextAreaElement>(null)

  const defaultValues: Partial<FormValues> =
    props.mode === 'edit'
      ? {
          name: props.initialValues.name,
          description: props.initialValues.description ?? '',
          address: props.initialValues.address,
          holes: String(props.initialValues.holes) as '9' | '18',
          baseCreditCost: props.initialValues.baseCreditCost,
          amenities: props.initialValues.amenities ?? [],
        }
      : { holes: '18', amenities: [] }

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues })

  const selectedAmenities = watch('amenities') ?? []

  function toggleAmenity(amenity: string) {
    const current = selectedAmenities
    setValue(
      'amenities',
      current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity]
    )
  }

  function onSubmit(data: FormValues) {
    setServerError(null)
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => fd.append(k, item))
      } else if (v != null) {
        fd.append(k, String(v))
      }
    })
    // Photos field is uncontrolled (not in Zod schema) — read from ref
    fd.set('photos', photosRef.current?.value ?? '')

    startTransition(async () => {
      const result =
        props.mode === 'create'
          ? await createCourse(fd)
          : await updateCourse(props.courseId, fd)

      if (result && 'error' in result) {
        setServerError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">Course name</Label>
        <Input id="name" {...register('name')} className="bg-[#0f1923] border-[#1a1a1a] text-white" />
        {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">Description</Label>
        <Textarea id="description" {...register('description')} rows={4}
          className="bg-[#0f1923] border-[#1a1a1a] text-white resize-none" />
        {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-white">Address</Label>
        <Input id="address" {...register('address')} className="bg-[#0f1923] border-[#1a1a1a] text-white" />
        {errors.address && <p className="text-red-400 text-xs">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holes" className="text-white">Holes</Label>
          <select
            id="holes"
            {...register('holes')}
            className="w-full h-10 px-3 bg-[#0f1923] border border-[#1a1a1a] text-white rounded-none text-sm"
          >
            <option value="18">18 holes</option>
            <option value="9">9 holes</option>
          </select>
          {errors.holes && <p className="text-red-400 text-xs">{errors.holes.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseCreditCost" className="text-white">Base credit cost</Label>
          <Input
            id="baseCreditCost"
            type="number"
            {...register('baseCreditCost', { valueAsNumber: true })}
            className="bg-[#0f1923] border-[#1a1a1a] text-white"
          />
          {errors.baseCreditCost && <p className="text-red-400 text-xs">{errors.baseCreditCost.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Photo URLs <span className="text-white/40 font-normal">(comma-separated)</span></Label>
        <Textarea
          ref={photosRef}
          defaultValue={
            props.mode === 'edit' ? (props.initialValues.photos ?? []).join(', ') : ''
          }
          rows={2}
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
          className="bg-[#0f1923] border-[#1a1a1a] text-white resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="accent-[#38bdf8]"
              />
              <span className="text-sm text-white/70">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {serverError && (
        <p className="text-red-400 text-sm">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-white text-black hover:bg-white/90 rounded-none font-bold uppercase tracking-widest text-xs px-8"
      >
        {isPending
          ? props.mode === 'create' ? 'Creating course…' : 'Saving changes…'
          : props.mode === 'create' ? 'Create course' : 'Save changes'}
      </Button>
    </form>
  )
}
