import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeaderboardRow } from '@/types'

interface RawRow {
  rank: number | string
  user_id: string
  display: string | null
  filiere: string | null
  xp: number | string
}

/** Fetch the live weekly leaderboard via the security-definer RPC. */
export async function getWeeklyLeaderboard(
  supabase: SupabaseClient,
  limit = 100
): Promise<LeaderboardRow[]> {
  const { data } = await supabase.rpc('weekly_leaderboard', { p_limit: limit })
  return ((data ?? []) as RawRow[]).map((r) => ({
    rank: Number(r.rank),
    user_id: r.user_id,
    display: r.display ?? 'Élève',
    filiere: r.filiere ?? null,
    xp: Number(r.xp),
  }))
}
