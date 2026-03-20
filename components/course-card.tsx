import Link from 'next/link'
import Image from 'next/image'
import type { Course } from '@/lib/db/schema'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const firstPhoto = course.photos?.[0] ?? null

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden flex flex-col bg-[#0f1923]"
    >
      {/* Image */}
      <div className="relative h-44 w-full bg-white/5 flex items-center justify-center overflow-hidden">
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={course.name}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-white/20 text-4xl select-none">⛳</span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Name */}
        <h2 className="text-white font-bold text-lg leading-snug">{course.name}</h2>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/50 text-sm">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span className="truncate">{course.address}</span>
        </div>

        {/* Holes + credits */}
        <div className="flex items-center gap-3 text-sm font-mono">
          <span className="text-green-400 font-semibold">
            {course.holes ?? 18} holes
          </span>
          <span className="text-white/20">·</span>
          <span className="text-green-400 font-semibold">
            {course.baseCreditCost} credits
          </span>
          {course.avgRating != null && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-amber-400 font-semibold">
                ★ {Number(course.avgRating).toFixed(1)}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
            {course.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <Link
            href={`/book?courseId=${course.id}`}
            className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-75 bg-[#4ade80] text-[#090f1a]"
          >
            Book a Tee Time
          </Link>
        </div>
      </div>
    </div>
  )
}
