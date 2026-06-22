import { UPGRADE_STEPS } from '@/lib/upgrade'

/**
 * Compact "how the upgrade works" explainer shown under upgrade CTAs. Removes
 * the "what happens after I tap?" uncertainty of the manual (WhatsApp → RIB →
 * virement → preuve → activation) flow.
 */
export function HowItWorks({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        marginTop: compact ? 10 : 14,
        padding: compact ? '10px 12px' : '12px 14px',
        borderRadius: 14,
        background: 'var(--gray-50)',
        border: '0.5px solid var(--gray-200)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>
        Comment ça marche
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {UPGRADE_STEPS.map((s, i) => (
          <li key={s.text} className="flex items-center" style={{ gap: 9, fontSize: 12, color: 'var(--gray-700)' }}>
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 20, height: 20, borderRadius: 9999, background: '#fff', border: '0.5px solid var(--gray-200)', fontSize: 11, fontWeight: 700, color: 'var(--gray-600)' }}
            >
              {i + 1}
            </span>
            <span>
              {s.emoji} {s.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
