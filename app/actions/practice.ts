'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWrongMcqIds } from '@/lib/mistakes'
import { computeStreak, computeXp } from '@/lib/gamification'
import { getUserPlan, getMcqAllowance, capToRemaining } from '@/lib/usage'
import { PLAN_LIMITS } from '@/lib/plans'
import { MODULES } from '@/types'
import type { PracticeQuestion } from '@/types'

const PRACTICE_COLS =
  'id, question, option_a, option_b, option_c, option_d, option_e, correct, explanation, module, has_list, image_required'

export type PracticeFilter = {
  module?: string | null // null/undefined = all 4 matières
  year?: number
  subject?: string
  exam_blanc?: string
}

const POOL_LIMIT = 200 // rows fetched before shuffle + cap

/**
 * Max questions per session, by mode:
 * - par cours (a chosen topic) → 10
 * - par année / examen blanc, single matière → 20
 * - par année / examen blanc, "Les 4 matières" (no module) → 80
 * These are MAXIMUMS — a set is simply however many ready QCMs exist, up to the cap.
 */
function sessionCap(filter: PracticeFilter): number {
  if (filter.subject) return 10
  return filter.module ? 20 : 80
}

const QUICK_SERIES_SIZE = 10

/** Current daily streak for the signed-in student (for the end-of-session celebration). */
export async function getStreak(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0
  const { data } = await supabase
    .from('mcq_attempts')
    .select('created_at')
    .eq('user_id', user.id)
  const dateKeys = new Set<string>()
  for (const r of data ?? []) dateKeys.add(new Date(r.created_at as string).toISOString().slice(0, 10))
  return computeStreak(dateKeys)
}

export interface SessionWrapup {
  /** Consecutive active days (incl. today after this session). */
  streak: number
  /** QCMs answered today (for the daily-goal ring). */
  todayCount: number
  /** Lifetime XP, including this session's just-recorded attempts. */
  totalXp: number
}

/**
 * One-shot end-of-session snapshot for the celebration screen: streak, today's
 * QCM count, and lifetime XP — all derived from `mcq_attempts` in a single read.
 * Called once the set is finished (attempts are already recorded by then).
 */
export async function getSessionWrapup(): Promise<SessionWrapup> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { streak: 0, todayCount: 0, totalXp: 0 }

  const { data } = await supabase
    .from('mcq_attempts')
    .select('created_at, is_correct')
    .eq('user_id', user.id)

  const rows = data ?? []
  const todayKey = new Date().toISOString().slice(0, 10)
  const dateKeys = new Set<string>()
  let todayCount = 0
  for (const r of rows) {
    const day = new Date(r.created_at as string).toISOString().slice(0, 10)
    dateKeys.add(day)
    if (day === todayKey) todayCount++
  }

  return {
    streak: computeStreak(dateKeys),
    todayCount,
    totalXp: computeXp(rows as { is_correct: boolean | null }[]),
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type PoolRow = Row & { year: number | null; exam_blanc: string | null; position: number | null }

/** Drop the grouping-only columns, leaving a clean practice Row. */
function stripPoolRow(r: PoolRow): Row {
  return {
    id: r.id,
    question: r.question,
    option_a: r.option_a,
    option_b: r.option_b,
    option_c: r.option_c,
    option_d: r.option_d,
    option_e: r.option_e,
    correct: r.correct,
    explanation: r.explanation,
    module: r.module,
    has_list: r.has_list,
    image_required: r.image_required,
  }
}

/**
 * Group rows by their source exam (année + examen blanc), each group ordered by
 * `position` so a same-exam sequence keeps its original order. Questions with no
 * exam source each form a singleton group so they still shuffle freely. The
 * caller shuffles the GROUPS — keeping same-exam runs intact while randomising
 * which exam's block comes first.
 */
function groupBySourceExam(rows: PoolRow[]): Row[][] {
  const byExam = new Map<string, PoolRow[]>()
  const singletons: Row[][] = []
  for (const r of rows) {
    const hasExam = r.year != null || (r.exam_blanc != null && r.exam_blanc !== '')
    if (!hasExam) {
      singletons.push([stripPoolRow(r)])
      continue
    }
    const key = `${r.year ?? ''}|${r.exam_blanc ?? ''}`
    const g = byExam.get(key)
    if (g) g.push(r)
    else byExam.set(key, [r])
  }
  const examGroups = Array.from(byExam.values()).map((g) =>
    g.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity)).map(stripPoolRow)
  )
  return [...examGroups, ...singletons]
}

