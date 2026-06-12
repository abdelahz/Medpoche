import { Sigma, FlaskConical, Atom, Leaf, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Per-module theme, keyed by the module name stored in the DB. */
export const MODULE_THEME: Record<
  string,
  { color: string; bg: string; icon: LucideIcon }
> = {
  Mathématiques: { color: '#3B6BE8', bg: '#EEF4FF', icon: Sigma },
  Chimie: { color: '#0EA5E9', bg: '#E6F6FE', icon: FlaskConical },
  Physique: { color: '#8B5CF6', bg: '#F3EEFE', icon: Atom },
  SVT: { color: '#10B981', bg: '#E7F8F1', icon: Leaf },
}

export const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT'] as const

export function ModuleIcon({
  module,
  size = 44,
  radius = 12,
}: {
  module: string
  size?: number
  radius?: number
}) {
  const t = MODULE_THEME[module] ?? MODULE_THEME.Mathématiques
  const Icon = t.icon
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, borderRadius: radius, background: t.bg, color: t.color }}
    >
      <Icon size={Math.round(size * 0.46)} />
    </div>
  )
}

export function StudentAvatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: 'var(--primary-50)',
        color: 'var(--primary-600)',
        fontWeight: 600,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {initials}
    </div>
  )
}

export function ProgressBar({
  value = 0,
  height = 6,
  color = 'var(--primary-500)',
  track = 'var(--primary-50)',
}: {
  value?: number
  height?: number
  color?: string
  track?: string
}) {
  return (
    <div style={{ height, borderRadius: 9999, background: track, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          borderRadius: 9999,
          background: color,
          transition: 'width 400ms ease',
        }}
      />
    </div>
  )
}

export function ScreenHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string
  title: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between" style={{ padding: '40px 20px 14px' }}>
      <div>
        {eyebrow && (
          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 3 }}>{eyebrow}</div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>
      {right}
    </div>
  )
}

export function initialsOf(name: string | null): string {
  if (!name?.trim()) return 'É'
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
