import type { Plan } from '@/types'

/**
 * Per-plan limits and feature flags.
 *
 *  - `mcqsPerDay`   : QCMs a student may answer per day (any mode — drills,
 *                     années, examens blancs all count toward it).
 *  - `aiMessages`   : AI tutor messages per day (text + photo). 0 = not included.
 *  - `aiPhotos`     : how many of those may be photo questions. 0 = not included.
 *  - `library`      : access to the course library.
 *  - `examensBlancs`: access to the mock-exam mode.
 *
 * 'unlimited' means "no product limit shown to the user"; a hidden safety
 * ceiling (AI_SAFETY_CEILING) still bounds AI usage on every plan as a circuit
 * breaker against a runaway or compromised account.
 */
export interface PlanLimits {
  mcqsPerDay: number | 'unlimited'
  aiMessages: number | 'unlimited'
  aiPhotos: number | 'unlimited'
  library: boolean
  examensBlancs: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  gratuit: { mcqsPerDay: 20, aiMessages: 0, aiPhotos: 0, library: false, examensBlancs: false },
  basic: { mcqsPerDay: 40, aiMessages: 10, aiPhotos: 1, library: true, examensBlancs: true },
  premium: {
    mcqsPerDay: 'unlimited',
    aiMessages: 'unlimited',
    aiPhotos: 'unlimited',
    library: true,
    examensBlancs: true,
  },
}

/**
 * Absolute daily AI cap enforced on EVERY plan, even "unlimited" ones. Normal
 * students never get near it; it exists purely to bound cost if an account is
 * abused. Invisible to users (we still show "illimité").
 */
export const AI_SAFETY_CEILING = 250

export function isUnlimited(v: number | 'unlimited'): boolean {
  return v === 'unlimited'
}

/** The AI limit actually enforced server-side (applies the safety ceiling). */
export function effectiveLimit(v: number | 'unlimited'): number {
  return v === 'unlimited' ? AI_SAFETY_CEILING : Math.min(v, AI_SAFETY_CEILING)
}