/**
 * Fetch ready QCMs for a practice session (shuffled). RLS already restricts
 * non-admins to status='ready', so students only ever get published questions.
 */
export async function getPracticeQuestions(
  filter: PracticeFilter
): Promise<PracticeQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getUserPlan(supabase, user.id)
  // Examens blancs are a Basic+ feature.
  if (filter.exam_blanc && !PLAN_LIMITS[plan].examensBlancs) return []

  // Daily QCM cap (per plan). 0 left → nothing to serve (the UI shows the lock).
  const { remaining } = await getMcqAllowance(supabase, user.id, plan)
  if (remaining === 0) return []

  // MCQ content is read with the service role: students can't query `mcqs`
  // directly (RLS), so the per-plan daily cap above is the only path to questions.
  const mdb = createAdminClient()
  let query = mdb.from('mcqs').select(PRACTICE_COLS).eq('status', 'ready')

  if (filter.module) query = query.eq('module', filter.module)
  if (filter.year) query = query.eq('year', filter.year)
  if (filter.subject) query = query.eq('subject', filter.subject)
  if (filter.exam_blanc) query = query.eq('exam_blanc', filter.exam_blanc)

  const cap = sessionCap(filter)

  // Année / examen blanc = a real mock → keep the exam order (no shuffle).
  if (filter.year || filter.exam_blanc) {
    const { data } = await query.order('position', { ascending: true, nullsFirst: false }).limit(cap)
    const marked = await markBookmarked(supabase, user.id, (data ?? []) as Row[])
    return capToRemaining(marked, remaining)
  }

  // Practice modes hors examen (par cours, par matière) : on garde les questions
  // d'un même examen dans leur ordre d'origine et on ne mélange que l'ordre des
  // examens entre eux — une suite de questions liées d'un même examen n'est jamais
  // éparpillée. (Le plafond `cap` peut tronquer le dernier bloc — compromis assumé.)
  let groupQuery = mdb
    .from('mcqs')
    .select(`${PRACTICE_COLS}, year, exam_blanc, position`)
    .eq('status', 'ready')
  if (filter.module) groupQuery = groupQuery.eq('module', filter.module)
  if (filter.subject) groupQuery = groupQuery.eq('subject', filter.subject)
  const { data } = await groupQuery.limit(POOL_LIMIT)

  const ordered = shuffle(groupBySourceExam((data ?? []) as PoolRow[])).flat().slice(0, cap)
  const marked = await markBookmarked(supabase, user.id, ordered)
  return capToRemaining(marked, remaining)
}

const PER_MATIERE = 20 // questions per matière in a full "Les 4" exam session

/**
 * An année / examen-blanc session across ALL matières, played in a student-chosen
 * matière order. Each matière is internally ordered by `position` (1..N, capped at
 * PER_MATIERE); the groups are concatenated in `order`, with any matière not listed
 * appended in default MODULES order.
 */
