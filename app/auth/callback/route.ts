import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Honour an internal `next` (e.g. the password-recovery flow → reset page).
  // Only same-origin paths are allowed, to prevent an open redirect.
  const next = searchParams.get('next')
  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

  // '/' is the role router → admins land on /admin, students on /student.
  return NextResponse.redirect(`${origin}${dest}`)
}
