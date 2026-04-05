/**
 * Safely normalize a user-supplied `redirectTo` value so we only ever send
 * the user to a same-origin path.
 *
 * Open-redirect guard: rejects absolute URLs, protocol-relative URLs (`//...`),
 * and anything that doesn't start with a single `/`. Returns null for
 * anything unsafe so callers can fall back to their default.
 */
export function safeRedirect(value: string | null | undefined): string | null {
  if (!value) return null
  if (typeof value !== 'string') return null
  // Must start with exactly one slash (not `//example.com`) and no scheme
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.startsWith('/\\')) return null
  // Don't allow a redirect straight back to an auth page (infinite loop)
  if (value === '/login' || value.startsWith('/login?')) return null
  if (value === '/signup' || value.startsWith('/signup?')) return null
  if (value.startsWith('/auth/')) return null
  return value
}
