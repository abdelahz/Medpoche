import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/extraction'

export const maxDuration = 60

/**
 * Create a durable extraction job for files already uploaded to the
 * `extractions` bucket. Returns the job id; the browser then drives `/step`.
 */
export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if (ctx instanceof NextResponse) return ctx
  const { supabase, user } = ctx

  let body: { questionsPath?: unknown; correctionsPath?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const questionsPath = typeof body.questionsPath === 'string' ? body.questionsPath : ''
  if (!questionsPath) {
    return NextResponse.json({ error: 'Fichier de questions manquant.' }, { status: 400 })
  }
  const correctionsPath =
    typeof body.correctionsPath === 'string' && body.correctionsPath ? body.correctionsPath : null

  const { data, error } = await supabase
    .from('extraction_jobs')
    .insert({
      admin_id: user.id,
      status: 'pending',
      questions_path: questionsPath,
      corrections_path: correctionsPath,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Création de la tâche impossible.' }, { status: 500 })
  }
  return NextResponse.json({ id: data.id })
}
