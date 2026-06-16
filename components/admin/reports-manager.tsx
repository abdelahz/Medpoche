'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, RotateCcw, Trash2, Loader2, Flag, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportRow } from '@/types'
import { resolveReport, reopenReport, deleteReport } from '@/app/actions/reports'
import { MCQRenderer } from '@/components/shared/mcq-renderer'
import { Card } from './primitives'

const CTX: Record<string, { label: string; bg: string; color: string }> = {
  mcq: { label: 'QCM', bg: 'var(--primary-50)', color: 'var(--primary-600)' },
  ai: { label: 'IA', bg: 'var(--accent-50, #F1ECFF)', color: 'var(--accent-600, #6B46E5)' },
  library: { label: 'Bibliothèque', bg: 'var(--info-bg)', color: 'var(--info-text)' },
  autre: { label: 'Autre', bg: 'var(--gray-100)', color: 'var(--gray-600)' },
}

type Filter = 'open' | 'resolved' | 'all'

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium"
      style={{
        padding: '6px 13px',
        borderRadius: 9999,
        fontSize: 12,
        cursor: 'pointer',
        border: active ? '0.5px solid var(--primary-100)' : '0.5px solid var(--gray-200)',
        background: active ? 'var(--primary-50)' : '#fff',
        color: active ? 'var(--primary-600)' : 'var(--gray-600)',
      }}
    >
      {children}
    </button>
  )
}

/** A labelled identifier pill, e.g. "Matière: Physique". */
function Tag({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === '' || value === undefined) return null
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: 5, padding: '3px 9px', borderRadius: 8, fontSize: 11.5, background: 'var(--gray-100)', color: 'var(--gray-700)' }}
    >
      <span style={{ color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </span>
  )
}

