import { Flame, CircleCheck, Bookmark, RotateCcw } from 'lucide-react'
import { MODULES, MODULE_THEME, ScreenHeader, ProgressBar } from './primitives'

type Mastery = Record<string, { pct: number; total: number }>

function StatCard({
  icon,
  bg,
  color,
  value,
  label,
}: {
  icon: React.ReactNode
  bg: string
  color: string
  value: string
  label: string
}) {
  return (
    <div style={{ borderRadius: 16, background: bg, padding: '16px 18px' }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 38, height: 38, borderRadius: 11, background: color, color: '#fff', marginBottom: 10 }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 5 }}>{label}</div>
    </div>
  )
}

export function ProgressView({
  total,
  accuracy,
  streak,
  bookmarkCount,
  mistakeCount,
  coursSeen,
  coursTotal,
  mastery,
}: {
  total: number
  accuracy: number
  streak: number
  bookmarkCount: number
  mistakeCount: number
  coursSeen: number
  coursTotal: number
  mastery: Mastery
}) {
  const coveragePct = coursTotal > 0 ? Math.round((coursSeen / coursTotal) * 100) : 0
  if (total === 0) {
    return (
      <div>
        <ScreenHeader title="Progrès" />
        <div style={{ padding: '0 20px' }}>
          <div
            className="flex flex-col items-center text-center"
            style={{ padding: '48px 20px', border: '0.5px solid var(--gray-200)', borderRadius: 16, gap: 8 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Pas encore de statistiques</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 260 }}>
              Réponds à des QCMs pour suivre ta progression ici.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title="Progrès" />

      {/* Stat cards */}
      <div className="grid" style={{ padding: '0 20px', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <StatCard
          icon={<Flame size={18} />}
          bg="var(--warning-bg)"
          color="var(--warning-text)"
          value={String(streak)}
          label={streak > 1 ? "Jours d'affilée" : 'Jour actif'}
        />
        <StatCard
          icon={<CircleCheck size={18} />}
          bg="var(--success-bg)"
          color="var(--success-text)"
          value={`${accuracy}%`}
          label="Réussite globale"
        />
      </div>

      {/* Coverage (breadth) — distinct from accuracy (depth) */}
      <div style={{ padding: '0 20px', marginBottom: 18 }}>
        <div
          style={{ borderRadius: 12, border: '0.5px solid var(--gray-200)', background: '#fff', padding: '14px 16px' }}
        >
          <div className="flex justify-between items-baseline" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>Couverture du programme</span>
            <span style={{ fontSize: 12, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
              {coursSeen}/{coursTotal} chapitres
            </span>
          </div>
          <ProgressBar value={coveragePct} track="var(--gray-100)" />
          <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 8 }}>
            {total} QCM{total > 1 ? 's' : ''} répondu{total > 1 ? 's' : ''} · {coveragePct}% du programme abordé
          </div>
        </div>
      </div>

      {/* Mastery by module */}
      <div style={{ padding: '0 20px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: '0 0 14px' }}>
          Maîtrise par matière
        </h2>
        <div
          className="flex flex-col"
          style={{ borderRadius: 12, border: '0.5px solid var(--gray-200)', background: '#fff', padding: '16px 18px', gap: 16 }}
        >
          {MODULES.map((m) => {
            const data = mastery[m]
            const t = MODULE_THEME[m]
            return (
              <div key={m}>
                <div className="flex justify-between" style={{ marginBottom: 7 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-900)' }}>{m}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
                    {data ? `${data.pct}% · ${data.total}` : '—'}
                  </span>
                </div>
                <ProgressBar value={data?.pct ?? 0} color={t.color} track={t.bg} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Mes erreurs CTA */}
      {mistakeCount > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <a
            href="/student/entrainement?erreurs=1"
            className="flex items-center"
            style={{ gap: 12, padding: '14px 16px', borderRadius: 12, background: 'var(--danger-bg)', border: '0.5px solid var(--danger-border)', color: 'var(--danger-text)' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', color: 'var(--danger-text)' }}
            >
              <RotateCcw size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Revoir mes erreurs</div>
              <div style={{ fontSize: 12, color: 'var(--danger-text)', marginTop: 2 }}>
                {mistakeCount} question{mistakeCount > 1 ? 's' : ''} à retravailler
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Favoris CTA */}
      {bookmarkCount > 0 && (
        <div style={{ padding: '18px 20px 0' }}>
          <a
            href="/student/entrainement?favoris=1"
            className="flex items-center"
            style={{ gap: 12, padding: '14px 16px', borderRadius: 12, background: 'var(--primary-50)', border: '0.5px solid var(--primary-100)', color: 'var(--primary-900)' }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', color: 'var(--primary-500)' }}
            >
              <Bookmark size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Réviser mes favoris</div>
              <div style={{ fontSize: 12, color: 'var(--primary-600)', marginTop: 2 }}>
                {bookmarkCount} question{bookmarkCount > 1 ? 's' : ''} enregistrée{bookmarkCount > 1 ? 's' : ''}
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  )
}
