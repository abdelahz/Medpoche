import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getPrelaunchMode } from '@/app/actions/settings'
import { ComingSoon } from '@/components/student/coming-soon'

export const metadata: Metadata = {
  title: 'Bientôt disponible — MedenPoche',
  robots: { index: false, follow: false },
}

/**
 * Pre-launch waiting page. Only shown to authenticated FREE-plan students while
 * pre-launch mode is on; everyone else is routed back to '/' (the role router).
 */
export default async function BientotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, prelaunch] = await Promise.all([
    supabase.from('profiles').select('is_admin, plan, prenom, full_name').eq('id', user.id).single(),
    getPrelaunchMode(),
  ])

  // Not gated (admin, paid plan, or launch happened) → back to the app.
  const isFree = (profile?.plan ?? 'gratuit') === 'gratuit'
  if (!prelaunch || profile?.is_admin || !isFree) redirect('/')

  const firstName = profile?.prenom?.trim() || profile?.full_name?.trim()?.split(' ')[0] || ''
  return <ComingSoon firstName={firstName} email={user.email ?? null} />
}
