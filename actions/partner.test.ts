import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
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
import { createCourse, updateCourse } from './partner'

const mockUser = { id: 'user-123' }
const mockPartner = { id: 'partner-abc', userId: 'user-123', businessName: 'Pine Valley GC' }
const mockCourse = { id: 'course-xyz', partnerId: 'partner-abc', name: 'Pine Valley', status: 'pending' }

const mockCreateClient = vi.mocked(createClient)
const mockGetPartnerByUserId = vi.mocked(getPartnerByUserId)
const mockGetPartnerCourse = vi.mocked(getPartnerCourse)

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  return fd
}

const validFields = {
  name: 'Pine Valley GC',
  description: 'A classic course',
  address: '1 Pine Valley Rd, NJ',
  holes: '18',
  baseCreditCost: '50',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
  mockGetPartnerByUserId.mockResolvedValue(mockPartner as any)
  mockGetPartnerCourse.mockResolvedValue(null) // no course by default
})

// ─── createCourse ──────────────────────────────────────────────────────────

describe('createCourse', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when partner record not found', async () => {
    mockGetPartnerByUserId.mockResolvedValue(null)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Partner account not found.' })
  })

  it('returns error when course already exists', async () => {
    mockGetPartnerCourse.mockResolvedValue(mockCourse as any)
    const result = await createCourse(makeFormData(validFields))
    expect(result).toEqual({ error: 'Course already exists.' })
  })

  it('returns error on validation failure', async () => {
    const result = await createCourse(makeFormData({ ...validFields, name: 'X' })) // too short
    expect(result).toHaveProperty('error')
    expect(typeof (result as any).error).toBe('string')
  })

  it('redirects to /partner/dashboard on success', async () => {
    const insertMock = { values: vi.fn().mockResolvedValue([]) }
    vi.mocked(db.insert).mockReturnValue(insertMock as any)
    await expect(createCourse(makeFormData(validFields))).rejects.toThrow('REDIRECT:/partner/dashboard')
    expect(revalidatePath).toHaveBeenCalledWith('/partner/dashboard')
  })
})

// ─── updateCourse ──────────────────────────────────────────────────────────

describe('updateCourse', () => {
  it('returns error when not authenticated', async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authenticated.' })
  })

  it('returns error when partner record not found', async () => {
    mockGetPartnerByUserId.mockResolvedValue(null)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Partner account not found.' })
  })

  it('returns error when course not found or belongs to another partner', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([]), // no course found
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({ error: 'Not authorized.' })
  })

  it('returns error on validation failure', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([mockCourse]),
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const result = await updateCourse('course-xyz', makeFormData({ ...validFields, baseCreditCost: '5' })) // below min
    expect(result).toHaveProperty('error')
  })

  it('revalidates and returns {} on success', async () => {
    const selectMock = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue([mockCourse]),
    }
    vi.mocked(db.select).mockReturnValue(selectMock as any)
    const updateMock = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    }
    vi.mocked(db.update).mockReturnValue(updateMock as any)
    const result = await updateCourse('course-xyz', makeFormData(validFields))
    expect(result).toEqual({})
    expect(revalidatePath).toHaveBeenCalledWith('/partner/course')
  })
})
