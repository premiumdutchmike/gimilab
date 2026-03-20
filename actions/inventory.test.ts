import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/lib/partner/queries', () => ({
  getPartnerByUserId: vi.fn(),
  getPartnerCourse: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getPartnerByUserId, getPartnerCourse } from '@/lib/partner/queries'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createBlock, updateBlock, toggleBlock, deleteBlock } from './inventory'

const mockUser = { id: 'user-123' }
const mockPartner = { id: 'partner-abc', userId: 'user-123' }
const mockCourse = { id: 'course-xyz', partnerId: 'partner-abc' }
const mockBlock = {
  id: 'block-111',
  courseId: 'course-xyz',
  isActive: true,
  dayOfWeek: [1, 2, 3],
  startTime: '07:00:00',
  endTime: '11:00:00',
  slotsPerInterval: 1,
  creditOverride: null,
  validFrom: '2026-03-21',
  validUntil: null,
}

const mockCreateClient = vi.mocked(createClient)
const mockGetPartnerByUserId = vi.mocked(getPartnerByUserId)
const mockGetPartnerCourse = vi.mocked(getPartnerCourse)

/** Helper: creates a FormData with multi-value dayOfWeek support */
function makeBlockFormData(
  overrides: Record<string, string> = {},
  days: number[] = [1, 2, 3]
) {
  const fd = new FormData()
  const defaults: Record<string, string> = {
    startTime: '07:00',
    endTime: '11:00',
    validFrom: '2026-03-21',
    slotsPerInterval: '1',
    isActive: 'true',
  }
  Object.entries({ ...defaults, ...overrides }).forEach(([k, v]) => fd.append(k, v))
  days.forEach((d) => fd.append('dayOfWeek', String(d)))
  return fd
}

/** Drizzle select chain mock that executes the .then() callback */
function makeSelectMock(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb: any) => Promise.resolve(cb(rows))),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
  mockGetPartnerByUserId.mockResolvedValue(mockPartner as any)
  mockGetPartnerCourse.mockResolvedValue(mockCourse as any)
})

// ─── createBlock ───────────────────────────────────────────────────────────

describe('createBlock', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await createBlock(makeBlockFormData())
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when partner not found', async () => {
    mockGetPartnerByUserId.mockResolvedValue(null as any)
    const result = await createBlock(makeBlockFormData())
    expect(result).toEqual({ error: 'Partner account not found.' })
  })

  it('returns error when no course found', async () => {
    mockGetPartnerCourse.mockResolvedValue(null as any)
    const result = await createBlock(makeBlockFormData())
    expect(result).toEqual({ error: 'No course found.' })
  })

  it('returns error on validation failure (no days)', async () => {
    const result = await createBlock(makeBlockFormData({}, [])) // no days
    expect(result).toHaveProperty('error')
  })

  it('returns error on validation failure (end before start)', async () => {
    const result = await createBlock(makeBlockFormData({ startTime: '11:00', endTime: '07:00' }))
    expect(result).toHaveProperty('error')
  })

  it('succeeds when creditOverride is blank (uses course base cost)', async () => {
    const insertMock = { values: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.insert).mockReturnValue(insertMock as any)
    const fd = makeBlockFormData({ creditOverride: '' }) // blank → undefined
    await expect(createBlock(fd)).rejects.toThrow('REDIRECT:/partner/inventory')
  })

  it('redirects to /partner/inventory on success', async () => {
    const insertMock = { values: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.insert).mockReturnValue(insertMock as any)
    await expect(createBlock(makeBlockFormData())).rejects.toThrow('REDIRECT:/partner/inventory')
    expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
  })
})

// ─── updateBlock ───────────────────────────────────────────────────────────

describe('updateBlock', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await updateBlock('block-111', makeBlockFormData())
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when block not found', async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectMock([]) as any) // no block
    const result = await updateBlock('block-111', makeBlockFormData())
    expect(result).toEqual({ error: 'Block not found.' })
  })

  it('returns error when block belongs to another partner', async () => {
    vi.mocked(db.select).mockReturnValue(
      makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any
    )
    // course is course-xyz, block.courseId is other-course → not authorized
    const result = await updateBlock('block-111', makeBlockFormData())
    expect(result).toEqual({ error: 'Not authorized.' })
  })

  it('returns error on validation failure', async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
    const result = await updateBlock('block-111', makeBlockFormData({}, [])) // no days
    expect(result).toHaveProperty('error')
  })

  it('revalidates and returns {} on success', async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
    const updateMock = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.update).mockReturnValue(updateMock as any)
    const result = await updateBlock('block-111', makeBlockFormData())
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
  })
})

// ─── toggleBlock ───────────────────────────────────────────────────────────

describe('toggleBlock', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await toggleBlock('block-111')
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when not authorized', async () => {
    vi.mocked(db.select).mockReturnValue(
      makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any
    )
    const result = await toggleBlock('block-111')
    expect(result).toEqual({ error: 'Not authorized.' })
  })

  it('returns error when block not found', async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectMock([]) as any) // no block
    const result = await toggleBlock('block-111')
    expect(result).toEqual({ error: 'Block not found.' })
  })

  it('toggles isActive and returns {} on success', async () => {
    vi.mocked(db.select).mockReturnValue(makeSelectMock([mockBlock]) as any)
    const updateMock = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.update).mockReturnValue(updateMock as any)
    const result = await toggleBlock('block-111')
    expect(result).toEqual({})
    expect(updateMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }) // flipped from true
    )
    expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
  })
})

// ─── deleteBlock ───────────────────────────────────────────────────────────

describe('deleteBlock', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await deleteBlock('block-111')
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when not authorized', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectMock([{ ...mockBlock, courseId: 'other-course' }]) as any)
    const result = await deleteBlock('block-111')
    expect(result).toEqual({ error: 'Not authorized.' })
  })

  it('returns error when block not found', async () => {
    vi.mocked(db.select).mockReturnValueOnce(makeSelectMock([]) as any) // no block
    const result = await deleteBlock('block-111')
    expect(result).toEqual({ error: 'Block not found.' })
  })

  it('returns error when block has upcoming bookings', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectMock([mockBlock]) as any) // block fetch
      .mockReturnValueOnce(makeSelectMock([{ id: 'slot-1' }]) as any) // booked slots found
    const result = await deleteBlock('block-111')
    expect(result).toEqual({ error: 'Cannot delete a block with upcoming bookings.' })
  })

  it('deletes and returns {} on success', async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectMock([mockBlock]) as any) // block fetch
      .mockReturnValueOnce(makeSelectMock([]) as any) // no booked slots
    const deleteMock = { where: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.delete).mockReturnValue(deleteMock as any)
    const result = await deleteBlock('block-111')
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/partner/inventory')
  })
})
