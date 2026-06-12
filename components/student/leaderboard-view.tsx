import { Zap, Trophy } from 'lucide-react'
import type { LeaderboardRow } from '@/types'
import { ScreenHeader } from './primitives'

const MEDAL: Record<number, string> = { 1: '#F59E0B', 2: '#9CA3AF', 3: '#B45309' }

export function LeaderboardView({
  rows,
  myUserId,
}: {
  rows: LeaderboardRow[]
  myUserId: string | null
}) {
  const me = rows.find((r) => r.user_id === myUserId) ?? null

  return (
    <div>
      <ScreenHeader eyebrow="Cette semaine" title="Classement" />

      <div style={{ padding: '0 20px 24px' }}>
        {me && (
          <div
            className="flex items-center"
            style={{ gap: 12, marginBottom: 16, padding: '16px 18px', borderRadius: 18, background: 'var(--grad-primary)', color: '#fff' }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, minWidth: 28 }}>#{me.rank}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Ta place cette semaine</span>
            <span className="inline-flex items-center" style={{ gap: 5, fontSize: 14, fontWeight: 700 }}>
              <Zap size={15} />
              {me.xp}
            </span>
          </div>
        )}

        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center text-center"
            style={{ border: '0.5px solid var(--gray-200)', borderRadius: 16, padding: '48px 20px', gap: 10 }}
          >
            <Trophy size={26} color="var(--gray-400)" />
            <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 280 }}>
              Le classement démarre dès que les élèves s&apos;entraînent cette semaine. Réponds à des
              QCM pour y figurer !
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 8 }}>
            {rows.map((r) => {
              const mine = r.user_id === myUserId
              return (
                <div
                  key={r.user_id}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: mine ? '1.5px solid var(--primary-500)' : '0.5px solid var(--gray-200)',
                    background: mine ? 'var(--primary-50)' : '#fff',
                  }}
                >
                  <span
                    className="flex items-center justify-center flex-shrink-0 font-bold"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9999,
                      fontSize: 13,
                      background: MEDAL[r.rank] ?? 'var(--gray-100)',
                      color: MEDAL[r.rank] ? '#fff' : 'var(--gray-600)',
                    }}
                  >
                    {r.rank}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>
                      {mine ? 'Toi' : r.display}
                    </div>
                    {r.filiere && (
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                        {r.filiere}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center flex-shrink-0 font-bold" style={{ gap: 5, fontSize: 13, color: 'var(--accent-600)' }}>
                    <Zap size={14} />
                    {r.xp}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
