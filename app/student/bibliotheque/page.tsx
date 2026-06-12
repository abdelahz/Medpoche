import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/usage'
import { PLAN_LIMITS } from '@/lib/plans'
import type { LibraryItem } from '@/types'
import { LibraryBrowser } from '@/components/student/library-browser'
import { StudentContainer } from '@/components/student/student-container'
import { PlanLock } from '@/components/student/plan-lock'

export default async function BibliothequePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const plan = await getUserPlan(supabase, user?.id ?? '')
  // The library is a Basic+ feature — free plans see a friendly lock.
  if (!PLAN_LIMITS[plan].library) {
    return (
      <StudentContainer wide>
        <PlanLock
          title="Bibliothèque"
          heading="La bibliothèque est réservée aux abonnés"
          message="Passe à un plan Basic ou Premium pour accéder aux cours, résumés, fiches et annales."
        />
      </StudentContainer>
    )
  }

  const { data } = await supabase
    .from('library')
    .select('id, title, type, module, subject, file_url, created_at')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as LibraryItem[]
  return (
    <StudentContainer wide>
      <LibraryBrowser items={items} />
    </StudentContainer>
  )
}
