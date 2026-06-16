'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Report, ReportContext } from '@/types'

type ActionResult = { success: true } | { success: false; error: string }

const CONTEXTS: ReportContext[] = ['mcq', 'ai', 'library', 'autre']

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

/** Submit a content error report. Any authenticated student can call this. */
export async function createReport(input: {
  context: string
  contextId?: string | null
  label?: string | null
  message?: string | null
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié.' }

  const context = (CONTEXTS as string[]).includes(input.context) ? input.context : 'autre'
  const { error } = await supabase.from('reports').insert({
    user_id: user.id,
    context,
    context_id: input.contextId ? String(input.contextId).slice(0, 200) : null,
    label: input.label?.trim().slice(0, 300) || null,
    message: input.message?.trim().slice(0, 2000) || null,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Count of open reports — for the admin sidebar badge. Resilient: returns 0 if
 * the table doesn't exist yet (before the migration) or the caller isn't admin,
 * so the admin shell never crashes.
 */
export async function getOpenReportCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}

/** All reports (open first, newest first) — admin only. */
export async function listReports(): Promise<Report[]> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return []
  const { data } = await supabase
    .from('reports')
    .select('*')
    .order('status', { ascending: true }) // 'open' < 'resolved'
    .order('created_at', { ascending: false })
  return (data ?? []) as Report[]
}

async function setStatus(id: number, status: 'open' | 'resolved'): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }
  const { error } = await supabase.from('reports').update({ status }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/signalements')
  return { success: true }
}

export async function resolveReport(id: number): Promise<ActionResult> {
  return setStatus(id, 'resolved')
}

export async function reopenReport(id: number): Promise<ActionResult> {
  return setStatus(id, 'open')
}

export async function deleteReport(id: number): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }
  const { error } = await supabase.from('reports').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/signalements')
  return { success: true }
}
