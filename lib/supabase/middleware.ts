import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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

  // getUser() validates the token against Supabase (a network call). If that call
  // fails transiently (DNS/connect timeout, etc.) it returns user=null — which must
  // NOT be treated as "logged out". Surface the error so middleware can tell the
  // difference between "no session" and "couldn't reach the auth server".
  let user = null
  let authError: unknown = null
  try {
    const res = await supabase.auth.getUser()
    user = res.data.user
    authError = res.error
  } catch (err) {
    authError = err
  }

  return { supabaseResponse, user, authError, supabase }
}
