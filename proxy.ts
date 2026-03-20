import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// proxy.ts replaces middleware.ts in Next.js 16
// Runs on Node.js runtime — can use node:* modules

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must not write code between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Public routes — no auth needed ──────────────────────────────────────
  const publicPaths = ['/', '/pricing', '/about', '/partner', '/partner/apply', '/signup', '/login', '/welcome']
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/auth') || pathname.startsWith('/welcome') || pathname.startsWith('/api/'))

  // ── Unauthenticated: redirect to login ──────────────────────────────────
  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user) {
    return supabaseResponse
  }

  // Get role from user metadata
  const role = user.user_metadata?.role as string | undefined

  // ── Member routes (/dashboard, /book, /rounds, /credits, /courses, /account)
  const isMemberRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/rounds') ||
    pathname.startsWith('/credits') ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/account')

  // ── Partner routes (/partner/dashboard and below)
  const isPartnerRoute = pathname.startsWith('/partner/dashboard') ||
    pathname.startsWith('/partner/inventory') ||
    pathname.startsWith('/partner/bookings') ||
    pathname.startsWith('/partner/pricing') ||
    pathname.startsWith('/partner/payouts') ||
    pathname.startsWith('/partner/analytics') ||
    pathname.startsWith('/partner/profile') ||
    pathname.startsWith('/partner/settings')

  // ── Admin routes (/admin/*)
  const isAdminRoute = pathname.startsWith('/admin')

  // Role guards
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isPartnerRoute && role !== 'partner' && role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (isMemberRoute && !role) {
    // Authenticated but no role set yet — send to onboarding
    return NextResponse.redirect(new URL('/signup', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
