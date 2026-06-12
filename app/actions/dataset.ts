'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MODULES } from '@/types'
import { embedDocuments } from '@/lib/gemini'
import { extractDocumentText, chunkPages, pgSafe } from '@/lib/rag/ingest'

const BUCKET = 'dataset'
const SIGNED_URL_TTL = 3600

function guessMime(path: string): string {
  switch (path.toLowerCase().split('.').pop()) {
    case 'pdf':
      return 'application/pdf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      return 'application/octet-stream'
  }
}

type ActionResult = { success: true } | { success: false; error: string }

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

/** Record a dataset document after its file has been uploaded to Storage. */
export async function createDatasetItem(input: {
  title: string
  subject: string | null
  path: string
}): Promise<ActionResult> {
  if (!input.title.trim()) return { success: false, error: 'Le titre est requis.' }
  if (!input.path) return { success: false, error: 'Aucun fichier téléversé.' }

  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase.from('dataset').insert({
    title: input.title.trim(),
    subject: input.subject?.trim() || null,
    file_url: input.path,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([input.path]).catch(() => {})
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/dataset')
  return { success: true }
}

/**
 * Mark/unmark a dataset document as a PRIMARY reference. Its chunks are then
 * surfaced first by the tutor's retrieval (and flagged to the model) for any
 * question they match — e.g. a physique-chimie tips book becomes the go-to source
 * for those matières. Admin-gated.
 */
export async function setDatasetPriority(id: number, priority: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('dataset')
    .update({ priority: priority ? 1 : 0 })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/dataset')
  return { success: true }
}

/** Delete a dataset document and its stored file. */
export async function deleteDatasetItem(id: number): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { data: row } = await supabase.from('dataset').select('file_url').eq('id', id).single()
  if (row?.file_url) {
    await supabase.storage.from(BUCKET).remove([row.file_url]).catch(() => {})
  }

  const { error } = await supabase.from('dataset').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/dataset')
  return { success: true }
}

/**
 * Index a dataset document into the RAG knowledge base: transcribe → chunk →
 * embed → store in dataset_chunks (replacing any prior chunks for this file).
 * Synchronous and admin-triggered; can take a while for large/scanned PDFs.
 */
export async function indexDatasetItem(
  id: number
): Promise<{ success: true; chunks: number } | { success: false; error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { data: row } = await supabase
    .from('dataset')
    .select('id, title, subject, file_url')
    .eq('id', id)
    .single()
  if (!row?.file_url) return { success: false, error: 'Fichier introuvable.' }

  await supabase.from('dataset').update({ index_status: 'indexing' }).eq('id', id)

  try {
    const dl = await supabase.storage.from(BUCKET).download(row.file_url)
    if (dl.error || !dl.data) throw new Error('Téléchargement du fichier échoué.')
    const buffer = Buffer.from(await dl.data.arrayBuffer())
    const mime = dl.data.type || guessMime(row.file_url)

    const pages = await extractDocumentText(buffer, mime, row.title)
    const chunks = chunkPages(pages)
    if (chunks.length === 0) throw new Error('Aucun texte exploitable n’a pu être extrait.')

    const vectors = await embedDocuments(chunks.map((c) => c.content))

    // Tag chunks with a matière only when the file maps to exactly one module.
    const subject = row.subject?.trim() ?? ''
    const moduleTag = (MODULES as readonly string[]).includes(subject) ? subject : null

    // Replace any previous chunks for this file (re-index safe).
    await supabase.from('dataset_chunks').delete().eq('dataset_id', id)

    const rows = chunks.map((c, i) => ({
      dataset_id: id,
      content: c.content,
      embedding: JSON.stringify(vectors[i]), // pgvector accepts the bracketed text form
      module: moduleTag,
      subject: null,
      source_title: row.title,
      page: c.page,
      chunk_index: c.index,
    }))
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from('dataset_chunks').insert(rows.slice(i, i + 200))
      if (error) throw new Error(error.message)
    }

    await supabase
      .from('dataset')
      .update({
        index_status: 'indexed',
        indexed_at: new Date().toISOString(),
        chunk_count: chunks.length,
      })
      .eq('id', id)

    revalidatePath('/admin/dataset')
    return { success: true, chunks: chunks.length }
  } catch (err) {
    await supabase.from('dataset').update({ index_status: 'failed' }).eq('id', id)
    return { success: false, error: err instanceof Error ? err.message : "Échec de l'indexation." }
  }
}

