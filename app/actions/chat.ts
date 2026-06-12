'use server'

import { createClient } from '@/lib/supabase/server'

/** Persist a completed Q&A turn and return its id (for feedback). */
export async function saveChatTurn(
  question: string,
  answer: string
): Promise<{ id: number } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  if (!question.trim() || !answer.trim()) return { error: 'Contenu vide.' }

  const { data, error } = await supabase
    .from('chat_history')
    .insert({ user_id: user.id, question: question.trim(), answer: answer.trim() })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { id: data.id }
}

/** Set 👍 (1) / 👎 (-1) / cleared (null) feedback on a tutor answer. */
export async function setChatFeedback(
  id: number,
  value: 1 | -1 | null
): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  // RLS ("Users own chat") also scopes this, but match user_id explicitly too.
  const { error } = await supabase
    .from('chat_history')
    .update({ feedback: value })
    .eq('id', id)
    .eq('user_id', user.id)
  return { success: !error }
}
