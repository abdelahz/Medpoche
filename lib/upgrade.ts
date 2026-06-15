/**
 * Upgrade & contact funnel. Upgrades are handled manually (no online billing yet).
 *
 * ⚠️ WhatsApp Business is temporarily unavailable, so every CTA currently opens
 * our Instagram DM instead. To switch back once WhatsApp is live: flip
 * USE_WHATSAPP to true and restore the WhatsApp branding on the CTA buttons
 * (`INSTAGRAM_GRADIENT` / the Instagram icon → green `#25D366` / WhatsApp icon).
 * The wa.me builders below are intact, so the flag is the only logic change.
 */

/** Instagram handle + direct-DM deep link (ig.me opens the message thread). */
export const INSTAGRAM_HANDLE = 'med_enpoche_academy'
export const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_HANDLE}`

/** Instagram brand gradient for contact CTAs (replaces the WhatsApp green). */
export const INSTAGRAM_GRADIENT = 'linear-gradient(45deg, #F58529 0%, #DD2A7B 55%, #8134AF 100%)'

/** WhatsApp number — kept for when WhatsApp Business is back. */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '') || '212784155974'

/** While false, all contact CTAs route to Instagram. Set true to restore WhatsApp. */
const USE_WHATSAPP: boolean = false

/** Contact link for upgrading (optionally naming the target plan). */
export function whatsappUpgradeUrl(targetPlan?: string): string {
  if (!USE_WHATSAPP) return INSTAGRAM_DM_URL
  const text = targetPlan
    ? `Bonjour 👋 Je souhaite passer à l'offre ${targetPlan} sur MedenPoche. Pouvez-vous m'aider ?`
    : 'Bonjour 👋 Je souhaite améliorer mon abonnement MedenPoche. Pouvez-vous m’aider ?'
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** Contact link to book the call with a medical student. */
export function whatsappMentorUrl(plan?: string): string {
  if (!USE_WHATSAPP) return INSTAGRAM_DM_URL
  const suffix = plan ? ` (abonné ${plan})` : ''
  const text = `Bonjour 👋 Je souhaite réserver mon appel avec un étudiant en médecine${suffix}.`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

/** Price of one private professor session. */
export const PROFESSOR_SESSION_PRICE = '150 DH / 2h'

/** Contact link to book a private session with a professor. */
export function whatsappProfessorUrl(details: {
  matiere: string
  chapitre: string
  questions: string
}): string {
  if (!USE_WHATSAPP) return INSTAGRAM_DM_URL
  const lines = [
    'Bonjour 👋 Je souhaite réserver un cours particulier avec un professeur (150 DH / 2h).',
    `Matière : ${details.matiere || '—'}`,
    `Chapitre : ${details.chapitre || '—'}`,
    details.questions ? `Mes questions : ${details.questions}` : '',
  ].filter(Boolean)
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
