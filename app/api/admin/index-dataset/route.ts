import { NextRequest, NextResponse } from 'next/server'
import { indexDatasetItem } from '@/app/actions/dataset'

// Indexing a large/scanned PDF (OCR + embeddings) can take minutes — far past
// the default serverless budget. A route handler lets us raise the ceiling;
// `indexDatasetItem` already admin-gates and writes index_status itself, so the
// admin UI can fire this and poll the status instead of blocking on a server action.
export const runtime = 'nodejs'
// 60s = Vercel Hobby max. On Pro, raise to 300 for OCR/embedding of large datasets.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let id: number
  try {
    const body = (await req.json()) as { id?: unknown }
    id = Number(body?.id)
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 })
  }
  if (!Number.isFinite(id)) {
    return NextResponse.json({ success: false, error: 'Identifiant manquant.' }, { status: 400 })
  }

  const res = await indexDatasetItem(id)
  return NextResponse.json(res)
}