export async function getExamSession(
  filter: { year?: number; exam_blanc?: string },
  order: string[]
): Promise<PracticeQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getUserPlan(supabase, user.id)
  if (filter.exam_blanc && !PLAN_LIMITS[plan].examensBlancs) return []
  const { remaining } = await getMcqAllowance(supabase, user.id, plan)
  if (remaining === 0) return []

  const mdb = createAdminClient()
  let query = mdb.from('mcqs').select(`${PRACTICE_COLS}, position`).eq('status', 'ready')
  if (filter.year) query = query.eq('year', filter.year)
  if (filter.exam_blanc) query = query.eq('exam_blanc', filter.exam_blanc)

  const { data } = await query
  const rows = (data ?? []) as (Row & { position: number | null })[]

  // Group by matière.
  const byModule = new Map<string, (Row & { position: number | null })[]>()
  for (const r of rows) {
    const key = r.module ?? '—'
    const list = byModule.get(key) ?? []
    list.push(r)
    byModule.set(key, list)
  }

  // Chosen matières first (de-duped), then any remaining in default MODULES order.
  const seen = new Set<string>()
  const sequence: string[] = []
  for (const m of [...order, ...MODULES]) {
    if (!seen.has(m) && byModule.has(m)) {
      sequence.push(m)
      seen.add(m)
    }
  }

  const ordered: (Row & { position: number | null })[] = []
  for (const m of sequence) {
    const group = (byModule.get(m) ?? [])
      .slice()
      .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))
      .slice(0, PER_MATIERE)
    ordered.push(...group)
  }

  const marked = await markBookmarked(supabase, user.id, ordered as Row[])
  return capToRemaining(marked, remaining)
}

/**
 * A one-tap quick series for a matière (10 QCM): the student's common MISTAKES in
 * that matière first, topped up with fresh ready questions. "The fun points at
 * your weaknesses."
 */
export async function getMatiereQuickSeries(module: string): Promise<PracticeQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getUserPlan(supabase, user.id)
  const { remaining } = await getMcqAllowance(supabase, user.id, plan)
  if (remaining === 0) return []

  const mdb = createAdminClient()
  const { data } = await mdb
    .from('mcqs')
    .select(PRACTICE_COLS)
    .eq('status', 'ready')
    .eq('module', module)
  const rows = (data ?? []) as Row[]
  if (rows.length === 0) return []

  const wrongIds = new Set(await getWrongMcqIds(supabase, user.id))
  const mistakes = shuffle(rows.filter((r) => wrongIds.has(r.id)))
  const fresh = shuffle(rows.filter((r) => !wrongIds.has(r.id)))
  const picked = [...mistakes, ...fresh].slice(0, QUICK_SERIES_SIZE)
  const marked = await markBookmarked(supabase, user.id, shuffle(picked))
  return capToRemaining(marked, remaining)
}

type Row = Omit<PracticeQuestion, 'bookmarked'>

async function markBookmarked(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  rows: Row[]
): Promise<PracticeQuestion[]> {
  const { data: marks } = await supabase
    .from('bookmarks')
    .select('mcq_id')
    .eq('user_id', userId)
    .in('mcq_id', rows.map((r) => r.id))
  const bookmarkedIds = new Set((marks ?? []).map((m) => m.mcq_id))
  return rows.map((r) => ({ ...r, bookmarked: bookmarkedIds.has(r.id) }))
}

/** A review session of QCMs the student currently gets wrong (latest attempt incorrect). */
export async function getMistakeQuestions(): Promise<PracticeQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getUserPlan(supabase, user.id)
  const { remaining } = await getMcqAllowance(supabase, user.id, plan)
  if (remaining === 0) return []

  const wrongIds = await getWrongMcqIds(supabase, user.id)
  if (wrongIds.length === 0) return []

  const mdb = createAdminClient()
  const { data } = await mdb
    .from('mcqs')
    .select(PRACTICE_COLS)
    .eq('status', 'ready')
    .in('id', wrongIds)

  const marked = await markBookmarked(supabase, user.id, (data ?? []) as Row[])
  return capToRemaining(shuffle(marked), remaining)
}

/**
 * Record a single answer. `is_correct` is recomputed server-side from the
 * stored answer (authoritative — the client can't fake a correct attempt).
 */
export async function recordAttempt(
  mcqId: number,
  selected: string
): Promise<{ isCorrect: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: mcq } = await createAdminClient().from('mcqs').select('correct').eq('id', mcqId).single()
  if (!mcq) return { error: 'Question introuvable.' }

  const isCorrect = (mcq.correct ?? '').trim().toUpperCase() === selected.trim().toUpperCase()

  await supabase.from('mcq_attempts').insert({
    user_id: user.id,
    mcq_id: mcqId,
    selected,
    is_correct: isCorrect,
  })

  return { isCorrect }
}
