/**
 * Upgrade & contact funnel → WhatsApp. Upgrades are handled manually (no online
 * billing): every "améliorer / contacter" CTA opens a WhatsApp chat with a
 * pre-filled message. The flow is: student asks → we send the RIB → student
 * makes the bank transfer → sends the proof → we activate the account.
 *
 * The official number is below. It can be overridden per-environment with
 * NEXT_PUBLIC_WHATSAPP_NUMBER — international format, digits only, no "+" or
 * spaces (e.g. 212612345678).
 */
import { PLAN_PRICE } from '@/lib/plans'

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '212784155974'

/** Promo monthly price (DH) per plan label, for pre-filling the WhatsApp message. */
const PRICE_BY_LABEL: Record<string, number> = {
  Basic: PLAN_PRICE.basic,
  Premium: PLAN_PRICE.premium,
}

/**
 * Pre-filled WhatsApp upgrade message. Names the target plan + promo price and
 * asks for the RIB, so the manual transfer flow starts in one tap.
 */
export function whatsappUpgradeUrl(targetPlan?: string): string {
  let text: string
  if (targetPlan) {
    const price = PRICE_BY_LABEL[targetPlan]
    const priced = price ? ` (prix promo ${price} DH/mois)` : ''
    text = `Bonjour 👋 Je souhaite passer à l'offre ${targetPlan}${priced} sur MedenPoche. Pouvez-vous m'envoyer le RIB pour faire le virement ?`
  } else {
    text =
      'Bonjour 👋 Je souhaite améliorer mon abonnement MedenPoche. Pouvez-vous m’envoyer le RIB pour faire le virement ?'
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** The 4-step manual upgrade flow, shown under upgrade CTAs to set expectations. */
export const UPGRADE_STEPS: { emoji: string; text: string }[] = [
  { emoji: '💬', text: 'Tu nous écris sur WhatsApp' },
  { emoji: '🏦', text: 'On t’envoie le RIB' },
  { emoji: '💸', text: 'Tu fais le virement' },
  { emoji: '✅', text: 'Tu envoies la preuve, on t’active' },
]

/** Pre-filled WhatsApp message to book the call with a medical student. */
export function whatsappMentorUrl(plan?: string): string {
  const suffix = plan ? ` (abonné ${plan})` : ''
  const text = `Bonjour 👋 Je souhaite réserver mon appel avec un étudiant en médecine${suffix}.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** Price of one private professor session. */
export const PROFESSOR_SESSION_PRICE = '150 DH / 2h'

/** Pre-filled WhatsApp message to book a private session with a professor. */
export function whatsappProfessorUrl(details: {
  matiere: string
  chapitre: string
  questions: string
}): string {
  const lines = [
    'Bonjour 👋 Je souhaite réserver un cours particulier avec un professeur (150 DH / 2h).',
    `Matière : ${details.matiere || '—'}`,
    `Chapitre : ${details.chapitre || '—'}`,
    details.questions ? `Mes questions : ${details.questions}` : '',
  ].filter(Boolean)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
