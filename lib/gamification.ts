/**
 * Pure gamification helpers, all derived from existing MCQ attempts — no extra
 * storage. Shared by the student home and progress views.
 */

export const DAILY_GOAL = 20 // QCMs/day (becomes configurable with Step 14)
const XP_CORRECT = 10
const XP_WRONG = 4
const XP_PER_LEVEL = 100

/** Consecutive active days ending today or yesterday (keys are YYYY-MM-DD). */
export function computeStreak(dateKeys: Set<string>): number {
  const key = (d: Date) => d.toISOString().slice(0, 10)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  let cursor: Date
  if (dateKeys.has(key(today))) cursor = today
  else if (dateKeys.has(key(yesterday))) cursor = yesterday
  else return 0

  let streak = 0
  while (dateKeys.has(key(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Total XP: rewards participation, bonuses correctness. */
export function computeXp(rows: { is_correct: boolean | null }[]): number {
  let xp = 0
  for (const r of rows) xp += r.is_correct ? XP_CORRECT : XP_WRONG
  return xp
}

export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpToNext: number } {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpToNext: XP_PER_LEVEL,
  }
}

export interface Badge {
  key: string
  label: string
  earned: boolean
}

export function computeBadges(input: {
  streak: number
  total: number
  hasMasteredModule: boolean
}): Badge[] {
  const { streak, total, hasMasteredModule } = input
  return [
    { key: 'first', label: 'Première série', earned: total >= 1 },
    { key: 'streak3', label: '3 jours de suite', earned: streak >= 3 },
    { key: 'streak7', label: '7 jours de suite', earned: streak >= 7 },
    { key: 'qcm50', label: '50 QCM', earned: total >= 50 },
    { key: 'qcm200', label: '200 QCM', earned: total >= 200 },
    { key: 'master', label: 'Matière maîtrisée', earned: hasMasteredModule },
  ]
}
