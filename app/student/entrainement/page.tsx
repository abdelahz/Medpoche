import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWrongMcqIds } from '@/lib/mistakes'
import { getUserPlan, getMcqAllowance } from '@/lib/usage'
import { PLAN_LIMITS } from '@/lib/plans'
import type { PracticeFacet } from '@/types'
import { PracticeSetup } from '@/components/student/practice-setup'
import { StudentContainer } from '@/components/student/student-container'

export default async function EntrainementPage({
  searchParams,
}: {
  searchParams: { module?: string; favoris?: string; erreurs?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  // Facets of published QCMs. Read with the service role — students can't query
  // `mcqs` directly (RLS); these are non-sensitive metadata (matière/année/cours).
  const [facetsRes, bookmarkRes, wrongIds] = await Promise.all([
    createAdminClient().from('mcqs').select('module, year, subject, exam_blanc').eq('status', 'ready'),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    getWrongMcqIds(supabase, uid),
  ])

  const facets = (facetsRes.data ?? []) as PracticeFacet[]

  const plan = await getUserPlan(supabase, uid)
  const { remaining } = await getMcqAllowance(supabase, uid, plan)

  return (
    <StudentContainer>
      <PracticeSetup
        facets={facets}
        initialModule={searchParams.module}
        bookmarkCount={bookmarkRes.count ?? 0}
        mistakeCount={wrongIds.length}
        autoFavoris={searchParams.favoris === '1'}
        autoErreurs={searchParams.erreurs === '1'}
        mcqRemaining={remaining}
        canExamensBlancs={PLAN_LIMITS[plan].examensBlancs}
      />
    </StudentContainer>
  )
}
