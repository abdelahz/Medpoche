import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/usage'
import { PLAN_LIMITS } from '@/lib/plans'

const BUCKET = 'library'

function contentTypeFor(path: string): string {
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

/**
 * View-only proxy for library files. Streams the bytes through the app so the
 * client never receives a shareable Supabase signed URL or the storage path.
 * Auth is enforced here (and by middleware on /student/*). Served inline so the
 * in-app viewer can render it; never with a download disposition.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié.', { status: 401 })

  // The library is a Basic+ feature; block direct file access for free plans.
  const plan = await getUserPlan(supabase, user.id)
  if (!PLAN_LIMITS[plan].library) return new Response('Accès réservé aux abonnés.', { status: 403 })

  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return new Response('Introuvable.', { status: 404 })

  // RLS lets any authenticated user read library rows.
  const { data: row } = await supabase.from('library').select('file_url').eq('id', id).single()
  if (!row?.file_url) return new Response('Introuvable.', { status: 404 })

  // Short-lived signed URL, used server-side only (never sent to the client).
  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.file_url, 60)
  if (error || !signed) return new Response('Lien indisponible.', { status: 502 })

  const upstream = await fetch(signed.signedUrl)
  if (!upstream.ok || !upstream.body) return new Response('Fichier indisponible.', { status: 502 })

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentTypeFor(row.file_url),
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
