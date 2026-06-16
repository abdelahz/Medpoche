import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resilientFetch } from './resilient-fetch'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Retry transient DNS/connect blips so a momentary network hiccup doesn't
      // surface as an app error (esp. the AI tutor's many Supabase calls).
      global: { fetch: resilientFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set here; middleware handles it
          }
        },
      },
    }
  )
}
