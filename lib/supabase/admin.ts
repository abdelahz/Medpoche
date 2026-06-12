import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS and can use the Auth Admin API.
 * SERVER-ONLY — never import this in a client component. Every caller MUST
 * verify the requester is an admin first. Used only where RLS can't reach:
 * deleting an auth user account.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || serviceKey === 'your_service_role_key') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY est manquant ou non configuré.')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
