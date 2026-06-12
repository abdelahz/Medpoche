import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { whatsappUpgradeUrl } from '@/lib/upgrade'

/** Centered max-width container. */
export function Container({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`mx-auto w-full ${className}`} style={{ maxWidth: 1160, padding: '0 22px', ...style }}>
      {children}
    </div>
  )
}

/** Small uppercase eyebrow above a section heading. */
export function Eyebrow({ children, color = 'var(--primary-600)' }: { children: ReactNode; color?: string }) {
  return (
    <div
      className="inline-flex items-center font-bold"
      style={{
        gap: 7,
        padding: '5px 12px',
        borderRadius: 9999,
        background: 'var(--primary-50)',
        color,
        fontSize: 11.5,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  )
}

type CtaVariant = 'primary' | 'ghost' | 'white' | 'whatsapp' | 'accent'

const CTA_STYLE: Record<CtaVariant, React.CSSProperties> = {
  primary: { background: 'var(--grad-primary)', color: '#fff', boxShadow: '0 8px 22px rgba(76,123,255,0.35)' },
  ghost: { background: 'transparent', color: 'var(--gray-900)', border: '0.5px solid var(--gray-200)' },
  white: { background: '#fff', color: 'var(--primary-600)', boxShadow: '0 8px 22px rgba(16,24,40,0.12)' },
  whatsapp: { background: '#25D366', color: '#fff', boxShadow: '0 8px 22px rgba(37,211,102,0.32)' },
  accent: { background: 'var(--grad-accent)', color: '#fff', boxShadow: '0 10px 26px rgba(124,92,255,0.42)' },
}

/** Primary CTA pill. Internal links use `href`; WhatsApp uses `whatsapp`. */
export function Cta({
  children,
  href,
  whatsapp,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  children: ReactNode
  href?: string
  whatsapp?: boolean
  variant?: CtaVariant
  size?: 'md' | 'lg'
  className?: string
}) {
  const dims: React.CSSProperties =
    size === 'lg'
      ? { height: 54, padding: '0 30px', fontSize: 15.5 }
      : { height: 46, padding: '0 22px', fontSize: 14 }
  const common = `inline-flex items-center justify-center font-bold ${className}`
  const style: React.CSSProperties = {
    gap: 9,
    borderRadius: 9999,
    textDecoration: 'none',
    transition: 'transform 150ms ease, box-shadow 150ms ease, background 150ms ease',
    ...dims,
    ...CTA_STYLE[variant],
  }
  if (whatsapp) {
    return (
      <a href={whatsappUpgradeUrl()} target="_blank" rel="noopener noreferrer" className={common} style={style}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href ?? '/auth/register'} className={common} style={style}>
      {children}
    </Link>
  )
}

/** Decorative drifting blob for section backdrops. */
export function Blob({
  color,
  size = 360,
  style,
  className = '',
}: {
  color: string
  size?: number
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={`lp-drift ${className}`}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: 'blur(70px)',
        opacity: 0.5,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

/**
 * Phone frame for app screenshots. Pass `src` once a real screenshot exists;
 * until then a branded placeholder keeps the layout looking finished.
 */
export function PhoneMockup({
  src,
  alt,
  priority = false,
  width = 280,
  className = '',
  style,
  children,
}: {
  src?: string
  alt: string
  priority?: boolean
  width?: number
  className?: string
  style?: React.CSSProperties
  /** Custom in-frame screen (used when no real screenshot `src` is provided). */
  children?: React.ReactNode
}) {
  const height = Math.round(width * 2.05)
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: 38,
        background: '#0F1424',
        padding: 11,
        boxShadow: '0 30px 70px rgba(16,24,40,0.28), 0 8px 20px rgba(16,24,40,0.12)',
        position: 'relative',
        ...style,
      }}
    >
      {/* notch */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 92,
          height: 22,
          borderRadius: 9999,
          background: '#0F1424',
          zIndex: 2,
        }}
      />
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: '#fff' }}>
        {src ? (
          <Image src={src} alt={alt} fill priority={priority} sizes={`${width}px`} style={{ objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          children ?? <PhonePlaceholder />
        )}
      </div>
    </div>
  )
}

/** Branded app-like placeholder shown until a real screenshot is dropped in. */
function PhonePlaceholder() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="lp-gradient-animated" style={{ height: '34%', background: 'var(--grad-primary)', padding: 18, color: '#fff' }}>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 22 }}>Objectif du jour</div>
        <div style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>12 / 20</div>
        <div style={{ height: 7, borderRadius: 9999, background: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
          <div style={{ width: '60%', height: '100%', borderRadius: 9999, background: '#fff' }} />
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mp-skeleton" style={{ height: 44, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )
}

/** Logo wordmark used in nav/footer. */
export function BrandMark({ light = false, height = 30 }: { light?: boolean; height?: number }) {
  return (
    <Image
      src={light ? '/brand/logo-white.png' : '/brand/logo.png'}
      alt="MedenPoche"
      width={height * 3.4}
      height={height}
      style={{ height, width: 'auto', display: 'block' }}
      priority
    />
  )
}
