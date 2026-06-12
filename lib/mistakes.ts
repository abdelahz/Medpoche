import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * MCQ ids the student currently gets WRONG — i.e. whose most recent attempt
 * was incorrect. (If they later answer it right, it drops off.)
 */
export async function getWrongMcqIds(
  supabase: SupabaseClient,
  userId: string
): Promise<number[]> {
  const { data } = await supabase
    .from('mcq_attempts')
    .select('mcq_id, is_correct, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const latest = new Map<number, boolean>()
  for (const a of data ?? []) {
    if (!latest.has(a.mcq_id)) latest.set(a.mcq_id, Boolean(a.is_correct))
  }
  return Array.from(latest.entries())
    .filter(([, ok]) => !ok)
    .map(([id]) => id)
}
