'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedMCQ, FlagValue, ChunkMatch } from '@/types'
import { embedQuery, generateMcqExplanation, type ContextBlock } from '@/lib/gemini'

type SaveResult = { success: true; count: number } | { success: false; error: string }
type ActionResult = { success: true } | { success: false; error: string }

/** Editor field payload — same shape as an extracted MCQ. */
export type McqInput = ExtractedMCQ

/** True if any question/option text embeds an image (base64 data URL). */
function hasEmbeddedImage(m: McqInput): boolean {
  return [m.question, m.option_a, m.option_b, m.option_c, m.option_d, m.option_e].some(
    (t) => typeof t === 'string' && t.includes('data:image')
  )
}

/**
 * Derive review flags from MCQ content. `image_required` only flags while no
 * image is actually embedded yet — it auto-clears once the admin adds one.
 */
function deriveFlags(m: McqInput): FlagValue[] {
  const flags: FlagValue[] = []
  if (m.image_required && !hasEmbeddedImage(m)) flags.push('image_required')
  if (!m.correct) flags.push('missing_correction')
  if (!m.module) flags.push('low_confidence_module')
  return flags
}

/** Resolve the current user and confirm they are an admin. */
async function requireAdmin(
  supabase: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) return { ok: false, error: 'Accès réservé aux administrateurs.' }
  return { ok: true }
}

/** Map an editor/extracted MCQ to a DB row (without status). */
function toRow(m: McqInput) {
  return {
    question: m.question,
    has_list: m.has_list,
    image_required: m.image_required,
    option_a: m.option_a,
    option_b: m.option_b,
    option_c: m.option_c,
    option_d: m.option_d,
    option_e: m.option_e || null,
    correct: m.correct,
    explanation: m.explanation || null,
    module: m.module || null,
    subject: m.subject || null,
    year: m.year,
    exam_blanc: m.exam_blanc || null,
    position: m.position ?? null,
    flags: deriveFlags(m),
  }
}

/**
 * Insert reviewed/extracted MCQs into the database with status 'flagged'
 * (they enter the review queue). Admin-gated; revalidates the QCMs page.
 */
export async function saveMcqs(mcqs: ExtractedMCQ[]): Promise<SaveResult> {
  if (!Array.isArray(mcqs) || mcqs.length === 0) {
    return { success: false, error: 'Aucun QCM à importer.' }
  }

  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  // position = order WITHIN each matière (counter reset per module), so every
  // matière reads 1..N inside a year / examen blanc. An explicit position wins.
  const perModule = new Map<string, number>()
  const rows = mcqs
    .filter((m) => m.question.trim().length > 0)
    .map((m) => {
      const key = m.module ?? '—'
      const n = (perModule.get(key) ?? 0) + 1
      perModule.set(key, n)
      return { ...toRow(m), position: m.position ?? n, image_url: null, status: 'flagged' }
    })

  if (rows.length === 0) {
    return { success: false, error: 'Aucun QCM valide à importer.' }
  }

  const { error } = await supabase.from('mcqs').insert(rows)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/qcms')
  return { success: true, count: rows.length }
}

/**
 * Create or update a single MCQ from the editor.
 * `status` sets the target state; publishing ('ready') is validated.
 */
export async function saveMcq(input: {
  id: number | null
  fields: McqInput
  status: 'ready' | 'flagged'
}): Promise<ActionResult> {
  const { id, fields, status } = input

  if (!fields.question.trim()) {
    return { success: false, error: "L'énoncé est requis." }
  }

  // Publish validation
  if (status === 'ready') {
    const missing: string[] = []
    if (!fields.correct) missing.push('une réponse correcte')
    if (!fields.module) missing.push('un module')
    if (fields.image_required && !hasEmbeddedImage(fields)) {
      missing.push('une image (question marquée « image requise »)')
    }
    if (missing.length > 0) {
      return { success: false, error: `Impossible de publier : il manque ${missing.join(', ')}.` }
    }
  }

  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const row = { ...toRow(fields), status }

  const { error } =
    id === null
      ? await supabase.from('mcqs').insert({ ...row, image_url: null })
      : await supabase.from('mcqs').update(row).eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/qcms')
  return { success: true }
}

/**
 * Generate a grounded explanation for one MCQ using the RAG knowledge base.
 * Returns the text for the admin to review/save (does NOT auto-write it).
 */
export async function generateExplanation(
  mcq: McqInput
): Promise<{ success: true; explanation: string } | { success: false; error: string }> {
  if (!mcq.question.trim()) return { success: false, error: "L'énoncé est requis." }
  if (!mcq.correct) return { success: false, error: 'Indique d’abord la bonne réponse.' }

  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

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

  // Retrieve grounding context (best-effort).
  let context: ContextBlock[] = []
  try {
    const embedding = await embedQuery(`${mcq.question}\n${options}`)
    const { data } = await supabase.rpc('match_chunks', {
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
    if (!explanation) return { success: false, error: "L'IA n'a pas pu générer d'explication." }
    return { success: true, explanation }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Échec de la génération.",
    }
  }
}

/**
 * Publish every reviewable MCQ in one go. Only questions that pass the publish
 * checks (have a correct answer + a module, and any required image) flip to
 * 'ready'; the rest stay flagged so the admin can fix them. Returns counts.
 */
export async function bulkPublish(filter?: {
  module?: string
  year?: number
  subject?: string
  exam_blanc?: string
  q?: string
}): Promise<
  { success: true; published: number; skipped: number } | { success: false; error: string }
> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  // Scope to the SAME filter shown in the bank (publish only what's visible).
  let query = supabase
    .from('mcqs')
    .select('id, correct, module, image_required, question, option_a, option_b, option_c, option_d, option_e')
    .eq('status', 'flagged')
  if (filter?.module) query = query.eq('module', filter.module)
  if (filter?.year) query = query.eq('year', filter.year)
  if (filter?.subject) query = query.eq('subject', filter.subject)
  if (filter?.exam_blanc) query = query.eq('exam_blanc', filter.exam_blanc)
  if (filter?.q) query = query.ilike('question', `%${filter.q}%`)

  const { data, error } = await query
  if (error) return { success: false, error: error.message }

  const publishable: number[] = []
  let skipped = 0
  for (const m of data ?? []) {
    const hasImage = [m.question, m.option_a, m.option_b, m.option_c, m.option_d, m.option_e].some(
      (t) => typeof t === 'string' && t.includes('data:image')
    )
    const ok =
      !!(typeof m.correct === 'string' && m.correct.trim()) &&
      !!m.module &&
      (!m.image_required || hasImage)
    if (ok) publishable.push(m.id as number)
    else skipped++
  }

  for (let i = 0; i < publishable.length; i += 200) {
    const { error: upErr } = await supabase
      .from('mcqs')
      .update({ status: 'ready' })
      .in('id', publishable.slice(i, i + 200))
    if (upErr) return { success: false, error: upErr.message }
  }

  revalidatePath('/admin/qcms')
  return { success: true, published: publishable.length, skipped }
}

/** Update a single MCQ's position (inline reorder from the bank). Admin-gated. */
export async function updateMcqPosition(id: number, position: number | null): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase.from('mcqs').update({ position }).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/qcms')
  return { success: true }
}

/** Permanently delete an MCQ. Admin-gated. */
export async function deleteMcq(id: number): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase.from('mcqs').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/qcms')
  return { success: true }
}
