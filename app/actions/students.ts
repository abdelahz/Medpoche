'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PLANS, type Plan } from '@/types'

type ActionResult = { success: true } | { success: false; error: string }

export type StudentStats = {
  total: number
  correct: number
  byModule: { module: string; total: number; correct: number }[]
}

export type StudentDetail = {
  id: string
  full_name: string | null
  email: string | null
  is_premium: boolean
  questions_today: number
  mcqs_today: number
  created_at: string
  stats: StudentStats
}

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
 * Set a student's subscription plan (admin only — the single source of truth for
 * tier gating). `is_premium` is kept in sync (true for any paid plan) for the
 * legacy badge. The DB trigger `profiles_guard_privileges` also blocks anyone but
 * an admin/service-role from changing these columns.
 */
export async function setStudentPlan(id: string, plan: Plan): Promise<ActionResult> {
  if (!(PLANS as readonly string[]).includes(plan)) {
    return { success: false, error: 'Plan invalide.' }
  }
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('profiles')
    .update({ plan, is_premium: plan !== 'gratuit' })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/etudiants')
  return { success: true }
}

/** Per-student detail + attempt analytics (admins only). */
export async function getStudentDetail(
  id: string
): Promise<{ detail: StudentDetail } | { error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { error: admin.error }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_premium, questions_today, mcqs_today, created_at')
    .eq('id', id)
    .single()
  if (error || !profile) return { error: error?.message ?? 'Étudiant introuvable.' }

  const { data: attempts } = await supabase
    .from('mcq_attempts')
    .select('is_correct, mcqs(module)')
    .eq('user_id', id)

  const rows = (attempts ?? []) as unknown as {
    is_correct: boolean | null
    mcqs: { module: string | null } | null
  }[]
  const byModuleMap = new Map<string, { total: number; correct: number }>()
  let correct = 0
  for (const a of rows) {
    if (a.is_correct) correct++
    const mod = a.mcqs?.module ?? 'Non défini'
    const cur = byModuleMap.get(mod) ?? { total: 0, correct: 0 }
    cur.total++
    if (a.is_correct) cur.correct++
    byModuleMap.set(mod, cur)
  }

  return {
    detail: {
      ...profile,
      stats: {
        total: rows.length,
        correct,
        byModule: Array.from(byModuleMap.entries()).map(([module, s]) => ({ module, ...s })),
      },
    },
  }
}

/**
 * Export every student as CSV (admin only) — the launch-day notification list:
 * name, email, phone, filière, plan, signup date. Semicolon-separated with a
 * UTF-8 BOM so Excel opens it correctly; phones feed a WhatsApp broadcast.
 */
export async function exportStudentsCsv(): Promise<{ csv: string } | { error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { error: admin.error }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, phone, filiere, plan, created_at')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })
  if (error) return { error: error.message }

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = (data ?? []).map((s) =>
    [
      s.full_name,
      s.email,
      s.phone,
      s.filiere,
      s.plan ?? 'gratuit',
      new Date(s.created_at as string).toLocaleDateString('fr-FR'),
    ]
      .map(esc)
      .join(';')
  )
  const csv = '\uFEFF' + ['Nom;Email;Téléphone;Filière;Plan;Inscrit le', ...rows].join('\r\n')
  return { csv }
}

/**
 * Permanently delete a student account and ALL their data.
 * Requires the admin to retype the student's email. Irreversible.
 * Uses the service-role client (only way to delete an auth user + bypass
 * RLS on the student's own data tables).
 */
export async function deleteStudent(id: string, emailConfirm: string): Promise<ActionResult> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  // Verify the typed email matches the target account.
  const { data: target } = await supabase.from('profiles').select('email, is_admin').eq('id', id).single()
  if (!target) return { success: false, error: 'Étudiant introuvable.' }
  if (target.is_admin) return { success: false, error: 'Impossible de supprimer un compte administrateur.' }
  if ((target.email ?? '').trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
    return { success: false, error: "L'email saisi ne correspond pas." }
  }

  const adminDb = createAdminClient()

  // Cascade-clean the student's data (RLS would block the normal client here).
  for (const table of ['mcq_attempts', 'bookmarks', 'chat_history', 'student_files'] as const) {
    await adminDb.from(table).delete().eq('user_id', id)
  }
  await adminDb.from('profiles').delete().eq('id', id)

  const { error } = await adminDb.auth.admin.deleteUser(id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/etudiants')
  return { success: true }
}
