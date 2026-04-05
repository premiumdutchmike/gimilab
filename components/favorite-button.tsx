'use client'

import { useState, useTransition, type MouseEvent } from 'react'
import { toggleFavorite } from '@/actions/favorites'

interface FavoriteButtonProps {
  courseId: string
  initialFavorited: boolean
  /** When true, hide the button entirely (for logged-out users). */
  hidden?: boolean
  /** Called with the new favorited state after every toggle (including
   * optimistic updates and post-server reconciliation). Parent can use this
   * to keep a shared favorites set in sync, e.g. for a "favorites only"
   * filter. */
  onToggle?: (favorited: boolean) => void
}

export default function FavoriteButton({
  courseId,
  initialFavorited,
  hidden,
  onToggle,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  if (hidden) return null

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const next = !favorited
    setFavorited(next) // optimistic
    onToggle?.(next)

    startTransition(async () => {
      const result = await toggleFavorite(courseId)
      if (result.error) {
        // revert on error
        setFavorited(!next)
        onToggle?.(!next)
      } else {
        setFavorited(result.favorited)
        onToggle?.(result.favorited)
      }
    })
  }

  const fillColor = favorited ? '#C4893A' : 'none'
  const strokeColor = favorited ? '#C4893A' : '#847C72'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      disabled={isPending}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        width: 34,
        height: 34,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 9999,
        background: 'rgba(244,240,234,0.92)',
        border: '1px solid var(--cream-mid, #DDD7CC)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        cursor: isPending ? 'progress' : 'pointer',
        transition: 'transform 120ms ease, background 120ms ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(244,240,234,1)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(244,240,234,0.92)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
