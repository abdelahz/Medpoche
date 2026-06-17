/**
 * Upgrade & contact funnel → WhatsApp. Upgrades are handled manually for now
 * (no online billing yet): every "améliorer / contacter" CTA opens a WhatsApp
 * chat with a pre-filled message so the student can ask and pay.
 *
 * The official number is below. It can be overridden per-environment with
 * NEXT_PUBLIC_WHATSAPP_NUMBER — international format, digits only, no "+" or
 * spaces (e.g. 212612345678).
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '212784155974'

/** Pre-filled WhatsApp upgrade message (optionally naming the target plan). */
export function whatsappUpgradeUrl(targetPlan?: string): string {
  const text = targetPlan
    ? `Bonjour 👋 Je souhaite passer à l'offre ${targetPlan} sur MedenPoche. Pouvez-vous m'aider ?`
    : 'Bonjour 👋 Je souhaite améliorer mon abonnement MedenPoche. Pouvez-vous m’aider ?'
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

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
