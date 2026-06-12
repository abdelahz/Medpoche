import { createClient } from '@/lib/supabase/server'
import { getWeeklyLeaderboard } from '@/lib/leaderboard'
import { LeaderboardView } from '@/components/student/leaderboard-view'
import { StudentContainer } from '@/components/student/student-container'

export default async function ClassementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const rows = await getWeeklyLeaderboard(supabase, 200)

  return (
    <StudentContainer>
      <LeaderboardView rows={rows} myUserId={user?.id ?? null} />
    </StudentContainer>
  )
}
