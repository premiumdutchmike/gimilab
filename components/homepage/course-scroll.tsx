'use client'

import { useRef } from 'react'
import Image from 'next/image'

interface Course {
  id: string
  name: string
  address: string
  holes: number | null
  baseCreditCost: number
  photos: string[] | null
}

interface CourseScrollProps {
  courses: Course[]
}

export function CourseScroll({ courses }: CourseScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    scrollLeft.current = scrollRef.current?.scrollLeft ?? 0
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }
  const onMouseLeave = () => {
    dragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseUp = () => {
    dragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    scrollRef.current.scrollLeft = scrollLeft.current - (x - startX.current) * 1.5
  }

  if (courses.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
        Partner courses coming soon.
      </p>
    )
  }

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        paddingRight: 60,
        scrollbarWidth: 'none',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {courses.map((course, i) => (
        <div
          key={course.id}
          style={{
            flexShrink: 0,
            width: 270,
            background: '#fff',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(-6px)'
            el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.12)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.transform = ''
            el.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
            {course.photos?.[0] ? (
              <Image
                src={course.photos[0]}
                alt={course.name}
                fill
                sizes="270px"
                style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#e5e7eb' }} />
            )}
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: i === 0 ? '#1a5c38' : 'rgba(255,255,255,0.95)',
              color: i === 0 ? '#fff' : '#0d0d0d',
              fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: 100,
            }}>
              {i === 0 ? '★ Featured' : `${course.holes ?? 18} holes`}
            </div>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.3px' }}>
              {course.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{course.address.split(',').slice(-2).join(',').trim()}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1a5c38', background: '#f0fdf4', padding: '3px 8px', borderRadius: 4 }}>
                {course.baseCreditCost} credits
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