export function ReportsManager({ reports }: { reports: ReportRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('open')
  const [busyId, setBusyId] = useState<number | null>(null)

  const openCount = useMemo(() => reports.filter((r) => r.status === 'open').length, [reports])
  const filtered = useMemo(
    () => (filter === 'all' ? reports : reports.filter((r) => r.status === filter)),
    [reports, filter]
  )

  async function run(id: number, fn: (id: number) => Promise<{ success: boolean; error?: string }>, ok: string) {
    setBusyId(id)
    const res = await fn(id)
    setBusyId(null)
    if (res.success) {
      toast.success(ok)
      router.refresh()
    } else {
      toast.error(res.error ?? 'Action impossible.')
    }
  }

  function onDelete(id: number) {
    if (!confirm('Supprimer définitivement ce signalement ?')) return
    run(id, deleteReport, 'Signalement supprimé.')
  }

  return (
    <div>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Chip active={filter === 'open'} onClick={() => setFilter('open')}>
          À traiter{openCount > 0 ? ` (${openCount})` : ''}
        </Chip>
        <Chip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
          Résolus
        </Chip>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Tous
        </Chip>
      </div>

      {filtered.length === 0 ? (
        <Card style={{ padding: '48px 20px' }}>
          <div className="flex flex-col items-center justify-center text-center" style={{ gap: 10 }}>
            <span
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gray-100)', color: 'var(--gray-400)' }}
            >
              <Flag size={22} />
            </span>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              {filter === 'open' ? 'Aucun signalement à traiter. 🎉' : 'Aucun signalement.'}
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {filtered.map((r) => {
            const ctx = CTX[r.context] ?? CTX.autre
            const resolved = r.status === 'resolved'
            const busy = busyId === r.id
            const d = r.detail
            return (
              <Card key={r.id} style={{ padding: 16, opacity: resolved ? 0.65 : 1 }}>
                <div className="flex items-start" style={{ gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header */}
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span
                        className="inline-flex items-center font-medium"
                        style={{ padding: '3px 9px', borderRadius: 9999, fontSize: 11, background: ctx.bg, color: ctx.color }}
                      >
                        {ctx.label}
                      </span>
                      {resolved && (
                        <span
                          className="inline-flex items-center font-medium"
                          style={{ padding: '3px 9px', borderRadius: 9999, fontSize: 11, background: 'var(--success-bg)', color: 'var(--success-text)' }}
                        >
                          Résolu
                        </span>
                      )}
                      <span style={{ fontSize: 11.5, color: 'var(--gray-500)' }}>
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                        {r.reporter ? ` · ${r.reporter}` : ''}
                      </span>
                    </div>

                    {/* Identifying tags */}
                    {d?.kind === 'mcq' && (
                      <div className="flex items-center" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <Tag label="Matière" value={d.module} />
                        <Tag label="Cours" value={d.subject} />
                        <Tag label="Année" value={d.year} />
                        <Tag label="Examen" value={d.exam_blanc} />
                        <Tag label="N°" value={d.position} />
                      </div>
                    )}
                    {d?.kind === 'library' && (
                      <div className="flex items-center" style={{ gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <Tag label="Type" value={d.type} />
                        <Tag label="Matière" value={d.module} />
                        <Tag label="Cours" value={d.subject} />
                      </div>
                    )}

                    {/* The reported item itself */}
                    {d?.kind === 'mcq' && (
                      <div style={{ fontSize: 13, color: 'var(--gray-900)', maxHeight: 160, overflow: 'auto' }}>
                        <MCQRenderer text={d.question} />
                      </div>
                    )}
                    {d?.kind === 'library' && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{d.title}</div>
                    )}
                    {d?.kind === 'ai' && (
                      <div style={{ fontSize: 13, color: 'var(--gray-900)' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)' }}>
                          Question
                        </span>
                        <div style={{ marginTop: 3 }}>
                          {d.question ? <MCQRenderer text={d.question} /> : <em style={{ color: 'var(--gray-500)' }}>(indisponible)</em>}
                        </div>
                      </div>
                    )}
                    {!d && (
                      <div style={{ fontSize: 13, color: 'var(--gray-700)' }}>
                        {r.label || <em style={{ color: 'var(--gray-500)' }}>(sans détail)</em>}
                        <span style={{ color: 'var(--gray-400)', marginLeft: 6 }}>
                          {r.context_id ? `#${r.context_id} — introuvable (peut-être supprimé)` : ''}
                        </span>
                      </div>
                    )}

                    {/* Student's note */}
                    {r.message && (
                      <div
                        style={{ marginTop: 10, padding: '8px 11px', borderRadius: 10, background: 'var(--gray-50)', fontSize: 13, color: 'var(--gray-800)', whiteSpace: 'pre-wrap' }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>Note : </span>
                        {r.message}
                      </div>
                    )}

                    {/* Deep link to the source */}
                    {d?.kind === 'mcq' && (
                      <Link
                        href={d.href}
                        className="inline-flex items-center"
                        style={{ gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--primary-600)' }}
                      >
                        Ouvrir dans la banque QCM <ArrowUpRight size={14} />
                      </Link>
                    )}
                    {d?.kind === 'library' && (
                      <Link
                        href="/admin/bibliotheque"
                        className="inline-flex items-center"
                        style={{ gap: 4, marginTop: 10, fontSize: 12, fontWeight: 600, color: 'var(--primary-600)' }}
                      >
                        Ouvrir la bibliothèque <ArrowUpRight size={14} />
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center flex-shrink-0" style={{ gap: 4 }}>
                    {resolved ? (
                      <button
                        type="button"
                        onClick={() => run(r.id, reopenReport, 'Signalement rouvert.')}
                        disabled={busy}
                        title="Rouvrir"
                        className="flex items-center justify-center"
                        style={{ width: 32, height: 32, borderRadius: 8, color: 'var(--gray-600)', cursor: 'pointer' }}
                      >
                        {busy ? <Loader2 size={15} className="mp-spin" /> : <RotateCcw size={15} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => run(r.id, resolveReport, 'Signalement résolu.')}
                        disabled={busy}
                        title="Marquer comme résolu"
                        className="flex items-center justify-center"
                        style={{ width: 32, height: 32, borderRadius: 8, color: 'var(--success-text)', cursor: 'pointer' }}
                      >
                        {busy ? <Loader2 size={15} className="mp-spin" /> : <Check size={16} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      disabled={busy}
                      title="Supprimer"
                      className="flex items-center justify-center"
                      style={{ width: 32, height: 32, borderRadius: 8, color: 'var(--danger-text)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
