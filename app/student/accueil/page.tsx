import { createClient } from '@/lib/supabase/server'
import { getWrongMcqIds } from '@/lib/mistakes'
import { getWeeklyLeaderboard } from '@/lib/leaderboard'
import { MODULES } from '@/components/student/primitives'
import { computeStreak, computeXp, levelFromXp, computeBadges, DAILY_GOAL } from '@/lib/gamification'
import type { Plan } from '@/types'
import { AccueilView } from '@/components/student/accueil-view'

export default async function AccueilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const [profileRes, attemptsRes, readyRes, bookmarkRes, wrongIds, lbRows] = await Promise.all([
    supabase.from('profiles').select('full_name, plan').eq('id', uid).single(),
    supabase.from('mcq_attempts').select('is_correct, created_at, mcqs(module)').eq('user_id', uid),
    supabase.from('mcqs').select('module').eq('status', 'ready'),
    supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    getWrongMcqIds(supabase, uid),
    getWeeklyLeaderboard(supabase, 50),
  ])

  const myLbRow = lbRows.find((r) => r.user_id === uid)

  const fullName = profileRes.data?.full_name ?? null
  const firstName = fullName?.split(' ')[0] ?? 'étudiant'
  const plan = (profileRes.data?.plan as Plan) ?? 'gratuit'

  const rows = (attemptsRes.data ?? []) as unknown as {
    is_correct: boolean | null
    created_at: string
    mcqs: { module: string | null } | null
  }[]

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const dateKeys = new Set<string>()
  const byModule = new Map<string, { total: number; correct: number }>()
  let todayCount = 0
  let correctTotal = 0
  for (const r of rows) {
    dateKeys.add(new Date(r.created_at).toISOString().slice(0, 10))
    if (new Date(r.created_at) >= startOfDay) todayCount++
    if (r.is_correct) correctTotal++
    const mod = r.mcqs?.module
    if (mod) {
      const cur = byModule.get(mod) ?? { total: 0, correct: 0 }
      cur.total++
      if (r.is_correct) cur.correct++
      byModule.set(mod, cur)
    }
  }

  const total = rows.length
  const accuracy = total > 0 ? Math.round((correctTotal / total) * 100) : 0
  const streak = computeStreak(dateKeys)
  const xp = computeXp(rows)
  const { level, xpInLevel, xpToNext } = levelFromXp(xp)

  const ready = (readyRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
    if (r.module) acc[r.module] = (acc[r.module] ?? 0) + 1
    return acc
  }, {})

  const modules = MODULES.map((name) => {
    const m = byModule.get(name)
    return {
      name,
      pct: m && m.total >= 1 ? Math.round((m.correct / m.total) * 100) : null,
      ready: ready[name] ?? 0,
    }
  })

  // Recommend the weakest practised matière (≥3 attempts); else the first with QCMs.
  let recommendModule: string | null = null
  let worstPct = Infinity
  for (const n of MODULES) {
    const m = byModule.get(n)
    if (m && m.total >= 3) {
      const pct = m.correct / m.total
      if (pct < worstPct) {
        worstPct = pct
        recommendModule = n
      }
    }
  }
  if (!recommendModule) {
    recommendModule = MODULES.find((n) => (ready[n] ?? 0) > 0) ?? null
  }

  const hasMasteredModule = Array.from(byModule.values()).some(
    (m) => m.total >= 20 && m.correct / m.total >= 0.8
  )

  return (
    <AccueilView
      firstName={firstName}
      fullName={fullName}
      plan={plan}
      streak={streak}
      level={level}
      xp={xp}
      xpInLevel={xpInLevel}
      xpToNext={xpToNext}
      accuracy={accuracy}
      todayCount={todayCount}
      dailyGoal={DAILY_GOAL}
      recommendModule={recommendModule}
      modules={modules}
      mistakeCount={wrongIds.length}
      bookmarkCount={bookmarkRes.count ?? 0}
      badges={computeBadges({ streak, total, hasMasteredModule })}
      leaderboard={{ top: lbRows.slice(0, 3), myRank: myLbRow?.rank ?? null, myXp: myLbRow?.xp ?? 0 }}
    />
  )
}
