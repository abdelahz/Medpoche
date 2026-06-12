'use client'

import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { getStudentDetail, type StudentDetail } from '@/app/actions/students'
import { Avatar } from './primitives'

function initials(name: string | null) {
  if (!name?.trim()) return 'É'
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '0.5px solid var(--gray-200)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 5 }}>{label}</div>
    </div>
  )
}

export function StudentDetailModal({
  studentId,
  onClose,
}: {
  studentId: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<StudentDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getStudentDetail(studentId).then((res) => {
      if (!active) return
      if ('detail' in res) setDetail(res.detail)
      else setError(res.error)
    })
    return () => {
      active = false
    }
  }, [studentId])

  const accuracy =
    detail && detail.stats.total > 0
      ? Math.round((detail.stats.correct / detail.stats.total) * 100)
      : 0

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(26,29,46,0.35)', zIndex: 50, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col"
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-modal)',
          width: 560,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            Détails de l&apos;étudiant
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ padding: 20 }}>
          {error ? (
            <p style={{ fontSize: 13, color: 'var(--danger-text)' }}>{error}</p>
          ) : !detail ? (
            <div className="flex items-center justify-center" style={{ padding: '40px 0', color: 'var(--gray-400)' }}>
              <Loader2 size={22} className="mp-spin" />
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 20 }}>
              {/* Identity */}
              <div className="flex items-center" style={{ gap: 12 }}>
                <Avatar initials={initials(detail.full_name)} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>
                      {detail.full_name ?? 'Sans nom'}
                    </span>
                    <span
                      className="font-medium"
                      style={{
                        fontSize: 11,
                        padding: '2px 9px',
                        borderRadius: 9999,
                        background: detail.is_premium ? 'var(--info-bg)' : 'var(--gray-100)',
                        color: detail.is_premium ? 'var(--info-text)' : 'var(--gray-600)',
                      }}
                    >
                      {detail.is_premium ? 'Premium' : 'Gratuit'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{detail.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    Inscrit le{' '}
                    {new Date(detail.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Today usage + global stats */}
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatBox label="Questions IA aujourd'hui" value={String(detail.questions_today)} />
                <StatBox label="QCMs aujourd'hui" value={String(detail.mcqs_today)} />
                <StatBox label="Réussite globale" value={detail.stats.total > 0 ? `${accuracy}%` : '—'} />
              </div>

              {/* Per-module breakdown */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', margin: '0 0 12px' }}>
                  Activité par module
                </h3>
                {detail.stats.total === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    Aucune activité pour le moment.
                  </p>
                ) : (
                  <div className="flex flex-col" style={{ gap: 14 }}>
                    {detail.stats.byModule.map((m) => {
                      const pct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
                      return (
                        <div key={m.module}>
                          <div className="flex justify-between" style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 13, color: 'var(--gray-900)' }}>{m.module}</span>
                            <span style={{ fontSize: 12, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
                              {m.correct}/{m.total} · {pct}%
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 9999, background: 'var(--gray-100)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 9999, background: 'var(--primary-500)' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
