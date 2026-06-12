import { Lock } from 'lucide-react'
import { ScreenHeader } from './primitives'
import { UpgradeButton } from './upgrade-button'

/**
 * Friendly "this feature is on a paid plan" screen. Shown in place of a gated
 * feature (AI tutor, library) for students whose plan doesn't include it.
 */
export function PlanLock({
  title,
  heading,
  message,
  targetPlan = 'Basic',
}: {
  /** Screen title (matches the feature's normal header). */
  title: string
  /** Short headline on the lock card. */
  heading: string
  /** One-line explanation of what unlocking gives. */
  message: string
  /** Plan named in the WhatsApp upgrade message. */
  targetPlan?: string
}) {
  return (
    <div>
      <ScreenHeader title={title} />
      <div style={{ padding: '0 20px' }}>
        <div
          className="flex flex-col items-center text-center"
          style={{
            padding: '36px 24px',
            borderRadius: 18,
            background: 'var(--primary-50)',
            border: '0.5px solid var(--gray-200)',
            gap: 12,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--primary-500)', color: '#fff' }}
          >
            <Lock size={26} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>{heading}</div>
          <div style={{ fontSize: 13.5, color: 'var(--gray-600)', maxWidth: 300, lineHeight: 1.5 }}>
            {message}
          </div>
          <div style={{ marginTop: 6 }}>
            <UpgradeButton variant="whatsapp" targetPlan={targetPlan} label="Améliorer mon abonnement" />
          </div>
        </div>
      </div>
    </div>
  )
}
