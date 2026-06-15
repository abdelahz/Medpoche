'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isVideoType, isYoutubeId } from '@/lib/youtube'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'library'
const SIGNED_URL_TTL = 3600 // 1 hour

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

/**
 * Record a library item. `path` is a Storage path for file documents, or an
 * 11-char YouTube video id when `type` is "Vidéo" (stored in file_url either way).
 */
export async function createLibraryItem(input: {
  title: string
  type: string
  module: string | null
  subject: string | null
  path: string
}): Promise<ActionResult> {
  if (!input.title.trim()) return { success: false, error: 'Le titre est requis.' }

  const video = isVideoType(input.type)
  if (video) {
    if (!isYoutubeId(input.path)) {
      return { success: false, error: 'Lien YouTube invalide.' }
    }
  } else if (!input.path) {
    return { success: false, error: 'Aucun fichier téléversé.' }
  }

  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase.from('library').insert({
    title: input.title.trim(),
    type: input.type,
    module: input.module?.trim() || null,
    subject: input.subject?.trim() || null,
    file_url: input.path,
  })
  if (error) {
    // Orphan-file cleanup: the row failed, so remove the just-uploaded file.
    // Videos have no Storage object, so there's nothing to clean up.
    if (!video) await supabase.storage.from(BUCKET).remove([input.path]).catch(() => {})
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/bibliotheque')
  return { success: true }
}

/** Delete a library item and its stored file. */
export async function deleteLibraryItem(id: number): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { data: row } = await supabase.from('library').select('type, file_url').eq('id', id).single()
  // Videos keep a YouTube id in file_url, not a Storage object — nothing to remove.
  if (row?.file_url && !isVideoType(row.type)) {
    await supabase.storage.from(BUCKET).remove([row.file_url]).catch(() => {})
  }

  const { error } = await supabase.from('library').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/bibliotheque')
  return { success: true }
}

/** Mint a short-lived signed URL to view/download a library file. */
export async function getLibrarySignedUrl(
  path: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL)
  if (error || !data) return { error: error?.message ?? 'Lien indisponible.' }
  return { url: data.signedUrl }
}
