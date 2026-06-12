import type { LucideIcon } from 'lucide-react'
import { ScreenHeader } from './primitives'

export function StudentPlaceholder({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <div>
      <ScreenHeader title={title} />
      <div style={{ padding: '0 20px' }}>
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            border: '0.5px solid var(--gray-200)',
            borderRadius: 16,
            padding: '48px 20px',
            gap: 12,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-50)', color: 'var(--primary-500)' }}
          >
            <Icon size={24} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Bientôt disponible</div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 260 }}>{subtitle}</div>
        </div>
      </div>
    </div>
  )
}
