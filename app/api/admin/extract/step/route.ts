import { NextResponse } from 'next/server'
import {
  requireAdmin,
  BATCH_PAGES,
  EXTRACTIONS_BUCKET,
  countPages,
  buildBatchSource,
  buildWholeSource,
} from '@/lib/extraction'
import { extractMcqs, type GeminiSource } from '@/lib/gemini'
import type { ExtractedMCQ } from '@/types'

export const maxDuration = 60

/**
 * Advance one extraction job by a single page-batch. Idempotent enough for a
 * sequential client loop: each call extracts pages `[cursor, cursor+BATCH)`,
 * appends the MCQs, and advances the cursor until the document is exhausted.
 */
export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (ctx instanceof NextResponse) return ctx
  const { supabase } = ctx

  let id = ''
  try {
    const body = await request.json()
    id = typeof body?.id === 'string' ? body.id : ''
  } catch {
    /* fall through to the missing-id error */
  }
  if (!id) {
    return NextResponse.json({ error: 'Identifiant de tâche manquant.' }, { status: 400 })
  }

  const { data: job, error: jobErr } = await supabase
    .from('extraction_jobs')
    .select('*')
    .eq('id', id)
    .single()
  if (jobErr || !job) {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  }

  // Already finished — return current state so the client can stop polling.
  if (job.status === 'done' || job.status === 'error') {
    return NextResponse.json({
      status: job.status,
      cursor: job.cursor,
      total_pages: job.total_pages,
      error: job.error,
      result: job.status === 'done' ? job.result : undefined,
    })
  }

  try {
    const q = await supabase.storage.from(EXTRACTIONS_BUCKET).download(job.questions_path)
    if (q.error || !q.data) throw new Error('Fichier de questions illisible.')
    const qBytes = new Uint8Array(await q.data.arrayBuffer())

    const total = job.total_pages ?? (await countPages(qBytes, job.questions_path))
    const start = job.cursor
    const end = Math.min(start + BATCH_PAGES, total)

    let corrections: GeminiSource | undefined
    if (job.corrections_path) {
      const c = await supabase.storage.from(EXTRACTIONS_BUCKET).download(job.corrections_path)
      if (c.error || !c.data) throw new Error('Corrigé illisible.')
      corrections = buildWholeSource(new Uint8Array(await c.data.arrayBuffer()), job.corrections_path)
    }

    let batch: ExtractedMCQ[] = []
    if (end > start) {
      const questions = await buildBatchSource(qBytes, job.questions_path, start, end)
      batch = await extractMcqs(questions, corrections)
    }

    const result = [...((job.result as ExtractedMCQ[]) ?? []), ...batch]
    const done = end >= total

    const { error: upErr } = await supabase
      .from('extraction_jobs')
      .update({
        status: done ? 'done' : 'processing',
        cursor: end,
        total_pages: total,
        result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (upErr) throw new Error(upErr.message)

    if (done) {
      const paths = [job.questions_path, job.corrections_path].filter(Boolean) as string[]
      await supabase.storage.from(EXTRACTIONS_BUCKET).remove(paths)
    }

    return NextResponse.json({
      status: done ? 'done' : 'processing',
      cursor: end,
      total_pages: total,
      result: done ? result : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de l'extraction."
    await supabase
      .from('extraction_jobs')
      .update({ status: 'error', error: message, updated_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({
      status: 'error',
      error: message,
      cursor: job.cursor,
      total_pages: job.total_pages,
    })
  }
}
