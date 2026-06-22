'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { embedQuery, generateMcqExplanation, type ContextBlock } from '@/lib/gemini'
import type { ChunkMatch } from '@/types'

type ExplainResult = { explanation: string } | { error: string }

/**
 * On-demand AI explanation for a single QCM, behind the student "Explique avec
 * l'IA" button. The result is cached in `mcqs.ai_explanation` so it's generated
 * once per question and reused for every later click / student (cost + a
 * consistent answer). Students can't read `mcqs` directly (RLS) — we use the
 * service role for both the read and the cache write.
 */
export async function explainMcq(mcqId: number): Promise<ExplainResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const admin = createAdminClient()
  const { data: mcq } = await admin
    .from('mcqs')
    .select('question, option_a, option_b, option_c, option_d, option_e, correct, module, ai_explanation')
    .eq('id', mcqId)
    .single()

  if (!mcq) return { error: 'Question introuvable.' }
  // Cache hit — already explained once, reuse it.
  if (mcq.ai_explanation) return { explanation: mcq.ai_explanation as string }
  if (!mcq.correct) return { error: 'La bonne réponse de cette question est manquante.' }

  const options = [
    ['A', mcq.option_a],
    ['B', mcq.option_b],
    ['C', mcq.option_c],
    ['D', mcq.option_d],
    ['E', mcq.option_e],
  ]
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}) ${v}`)
    .join('\n')

  // Best-effort RAG grounding (same as the admin generator).
  let context: ContextBlock[] = []
  try {
    const embedding = await embedQuery(`${mcq.question}\n${options}`)
    const { data } = await admin.rpc('match_chunks', {
      query_embedding: embedding,
      match_count: 6,
      filter_module: mcq.module || null,
    })
    context = ((data ?? []) as ChunkMatch[])
      .filter((c) => c.similarity >= 0.4)
      .map((c) => ({ source: c.source_title ?? 'Document', page: c.page, content: c.content }))
  } catch {
    // ignore — generate from model knowledge
  }

  try {
    const explanation = await generateMcqExplanation({
      question: mcq.question,
      options,
      correct: mcq.correct,
      context,
    })
    if (!explanation) return { error: "L'IA n'a pas pu générer d'explication. Réessaie." }
    // Cache for next time (best-effort — still return the answer if the write fails).
    await admin.from('mcqs').update({ ai_explanation: explanation }).eq('id', mcqId)
    return { explanation }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Échec de la génération.' }
  }
}
