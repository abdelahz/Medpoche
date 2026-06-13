import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/extraction'

export const maxDuration = 60

/** Report the current state of an extraction job (browser polls this). */
export async function GET(request: Request) {
  const ctx = await requireAdmin()
  if (ctx instanceof NextResponse) return ctx
  const { supabase } = ctx

  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!id) {
    return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('extraction_jobs')
    .select('status, cursor, total_pages, result, error')
    .eq('id', id)
    .single()
  if (error || !job) {
    return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  }
  return NextResponse.json(job)
}
