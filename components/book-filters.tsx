'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BookFiltersProps {
  courses: Array<{ id: string; name: string }>
  initialCourseId?: string
}

const TIME_OF_DAY_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
] as const

type TimeOfDay = (typeof TIME_OF_DAY_OPTIONS)[number]['value']

export function BookFilters({ courses, initialCourseId }: BookFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Read current values from URL (persist on refresh)
  const courseId = searchParams.get('courseId') ?? initialCourseId ?? ''
  const date = searchParams.get('date') ?? ''
  const timeOfDay = (searchParams.get('timeOfDay') ?? 'any') as TimeOfDay
  const players = searchParams.get('players') ?? '1'

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      router.push(`?${params.toString()}`)
    },
    [searchParams, router],
  )

  const clearFilters = () =>
    initialCourseId
      ? router.push(`?courseId=${initialCourseId}`)
      : router.push('?')

  const hasActiveFilters =
    courseId !== '' || date !== '' || timeOfDay !== 'any' || players !== '1'

  return (
    <div className="rounded-xl bg-[#0f1923] border border-white/10 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#4ade80] hover:text-[#4ade80]/80 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Course */}
        <div className="space-y-1.5">
          <Label htmlFor="course-select" className="text-white/60 text-xs font-medium">
            Course
          </Label>
          <Select
            value={courseId}
            onValueChange={(value) => updateParams({ courseId: value ?? '' })}
          >
            <SelectTrigger
              id="course-select"
              className="bg-[#090f1a] border-white/10 text-white focus:ring-[#4ade80] focus:border-[#4ade80]"
            >
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1923] border-white/10 text-white">
              <SelectItem value="" className="focus:bg-white/10 focus:text-white">
                All courses
              </SelectItem>
              {courses.map((course) => (
                <SelectItem
                  key={course.id}
                  value={course.id}
                  className="focus:bg-white/10 focus:text-white"
                >
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="date-input" className="text-white/60 text-xs font-medium">
            Date
          </Label>
          <Input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => updateParams({ date: e.target.value })}
            className="bg-[#090f1a] border-white/10 text-white focus-visible:ring-[#4ade80] focus-visible:border-[#4ade80] [color-scheme:dark]"
          />
        </div>

        {/* Time of day */}
        <div className="space-y-1.5">
          <Label htmlFor="time-select" className="text-white/60 text-xs font-medium">
            Time of day
          </Label>
          <Select
            value={timeOfDay}
            onValueChange={(value) =>
              // 'any' is the default — omit the param rather than writing ?timeOfDay=any
              updateParams({ timeOfDay: value == null || value === 'any' ? '' : value })
            }
          >
            <SelectTrigger
              id="time-select"
              className="bg-[#090f1a] border-white/10 text-white focus:ring-[#4ade80] focus:border-[#4ade80]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1923] border-white/10 text-white">
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-white/10 focus:text-white"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Players */}
        <div className="space-y-1.5">
          <Label htmlFor="players-input" className="text-white/60 text-xs font-medium">
            Players
          </Label>
          <Input
            id="players-input"
            type="number"
            min={1}
            max={4}
            value={players}
            onChange={(e) => {
              const val = e.target.value
              const num = parseInt(val, 10)
              if (val === '' || (num >= 1 && num <= 4)) {
                updateParams({ players: val === '' || num === 1 ? '' : val })
              }
            }}
            className="bg-[#090f1a] border-white/10 text-white focus-visible:ring-[#4ade80] focus-visible:border-[#4ade80] font-mono"
          />
        </div>
      </div>
    </div>
  )
}
