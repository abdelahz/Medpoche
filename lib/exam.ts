/**
 * Concours date — the single strongest motivator in exam prep. Drives the home
 * countdown and the time-scarcity framing on upsells. Override per-environment
 * with NEXT_PUBLIC_CONCOURS_DATE (YYYY-MM-DD).
 */
export const CONCOURS_DATE = process.env.NEXT_PUBLIC_CONCOURS_DATE || '2026-07-18'

/** Whole days remaining until the concours (0 once the date has passed). */
export function daysUntilConcours(now: Date = new Date()): number {
  const target = new Date(`${CONCOURS_DATE}T00:00:00.000Z`).getTime()
  const start = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`).getTime()
  return Math.max(0, Math.round((target - start) / 86_400_000))
}
