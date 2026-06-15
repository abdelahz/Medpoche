import { whatsappUpgradeUrl, INSTAGRAM_GRADIENT } from '@/lib/upgrade'

/** Instagram glyph (outline, inherits white on the gradient button). */
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

type Variant = 'accent' | 'primary' | 'whatsapp'

const VARIANT_BG: Record<Variant, string> = {
  accent: 'var(--grad-accent)',
  primary: 'var(--primary-500)',
  // 'whatsapp' kept as the variant key for callers; styled as Instagram for now.
  whatsapp: INSTAGRAM_GRADIENT,
}

/**
 * Upgrade CTA. Opens our contact inbox (Instagram for now — manual upgrade flow).
 * Plain anchor — safe in both server and client components.
 */
export function UpgradeButton({
  label = 'Améliorer mon abonnement',
  targetPlan,
  variant = 'accent',
  fullWidth = false,
}: {
  label?: string
  targetPlan?: string
  variant?: Variant
  fullWidth?: boolean
}) {
  return (
    <a
      href={whatsappUpgradeUrl(targetPlan)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center font-bold text-white"
      style={{
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        height: 44,
        padding: '0 22px',
        borderRadius: 9999,
        background: VARIANT_BG[variant],
        color: '#fff',
        fontSize: 13.5,
        textDecoration: 'none',
      }}
    >
      <InstagramIcon size={17} />
      {label}
    </a>
  )
}
