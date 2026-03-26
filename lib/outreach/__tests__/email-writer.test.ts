import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTouchEmail } from '../email-writer'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}))

import { generateObject } from 'ai'

const mockGenerateObject = vi.mocked(generateObject)

beforeEach(() => vi.clearAllMocks())

describe('generateTouchEmail', () => {
  it('returns subject and body for touch 1', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        subject: 'Your Thursday morning slots at Fox Hollow',
        body: 'Hi John,\n\nQuick question — what happens to Fox Hollow\'s empty tee times?\n\nGimmelab fills them...\n\n— Dutch\nGimmelab · gimmelab.com',
      },
    } as never)

    const result = await generateTouchEmail(1, {
      gmName: 'John Brady',
      courseName: 'Fox Hollow Golf Club',
      estimatedMonthlyEarn: 1402,
      hook: 'Fox Hollow\'s weekday mornings are a natural fit.',
      rackRateAvg: 55,
    })

    expect(result.subject).toContain('Fox Hollow')
    expect(result.body).toContain('gimmelab.com')
  })

  it('returns subject and body for touch 2 with earnings', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        subject: 'What Fox Hollow could earn on Gimmelab',
        body: 'Hi John,\n\nFollowing up...\n\n$1,402/month for tee times that currently earn zero.\n\n— Dutch',
      },
    } as never)

    const result = await generateTouchEmail(2, {
      gmName: 'John Brady',
      courseName: 'Fox Hollow Golf Club',
      estimatedMonthlyEarn: 1402,
      hook: null,
      rackRateAvg: 55,
    })

    expect(result.subject).toBeTruthy()
    expect(result.body).toBeTruthy()
  })

  it('throws on invalid touch number', async () => {
    await expect(
      generateTouchEmail(4 as never, {
        gmName: null,
        courseName: 'Test Course',
        estimatedMonthlyEarn: null,
        hook: null,
        rackRateAvg: null,
      }),
    ).rejects.toThrow('Invalid touch number')
  })
})
