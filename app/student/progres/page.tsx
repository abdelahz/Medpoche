import { createClient } from '@/lib/supabase/server'
import { getWrongMcqIds } from '@/lib/mistakes'
import { COURS_BY_MATIERE } from '@/types'
import { computeStreak } from '@/lib/gamification'
import { ProgressView } from '@/components/student/progress-view'
import { StudentContainer } from '@/components/student/student-container'

const ALL_COURS = new Set(Object.values(COURS_BY_MATIERE).flat())
const TOTAL_COURS = ALL_COURS.size

export default async function ProgresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const uid = user?.id ?? ''
  const [attemptsRes, bookmarkRes, wrongIds] = await Promise.all([
    supabase
      .from('mcq_attempts')
      .select('is_correct, created_at, mcqs(module, subject)')
      .eq('user_id', uid),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    getWrongMcqIds(supabase, uid),
  ])

  const rows = (attemptsRes.data ?? []) as unknown as {
    is_correct: boolean | null
    created_at: string
    mcqs: { module: string | null; subject: string | null } | null
  }[]

  const total = rows.length
  const correct = rows.filter((r) => r.is_correct).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  const byModule = new Map<string, { total: number; correct: number }>()
  const dateKeys = new Set<string>()
  const coursSeen = new Set<string>()
  for (const r of rows) {
    dateKeys.add(new Date(r.created_at).toISOString().slice(0, 10))
    if (r.mcqs?.subject && ALL_COURS.has(r.mcqs.subject)) coursSeen.add(r.mcqs.subject)
    const mod = r.mcqs?.module
    if (mod) {
      const cur = byModule.get(mod) ?? { total: 0, correct: 0 }
      cur.total++
      if (r.is_correct) cur.correct++
      byModule.set(mod, cur)
    }
  }

  const mastery = Object.fromEntries(
    Array.from(byModule.entries()).map(([m, s]) => [
      m,
      { pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0, total: s.total },
    ])
  )

  return (
    <StudentContainer>
      <ProgressView
        total={total}
        accuracy={accuracy}
        streak={computeStreak(dateKeys)}
        bookmarkCount={bookmarkRes.count ?? 0}
        mistakeCount={wrongIds.length}
        coursSeen={coursSeen.size}
        coursTotal={TOTAL_COURS}
        mastery={mastery}
      />
    </StudentContainer>
  )
}
