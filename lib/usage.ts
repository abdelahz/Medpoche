import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plan } from '@/types'
import { PLAN_LIMITS, effectiveLimit, isUnlimited } from '@/lib/plans'

export type AiUsageKind = 'text' | 'photo'

/** Start of the current UTC day (matches the streak/leaderboard day boundary). */
function startOfTodayIso(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`
}

/** The signed-in user's plan (defaults to 'gratuit' if unset / column missing). */
export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<Plan> {
  const { data } = await supabase.from('profiles').select('plan').eq('id', userId).single()
  return ((data?.plan as Plan) ?? 'gratuit') as Plan
}

/** QCMs the user has answered today (any mode). */
export async function getMcqsUsedToday(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from('mcq_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfTodayIso())
  return count ?? 0
}

export interface McqAllowance {
  used: number
  /** Daily cap, or null when unlimited. */
  limit: number | null
  /** Questions left today, or null when unlimited. */
  remaining: number | null
}

/** The user's remaining daily QCM allowance for their plan. */
export async function getMcqAllowance(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan
): Promise<McqAllowance> {
  const lim = PLAN_LIMITS[plan].mcqsPerDay
  if (isUnlimited(lim)) return { used: 0, limit: null, remaining: null }
  const limit = lim as number
  const used = await getMcqsUsedToday(supabase, userId)
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** Trim a freshly-built session to the user's remaining daily allowance (null = unlimited). */
export function capToRemaining<T>(rows: T[], remaining: number | null): T[] {
  return remaining === null ? rows : rows.slice(0, Math.max(0, remaining))
}

/** All-time AI tutor requests for a user (used for the free lifetime teaser). */
export async function getAiUsageAllTime(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

/** Today's AI tutor usage for a user, split by kind. */
export async function getAiUsageToday(
  supabase: SupabaseClient,
  userId: string
): Promise<{ text: number; photo: number; total: number }> {
  const { data } = await supabase
    .from('ai_usage')
    .select('kind')
    .eq('user_id', userId)
    .gte('created_at', startOfTodayIso())

  let text = 0
  let photo = 0
  for (const r of data ?? []) {
    if ((r as { kind: string }).kind === 'photo') photo++
    else text++
  }
  return { text, photo, total: text + photo }
}

export interface QuotaSnapshot {
  plan: Plan
  /** Remaining total messages today, or null when effectively unlimited. */
  messagesLeft: number | null
  /** Remaining photo questions today, or null when effectively unlimited. */
  photosLeft: number | null
}

/** A user-facing snapshot of remaining AI quota (for the chat UI). */
export async function getQuotaSnapshot(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan
): Promise<QuotaSnapshot> {
  const limits = PLAN_LIMITS[plan]
  const { photo, total } = await getAiUsageToday(supabase, userId)

  const messagesLeft = isUnlimited(limits.aiMessages)
    ? null
    : Math.max(0, effectiveLimit(limits.aiMessages) - total)
  const photosLeft = isUnlimited(limits.aiPhotos)
    ? null
    : Math.max(0, effectiveLimit(limits.aiPhotos) - photo)

  return { plan, messagesLeft, photosLeft }
}

export type QuotaCheck =
  | { allowed: true }
  | { allowed: false; reason: 'messages' | 'photos'; limit: number }

/**
 * Server-authoritative quota gate for one AI tutor request. Checks the daily
 * message cap (and, for photos, the daily photo cap) against today's usage.
 */
export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
  plan: Plan,
  isPhoto: boolean
): Promise<QuotaCheck> {
  const limits = PLAN_LIMITS[plan]
  const { photo, total } = await getAiUsageToday(supabase, userId)

  const msgLimit = effectiveLimit(limits.aiMessages)
  if (total >= msgLimit) return { allowed: false, reason: 'messages', limit: msgLimit }

  if (isPhoto) {
    const photoLimit = effectiveLimit(limits.aiPhotos)
    if (photo >= photoLimit) return { allowed: false, reason: 'photos', limit: photoLimit }
  }
  return { allowed: true }
}

/** Record one consumed AI tutor request (counts against the daily quota). */
export async function recordAiUsage(
  supabase: SupabaseClient,
  userId: string,
  kind: AiUsageKind
): Promise<void> {
  await supabase.from('ai_usage').insert({ user_id: userId, kind })
}
