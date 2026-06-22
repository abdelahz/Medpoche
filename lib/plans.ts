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

/**
 * Lifetime free AI tutor questions for `gratuit` users — a one-time taste of the
 * tutor (text only) to drive the upgrade, after which the feature locks. Counted
 * against all-time `ai_usage`, not per day.
 */
export const FREE_TEASER_AI = 3

/** Current (promotional) monthly price in dirhams — what students pay today. */
export const PLAN_PRICE: Record<Plan, number> = {
  gratuit: 0,
  basic: 70,
  premium: 250,
}

/** Original (non-promo) monthly price — shown struck-through for anchoring. */
export const PLAN_PRICE_ORIGINAL: Record<Plan, number> = {
  gratuit: 0,
  basic: 100,
  premium: 350,
}

/** Whether a plan is currently discounted (promo price below the original). */
export function isOnPromo(plan: Plan): boolean {
  return PLAN_PRICE[plan] > 0 && PLAN_PRICE[plan] < PLAN_PRICE_ORIGINAL[plan]
}

/** Rounded discount percentage for a plan's promo (0 when not discounted). */
export function discountPct(plan: Plan): number {
  if (!isOnPromo(plan)) return 0
  return Math.round(((PLAN_PRICE_ORIGINAL[plan] - PLAN_PRICE[plan]) / PLAN_PRICE_ORIGINAL[plan]) * 100)
}

/** "250 DH/mois (au lieu de 350 DH)" for plain-text contexts (walls, WhatsApp). */
export function pricePhrase(plan: Plan): string {
  const promo = `${PLAN_PRICE[plan]} DH/mois`
  return isOnPromo(plan) ? `${promo} (au lieu de ${PLAN_PRICE_ORIGINAL[plan]} DH)` : promo
}

/**
 * Marketing / display metadata for a plan. Single source of truth for every
 * upsell surface (profile cards, accueil banner, limit walls). Keep copy
 * outcome-led (what it unlocks for the student), not a dry feature list.
 */
export interface PlanDisplay {
  /** Human label ("Basic", "Premium"). */
  label: string
  /** Monthly price in DH (0 for gratuit). */
  price: number
  /** One-line emotional hook. */
  tagline: string
  /** Ordered benefit lines shown on the plan card. */
  benefits: string[]
  /** Premium is flagged so surfaces can highlight it as the hero. */
  mostPopular: boolean
}

export const PLAN_DISPLAY: Record<Plan, PlanDisplay> = {
  gratuit: {
    label: 'Gratuit',
    price: 0,
    tagline: 'Pour découvrir MedenPoche',
    benefits: ['20 QCM par jour', 'Corrections expliquées', 'Suivi de progression'],
    mostPopular: false,
  },
  basic: {
    label: 'Basic',
    price: 70,
    tagline: 'Pour réviser sérieusement',
    benefits: [
      '40 QCM par jour',
      'Examens blancs inclus',
      'Bibliothèque complète (cours + vidéos)',
      'Assistant IA : 10 questions/jour (dont 1 photo)',
      '1 appel avec un étudiant en médecine',
    ],
    mostPopular: false,
  },
  premium: {
    label: 'Premium',
    price: 250,
    tagline: 'Pour viser le concours sans limite',
    benefits: [
      'QCM illimités',
      'Assistant IA illimité',
      'Questions par photo illimitées',
      'Bibliothèque complète (cours + vidéos)',
      'Un appel chaque semaine avec un étudiant en médecine',
    ],
    mostPopular: true,
  },
}

export function isUnlimited(v: number | 'unlimited'): boolean {
  return v === 'unlimited'
}

/** The AI limit actually enforced server-side (applies the safety ceiling). */
export function effectiveLimit(v: number | 'unlimited'): number {
  return v === 'unlimited' ? AI_SAFETY_CEILING : Math.min(v, AI_SAFETY_CEILING)
}