interface McqRow {
  id: number
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct: string
  explanation: string | null
  module: string | null
  subject: string | null
}

/** Format a published MCQ as a retrievable knowledge chunk (Q + options + answer + why). */
function mcqToChunk(m: McqRow): string {
  const opts = [
    ['A', m.option_a],
    ['B', m.option_b],
    ['C', m.option_c],
    ['D', m.option_d],
    ['E', m.option_e],
  ]
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}) ${v}`)
    .join('\n')
  const tag = [m.module, m.subject].filter(Boolean).join(' · ')
  return pgSafe(
    [
      `QCM${tag ? ` (${tag})` : ''} :`,
      m.question,
      opts,
      `Bonne réponse : ${m.correct}`,
      m.explanation ? `Explication : ${m.explanation}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  )
}

/**
 * Index published (status='ready') MCQs into the knowledge base so the AI tutor
 * can retrieve similar solved questions. Scoped to the SAME filter as the bank:
 * with a filter, only those MCQs are (re)indexed (their old chunks replaced);
 * with no filter, the whole MCQ chunk set is rebuilt. Each MCQ → one chunk.
 */
export async function indexMcqBank(filter?: {
  module?: string
  year?: number
  subject?: string
  exam_blanc?: string
  q?: string
}): Promise<{ success: true; chunks: number } | { success: false; error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  let query = supabase
    .from('mcqs')
    .select(
      'id, question, option_a, option_b, option_c, option_d, option_e, correct, explanation, module, subject'
    )
    .eq('status', 'ready')
  const scoped = !!(filter?.module || filter?.year || filter?.subject || filter?.exam_blanc || filter?.q)
  if (filter?.module) query = query.eq('module', filter.module)
  if (filter?.year) query = query.eq('year', filter.year)
  if (filter?.subject) query = query.eq('subject', filter.subject)
  if (filter?.exam_blanc) query = query.eq('exam_blanc', filter.exam_blanc)
  if (filter?.q) query = query.ilike('question', `%${filter.q}%`)

  const { data, error: fetchErr } = await query
  if (fetchErr) return { success: false, error: fetchErr.message }
  const mcqs = (data ?? []) as McqRow[]

  // Clear the chunks we're about to replace: just this scope's MCQs when
  // filtered, otherwise the whole MCQ chunk set (drops un-published stragglers).
  if (scoped) {
    const ids = mcqs.map((m) => m.id)
    if (ids.length > 0) await supabase.from('dataset_chunks').delete().in('mcq_id', ids)
  } else {
    await supabase.from('dataset_chunks').delete().eq('source_type', 'mcq')
  }
  if (mcqs.length === 0) return { success: true, chunks: 0 }

  const vectors = await embedDocuments(mcqs.map(mcqToChunk))
  const rows = mcqs.map((m, i) => ({
    dataset_id: null,
    mcq_id: m.id,
    source_type: 'mcq',
    content: mcqToChunk(m),
    embedding: JSON.stringify(vectors[i]),
    module: m.module,
    subject: m.subject,
    source_title: ['QCM', m.module, m.subject].filter(Boolean).join(' · '),
    page: null,
    chunk_index: i,
  }))
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('dataset_chunks').insert(rows.slice(i, i + 200))
    if (error) return { success: false, error: error.message }
  }

  return { success: true, chunks: rows.length }
}

/** Mint a short-lived signed URL to view/download a dataset file. */
export async function getDatasetSignedUrl(
  path: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { error: admin.error }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  if (error || !data) return { error: error?.message ?? 'Lien indisponible.' }
  return { url: data.signedUrl }
}
