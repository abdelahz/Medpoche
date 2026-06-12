import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const supabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http') ?? false

// When we redirect, we must carry the refreshed auth cookies from supabaseResponse,
// otherwise the new access token set during updateSession gets lost.
function redirectWith(url: URL, authResponse: NextResponse): NextResponse {
  const res = NextResponse.redirect(url)
  authResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
    res.cookies.set(name, value, opts)
  })
  return res
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!supabaseConfigured) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, authError } = await updateSession(request)

  // Auth routes: already-authenticated users go to the role router at '/'.
  // Exception: the password-reset page must stay reachable WITH a session — the
  // recovery link authenticates the user, who then sets a new password there.
  if (pathname.startsWith('/auth/')) {
    if (user && !pathname.startsWith('/auth/reset-password')) {
      return redirectWith(new URL('/', request.url), supabaseResponse)
    }
    return supabaseResponse
  }

  // Protected routes: auth check only — role check is in layouts (Node.js runtime)
  if (pathname.startsWith('/admin/') || pathname.startsWith('/student/')) {
    if (!user) {
      // Don't sign a valid user out over a transient failure to reach Supabase
      // (DNS/connect timeout). Only redirect on a genuine "no session".
      if (isTransientAuthError(authError)) {
        return supabaseResponse
      }
      return redirectWith(new URL('/auth/login', request.url), supabaseResponse)
    }
    return supabaseResponse
  }

  return supabaseResponse
}

/** A network/connectivity failure (not a genuine "no session" / invalid token). */
function isTransientAuthError(err: unknown): boolean {
  if (!err) return false
  const e = err as { name?: string; message?: string; status?: number }
  const name = e.name ?? ''
  // A real missing/invalid session — treat as logged out.
  if (name === 'AuthSessionMissingError') return false
  if (typeof e.status === 'number' && e.status >= 400 && e.status < 500) return false
  const text = `${name} ${e.message ?? String(err)}`
  return /AuthRetryableFetchError|fetch failed|network|timeout|aborted|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|UND_ERR/i.test(
    text
  )
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
