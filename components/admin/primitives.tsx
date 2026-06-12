import type { ReactNode } from 'react'

/* ---- Avatar ---- */
export function Avatar({ initials, size = 36 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: 'var(--primary-50)',
        color: 'var(--primary-600)',
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials}
    </div>
  )
}

/* ---- Card ---- */
export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        border: '0.5px solid var(--gray-200)',
        borderRadius: 12,
        padding: '16px 20px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ---- Badge ---- */
type BadgeVariant =
  | 'published'
  | 'flagged'
  | 'error'
  | 'info'
  | 'default'
  | 'maths'
  | 'chimie'
  | 'physique'
  | 'svt'

const badgeMap: Record<BadgeVariant, { bg: string; color: string; solid?: string }> = {
  published: { bg: 'var(--success-bg)', color: 'var(--success-text)', solid: 'var(--success-solid)' },
  flagged: { bg: 'var(--warning-bg)', color: 'var(--warning-text)', solid: 'var(--warning-solid)' },
  error: { bg: 'var(--danger-bg)', color: 'var(--danger-text)', solid: 'var(--danger-solid)' },
  info: { bg: 'var(--info-bg)', color: 'var(--info-text)' },
  default: { bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  maths: { bg: '#EEF4FF', color: '#3B6BE8' },
  chimie: { bg: '#E6F6FE', color: '#0369A1' },
  physique: { bg: '#F3EEFE', color: '#6D28D9' },
  svt: { bg: '#E7F8F1', color: '#047857' },
}

export function Badge({
  variant = 'default',
  dot,
  children,
}: {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
}) {
  const v = badgeMap[variant]
  return (
    <span
      className="inline-flex items-center font-medium whitespace-nowrap"
      style={{
        gap: 5,
        padding: '3px 9px',
        borderRadius: 9999,
        fontSize: 11,
        background: v.bg,
        color: v.color,
      }}
    >
      {dot && v.solid && (
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: v.solid }} />
      )}
      {children}
    </span>
  )
}

/* ---- StatCard ---- */
type Tone = 'info' | 'success' | 'warning' | 'danger'
const toneMap: Record<Tone, { bg: string; color: string }> = {
  info: { bg: 'var(--info-bg)', color: 'var(--info-text)' },
  success: { bg: 'var(--success-bg)', color: 'var(--success-text)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning-text)' },
  danger: { bg: 'var(--danger-bg)', color: 'var(--danger-text)' },
}

export function StatCard({
  icon,
  tone = 'info',
  value,
  label,
  delta,
  deltaTone = 'up',
}: {
  icon: ReactNode
  tone?: Tone
  value: ReactNode
  label: string
  delta?: string
  deltaTone?: 'up' | 'down'
}) {
  const t = toneMap[tone]
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 8, background: t.bg, color: t.color }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 5 }}>{label}</div>
      </div>
      {delta && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: deltaTone === 'down' ? 'var(--danger-text)' : 'var(--success-text)',
          }}
        >
          {delta}
        </div>
      )}
    </Card>
  )
}

/* ---- SectionTitle ---- */
export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
        {children}
      </h2>
      {right}
    </div>
  )
}
