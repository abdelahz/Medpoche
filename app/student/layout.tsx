import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPrelaunchMode } from '@/app/actions/settings'
import type { Plan } from '@/types'
import { BottomNav } from '@/components/student/bottom-nav'
import { StudentSidebar } from '@/components/student/student-sidebar'
import { UpgradePopup } from '@/components/student/upgrade-popup'
import { UpgradePendingBanner } from '@/components/student/upgrade-pending'
import { Onboarding } from '@/components/student/onboarding'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, is_admin, prenom, nom, filiere, phone')
    .eq('id', user?.id ?? '')
    .single()

  const plan = (profile?.plan as Plan) ?? 'gratuit'

  // Pre-launch: free-plan students wait on /bientot. Admins (previewing the
  // student app) and paid plans pass through.
  if (!profile?.is_admin && plan === 'gratuit' && (await getPrelaunchMode())) {
    redirect('/bientot')
  }

  return (
    <div className="min-h-screen lg:flex bg-[color:var(--gray-50)] lg:bg-white">
      <UpgradePopup plan={plan} />
      {!profile?.is_admin && (
        <Onboarding
          prenom={(profile?.prenom as string | null) ?? null}
          nom={(profile?.nom as string | null) ?? null}
          filiere={(profile?.filiere as string | null) ?? null}
          phone={(profile?.phone as string | null) ?? null}
        />
      )}
      {/* Laptop: white left sidebar. Hidden on phones. */}
      <StudentSidebar fullName={profile?.full_name ?? null} plan={plan} />

      {/* App content — framed phone column on mobile, full content area on laptop. */}
      <div
        className="relative w-full min-h-screen mx-auto max-w-[480px] pb-[60px] border-x-[0.5px] border-[color:var(--gray-200)] bg-white
                   lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:pb-0 lg:border-x-0"
      >
        <UpgradePendingBanner plan={plan} />
        {children}
        <BottomNav />
      </div>
    </div>
  )
}
