'use client'

import { useTransition, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCourse, updateCourse } from '@/actions/partner'
import { createCourseSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Schema for the form — extends canonical schema with two overrides:
// - holes: string enum (no .transform(Number)) so the select element works with RHF
// - baseCreditCost: plain z.number() instead of z.coerce.number() so RHF infers `number` not `unknown`
const formSchema = createCourseSchema.extend({
  holes: z.enum(['9', '18']),
  baseCreditCost: z.number().int().min(10).max(500),
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
        <Label htmlFor="name" className="text-[#F4EEE3]">Course name</Label>
        <Input id="name" {...register('name')} className="bg-[#1E1D1B] border-[rgba(244,238,227,0.08)] text-[#F4EEE3]" />
        {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[#F4EEE3]">Description</Label>
        <Textarea id="description" {...register('description')} rows={4}
          className="bg-[#1E1D1B] border-[rgba(244,238,227,0.08)] text-[#F4EEE3] resize-none" />
        {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-[#F4EEE3]">Address</Label>
        <Input id="address" {...register('address')} className="bg-[#1E1D1B] border-[rgba(244,238,227,0.08)] text-[#F4EEE3]" />
        {errors.address && <p className="text-red-400 text-xs">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holes" className="text-[#F4EEE3]">Holes</Label>
          <select
            id="holes"
            {...register('holes')}
            className="w-full h-10 px-3 bg-[#1E1D1B] border border-[rgba(244,238,227,0.08)] text-[#F4EEE3] rounded-none text-sm"
          >
            <option value="18">18 holes</option>
            <option value="9">9 holes</option>
          </select>
          {errors.holes && <p className="text-red-400 text-xs">{errors.holes.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="baseCreditCost" className="text-[#F4EEE3]">Base credit cost</Label>
          <Input
            id="baseCreditCost"
            type="number"
            {...register('baseCreditCost', { valueAsNumber: true })}
            className="bg-[#1E1D1B] border-[rgba(244,238,227,0.08)] text-[#F4EEE3]"
          />
          {errors.baseCreditCost && <p className="text-red-400 text-xs">{errors.baseCreditCost.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[#F4EEE3]">Photo URLs <span className="text-[#847C72] font-normal">(comma-separated)</span></Label>
        <Textarea
          ref={photosRef}
          defaultValue={
            props.mode === 'edit' ? (props.initialValues.photos ?? []).join(', ') : ''
          }
          rows={2}
          placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
          className="bg-[#1E1D1B] border-[rgba(244,238,227,0.08)] text-[#F4EEE3] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[#F4EEE3]">Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="accent-[#BF7B2E]"
              />
              <span className="text-sm text-[#847C72]">{amenity}</span>
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
