import type { LucideIcon } from 'lucide-react'
import { Card } from './primitives'

export function PagePlaceholder({
  icon: Icon,
  subtitle,
}: {
  icon: LucideIcon
  subtitle: string
}) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>{subtitle}</p>
      <Card
        className="flex flex-col items-center justify-center"
        style={{ gap: 12, padding: '56px 20px' }}
      >
        <Icon size={28} color="var(--gray-400)" />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>
          Bientôt disponible
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          Cette section sera activée dans une prochaine étape.
        </div>
      </Card>
    </div>
  )
}
