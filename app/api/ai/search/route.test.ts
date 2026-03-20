import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })) },
}))
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({ success: true }),
  })),
}))
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return { ...actual, generateText: vi.fn(), Output: { object: vi.fn() } }
})
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}))

import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { generateText } from 'ai'
import { POST } from './route'

const mockUser = { id: 'user-123' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }) },
  } as any)
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/ai/search', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/ai/search', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as any)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    const res = await POST(makeRequest({ query: '' }))
    expect(res.status).toBe(400)
  })

  it('returns cached result on cache hit', async () => {
    const cached = { timeOfDay: 'morning', dateRange: { start: '2026-03-21', end: '2026-03-21' } }
    const redis = Redis.fromEnv()
    vi.mocked(redis.get).mockResolvedValue(cached)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    const data = await res.json()
    expect(data).toEqual(cached)
    expect(generateText).not.toHaveBeenCalled()
  })

  it('calls AI and caches on cache miss', async () => {
    const intent = { timeOfDay: 'morning' as const }
    const redis = Redis.fromEnv()
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(generateText).mockResolvedValue({ output: intent } as any)
    const res = await POST(makeRequest({ query: 'saturday morning' }))
    const data = await res.json()
    expect(data).toEqual(intent)
    expect(redis.set).toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    const { Ratelimit } = await import('@upstash/ratelimit')
    vi.mocked(Ratelimit).mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue({ success: false }),
    }) as any)
    const res = await POST(makeRequest({ query: 'morning round' }))
    expect(res.status).toBe(429)
  })
})
