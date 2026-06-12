'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserPlan, getMcqAllowance, capToRemaining } from '@/lib/usage'
import type { PracticeQuestion } from '@/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Add or remove a bookmark for the current student. Returns the new state. */
export async function toggleBookmark(
  mcqId: number
): Promise<{ bookmarked: boolean } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('mcq_id', mcqId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id)
    if (error) return { error: error.message }
    return { bookmarked: false }
  }

  const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, mcq_id: mcqId })
  if (error) return { error: error.message }
  return { bookmarked: true }
}

/** Fetch the student's bookmarked (and still published) QCMs for a review session. */
export async function getBookmarkedQuestions(): Promise<PracticeQuestion[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const plan = await getUserPlan(supabase, user.id)
  const { remaining } = await getMcqAllowance(supabase, user.id, plan)
  if (remaining === 0) return []

  const { data: marks } = await supabase
    .from('bookmarks')
    .select('mcq_id')
    .eq('user_id', user.id)
  const ids = (marks ?? []).map((m) => m.mcq_id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('mcqs')
    .select('id, question, option_a, option_b, option_c, option_d, option_e, correct, explanation, module, has_list, image_required')
    .eq('status', 'ready')
    .in('id', ids)

  const shuffled = shuffle((data ?? []).map((q) => ({ ...q, bookmarked: true }))) as PracticeQuestion[]
  return capToRemaining(shuffled, remaining)
}
