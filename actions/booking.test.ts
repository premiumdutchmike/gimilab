import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/booking/book-tee-time', () => ({
  bookTeeTime: vi.fn(),
  cancelBooking: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { bookTeeTime, cancelBooking } from '@/lib/booking/book-tee-time'
import { bookSlot, cancelSlot } from './booking'

const mockUser = { id: 'user-123' }
const mockCreateClient = vi.mocked(createClient)
const mockBookTeeTime = vi.mocked(bookTeeTime)
const mockCancelBooking = vi.mocked(cancelBooking)

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
})

describe('bookSlot', () => {
  it('redirects to /rounds on success', async () => {
    mockBookTeeTime.mockResolvedValue({ booking: { id: 'b-1' } as any })
    await expect(bookSlot('slot-abc')).rejects.toThrow('REDIRECT:/rounds')
    expect(mockBookTeeTime).toHaveBeenCalledWith('user-123', 'slot-abc')
  })

  it('returns error when slot not available', async () => {
    mockBookTeeTime.mockRejectedValue(new Error('SLOT_NOT_AVAILABLE'))
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'This slot was just booked. Please choose another.' })
  })

  it('returns error when insufficient credits', async () => {
    mockBookTeeTime.mockRejectedValue(new Error('INSUFFICIENT_CREDITS'))
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'Not enough credits to book this slot.' })
  })

  it('returns error when user not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await bookSlot('slot-abc')
    expect(result).toEqual({ error: 'Not authenticated.' })
  })
})

describe('cancelSlot', () => {
  it('revalidates /rounds on success', async () => {
    mockCancelBooking.mockResolvedValue({ refunded: 50 })
    const { revalidatePath } = await import('next/cache')
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({})
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/rounds')
  })

  it('passes reason to cancelBooking', async () => {
    mockCancelBooking.mockResolvedValue({ refunded: 0 })
    await cancelSlot('booking-abc', 'Changed plans')
    expect(mockCancelBooking).toHaveBeenCalledWith('booking-abc', 'user-123', 'Changed plans')
  })

  it('returns error when booking not found', async () => {
    mockCancelBooking.mockRejectedValue(new Error('BOOKING_NOT_FOUND'))
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({ error: 'Booking not found.' })
  })

  it('returns error when already cancelled', async () => {
    mockCancelBooking.mockRejectedValue(new Error('BOOKING_NOT_CANCELLABLE'))
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({ error: 'This booking cannot be cancelled.' })
  })

  it('returns error when unauthorized', async () => {
    mockCancelBooking.mockRejectedValue(new Error('UNAUTHORIZED'))
    const result = await cancelSlot('booking-abc')
    expect(result).toEqual({ error: 'Not authorized.' })
  })
})
