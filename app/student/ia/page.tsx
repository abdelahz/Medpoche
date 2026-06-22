import { createClient } from '@/lib/supabase/server'
import { getQuotaSnapshot, getAiUsageAllTime } from '@/lib/usage'
import { PLAN_LIMITS, FREE_TEASER_AI, isUnlimited } from '@/lib/plans'
import type { Plan } from '@/types'
import { TutorChat, type ChatMessage } from '@/components/student/tutor-chat'
import { PlanLock } from '@/components/student/plan-lock'

export default async function IaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data }, { data: profile }] = await Promise.all([
    supabase
      .from('chat_history')
      .select('id, question, answer, feedback, created_at')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: true })
      .limit(30),
    supabase.from('profiles').select('plan').eq('id', user?.id ?? '').single(),
  ])

  const plan = ((profile?.plan as Plan) ?? 'gratuit') as Plan

  const initial: ChatMessage[] = []
  for (const row of data ?? []) {
    if (row.question) initial.push({ role: 'user', content: row.question })
    if (row.answer)
      initial.push({
        role: 'assistant',
        content: row.answer,
        chatId: row.id,
        feedback: (row.feedback as 1 | -1 | null) ?? null,
      })
  }

  // The AI tutor is a Basic+ feature, but free plans get a small lifetime taste
  // of it (text only) before the lock — to let them feel the value first.
  const aiLimit = PLAN_LIMITS[plan].aiMessages
  if (!isUnlimited(aiLimit) && aiLimit === 0) {
    const usedAllTime = user ? await getAiUsageAllTime(supabase, user.id) : FREE_TEASER_AI
    const teaserLeft = Math.max(0, FREE_TEASER_AI - usedAllTime)
    if (teaserLeft === 0) {
      return (
        <PlanLock
          title="Assistant IA"
          heading="Tu as utilisé tes questions IA offertes 🎁"
          message="Passe à un plan Basic ou Premium pour continuer à poser tes questions au tuteur IA, en texte ou en photo."
        />
      )
    }
    return (
      <TutorChat
        initial={initial}
        quota={{ plan, messagesLeft: teaserLeft, photosLeft: 0 }}
        teaser
      />
    )
  }

  const quota = user ? await getQuotaSnapshot(supabase, user.id, plan) : null
  return <TutorChat initial={initial} quota={quota} />
}
