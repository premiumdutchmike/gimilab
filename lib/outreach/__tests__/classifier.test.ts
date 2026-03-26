import { describe, it, expect, vi, beforeEach } from 'vitest'
import { classifyCourse } from '../classifier'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}))

import { generateObject } from 'ai'

const mockGenerateObject = vi.mocked(generateObject)

beforeEach(() => vi.clearAllMocks())

describe('classifyCourse', () => {
  it('returns classification from Claude response', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        courseType: 'municipal',
        holes: '18',
        isDrivingRange: false,
        skipReason: null,
        hook: 'Cobbs Creek has ideal off-peak capacity for the Gimmelab model.',
      },
    } as never)

    const result = await classifyCourse('Cobbs Creek Golf Course', 'city-owned 18-hole public course green fees $35 weekday', 'Cobbs Creek Golf Course')
    expect(result.courseType).toBe('municipal')
    expect(result.holes).toBe('18')
    expect(result.isDrivingRange).toBe(false)
    expect(result.hook).toContain('Cobbs Creek')
  })

  it('returns isDrivingRange true when Claude says so', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        courseType: 'public',
        holes: null,
        isDrivingRange: true,
        skipReason: 'Driving range only — no tee times available',
        hook: null,
      },
    } as never)

    const result = await classifyCourse('Swing Zone Range', 'bucket of balls range mats', 'Swing Zone')
    expect(result.isDrivingRange).toBe(true)
    expect(result.skipReason).toBeTruthy()
  })
})
