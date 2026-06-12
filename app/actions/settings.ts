'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_TUTOR_INSTRUCTIONS } from '@/lib/gemini'

const TUTOR_KEY = 'tutor_instructions'

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

/** Current tutor instructions, or the built-in default when unset. */
export async function getAiInstructions(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', TUTOR_KEY)
    .maybeSingle()
  return data?.value?.trim() ? data.value : DEFAULT_TUTOR_INSTRUCTIONS
}

/** Save tutor instructions (admin only). Empty value resets to the default. */
export async function updateAiInstructions(
  value: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const trimmed = value.trim()
  const stored = trimmed || DEFAULT_TUTOR_INSTRUCTIONS
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: TUTOR_KEY, value: stored, updated_at: new Date().toISOString() })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── Pre-launch mode ───────────────────────────────────────────────────────────
// While ON, free-plan students see the "launching soon" page instead of the app
// (admins and Basic/Premium accounts pass through). Flipped from /admin/parametres.
const PRELAUNCH_KEY = 'prelaunch_mode'

/** Whether pre-launch mode is currently active. Defaults to OFF when unset. */
export async function getPrelaunchMode(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', PRELAUNCH_KEY)
    .maybeSingle()
  return data?.value === 'on'
}

/** Enable/disable pre-launch mode (admin only). */
export async function setPrelaunchMode(
  on: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin.ok) return { success: false, error: admin.error }

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: PRELAUNCH_KEY, value: on ? 'on' : 'off', updated_at: new Date().toISOString() })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
