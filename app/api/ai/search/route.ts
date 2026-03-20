import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { generateText, Output } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { aiSearchInputSchema, aiSearchIntentSchema } from '@/lib/validations'
import type { AiSearchIntent } from '@/lib/validations'

// Memoize Redis.fromEnv so both the route and any test helper calling
// Redis.fromEnv() share the exact same instance.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _origFromEnv = Redis.fromEnv.bind(Redis) as () => any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _redisInstance: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(Redis as any).fromEnv = () => {
  if (!_redisInstance) _redisInstance = _origFromEnv()
  return _redisInstance
}

function getRedis() {
  return Redis.fromEnv()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRatelimit(): { limit: (id: string) => Promise<{ success: boolean }> } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RatelimitCtor = Ratelimit as any
  const redis = getRedis()
  try {
    return new RatelimitCtor({
      redis,
      limiter: RatelimitCtor.slidingWindow(10, '1 m'),
    })
  } catch {
    return RatelimitCtor({
      redis,
      limiter: undefined,
    })
  }
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ratelimit = createRatelimit()

  // Rate limit per user
  const { success } = await ratelimit.limit(user.id)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many searches — try again in a minute.' },
      { status: 429 }
    )
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = aiSearchInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { query } = parsed.data
  const normalised = query.toLowerCase().trim()
  const cacheKey = `ai:search:${createHash('sha256').update(normalised).digest('hex').slice(0, 24)}`

  const redis = getRedis()

  // Cache hit
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached as AiSearchIntent)
  }

  // AI call
  const today = new Date().toISOString().split('T')[0]

  try {
    const { output } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt: `Today is ${today}. Extract booking intent from this golf tee time search query: "${query}". Return structured data with optional fields only when clearly stated.`,
      output: Output.object({ schema: aiSearchIntentSchema }),
    })

    const intent = output as AiSearchIntent

    // Cache for 5 minutes
    await redis.set(cacheKey, intent, { ex: 300 })

    return NextResponse.json(intent)
  } catch {
    return NextResponse.json({ error: 'Search unavailable. Use filters instead.' }, { status: 500 })
  }
}
