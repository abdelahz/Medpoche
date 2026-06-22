import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan } from '@/lib/usage'
import { PLAN_LIMITS } from '@/lib/plans'
import type { LibraryItem } from '@/types'
import { LibraryBrowser } from '@/components/student/library-browser'
import { StudentContainer } from '@/components/student/student-container'
import { LibraryTease } from '@/components/student/library-tease'

export default async function BibliothequePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const plan = await getUserPlan(supabase, user?.id ?? '')
  const hasLibrary = PLAN_LIMITS[plan].library

  // Free plans get a blurred teaser of the real catalogue (titles + counts) — no
  // file_url is read into it, so the files themselves stay gated. Metadata is
  // fetched with the service role so the preview shows even if RLS would hide it.
  if (!hasLibrary) {
    const { data } = await createAdminClient()
      .from('library')
      .select('id, title, type, module, subject, playlist, position, created_at')
      .order('created_at', { ascending: false })
    const items = (data ?? []).map((it) => ({ ...it, file_url: null })) as LibraryItem[]
    return (
      <StudentContainer wide>
        <LibraryTease items={items} />
      </StudentContainer>
    )
  }

  const { data } = await supabase
    .from('library')
    .select('id, title, type, module, subject, file_url, playlist, position, created_at')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as LibraryItem[]
  return (
    <StudentContainer wide>
      <LibraryBrowser items={items} />
    </StudentContainer>
  )
}
