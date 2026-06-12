'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { MCQ, FlagValue } from '@/types'
import { updateMcqPosition } from '@/app/actions/mcqs'
import { Card, Badge } from './primitives'
import { QcmToolbar } from './qcm-toolbar'
import { QcmEditor } from './qcm-editor'

/** Inline-editable position cell — saves on blur/Enter, no editor needed. */
function PositionCell({ id, initial }: { id: number; initial: number | null }) {
  const [val, setVal] = useState(initial?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    const trimmed = val.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    if (next !== null && !Number.isFinite(next)) return
    if ((initial ?? null) === (next ?? null)) return
    setSaving(true)
    const res = await updateMcqPosition(id, next)
    setSaving(false)
    if (!res.success) toast.error(res.error)
  }

  return (
    <input
      type="number"
      value={val}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      style={{
        width: 50,
        height: 30,
        boxSizing: 'border-box',
        textAlign: 'center',
        border: '0.5px solid var(--gray-200)',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--gray-900)',
        background: saving ? 'var(--gray-50)' : '#fff',
        outline: 'none',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  )
}

const MODULE_VARIANT: Record<string, 'maths' | 'chimie' | 'physique' | 'svt'> = {
  Mathématiques: 'maths',
  Chimie: 'chimie',
  Physique: 'physique',
  SVT: 'svt',
}

const FLAG_LABEL: Record<FlagValue, string> = {
  image_required: 'Image',
  missing_correction: 'Réponse',
  low_confidence_module: 'Module',
  ambiguous_answer: 'Ambigu',
  duplicate: 'Doublon',
}

function truncate(text: string, max: number) {
  const clean = text.replace(/!\[.*?\]\(data:image[^)]*\)/g, '🖼').replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

export function QcmBank({
  mcqs,
  years,
  subjects,
  examBlancs,
  total,
  page,
  pageSize,
}: {
  mcqs: MCQ[]
  years: number[]
  subjects: string[]
  examBlancs: string[]
  total: number
  page: number
  pageSize: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [editing, setEditing] = useState<MCQ | 'new' | null>(null)

  // Position is 1..N per matière WITHIN one exam, so it's only meaningful (and
  // editable) when narrowed to a single matière of a single year / examen blanc.
  const orderingActive = !!(
    (searchParams.get('year') || searchParams.get('exam_blanc')) && searchParams.get('module')
  )
  const GRID = orderingActive ? '64px 120px 1fr 72px 110px 130px' : '120px 1fr 72px 110px 130px'
  const headers = orderingActive
    ? ['Ordre', 'Module', 'Question', 'Année', 'État', 'Signalements']
    : ['Module', 'Question', 'Année', 'État', 'Signalements']

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  function closeEditor() {
    setEditing(null)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <QcmToolbar
        years={years}
        subjects={subjects}
        examBlancs={examBlancs}
        onNew={() => setEditing('new')}
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
       <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 820 }}>
        {/* Header */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: GRID,
            gap: 12,
            padding: '11px 20px',
            borderBottom: '0.5px solid var(--gray-200)',
            background: 'var(--gray-50)',
          }}
        >
          {headers.map((h) => (
            <span
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--gray-600)',
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {mcqs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
            Aucun QCM ne correspond. Importez un fichier ou créez un QCM.
          </div>
        ) : (
          mcqs.map((mcq, i) => (
            <div
              key={mcq.id}
              onClick={() => setEditing(mcq)}
              className="grid items-center mp-qcm-row"
              style={{
                gridTemplateColumns: GRID,
                gap: 12,
                padding: '13px 20px',
                cursor: 'pointer',
                borderBottom: i < mcqs.length - 1 ? '0.5px solid var(--gray-100)' : 'none',
              }}
            >
              {orderingActive && <PositionCell id={mcq.id} initial={mcq.position} />}
              <span>
                {mcq.module ? (
                  <Badge variant={MODULE_VARIANT[mcq.module] ?? 'default'}>{mcq.module}</Badge>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>—</span>
                )}
              </span>
              <span
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ fontSize: 13, color: 'var(--gray-900)', minWidth: 0 }}
              >
                {truncate(mcq.question, 70)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
                {mcq.year ?? '—'}
              </span>
              <span>
                <Badge variant={mcq.status === 'ready' ? 'published' : 'flagged'} dot>
                  {mcq.status === 'ready' ? 'Publié' : 'En révision'}
                </Badge>
              </span>
              <span className="flex items-center" style={{ gap: 5, flexWrap: 'wrap' }}>
                {mcq.flags.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>—</span>
                ) : (
                  mcq.flags.map((f) => (
                    <span
                      key={f}
                      className="font-medium"
                      style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 9999,
                        background: 'var(--warning-bg)',
                        color: 'var(--warning-text)',
                      }}
                    >
                      {FLAG_LABEL[f] ?? f}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))
        )}
        </div>
       </div>
      </Card>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
            {from}–{to} sur {total}
          </span>
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '0.5px solid var(--gray-200)',
                background: '#fff',
                color: page <= 1 ? 'var(--gray-400)' : 'var(--gray-600)',
                cursor: page <= 1 ? 'default' : 'pointer',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--gray-600)', padding: '0 6px' }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '0.5px solid var(--gray-200)',
                background: '#fff',
                color: page >= totalPages ? 'var(--gray-400)' : 'var(--gray-600)',
                cursor: page >= totalPages ? 'default' : 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {editing && (
        <QcmEditor mcq={editing} onClose={closeEditor} subjects={subjects} examBlancs={examBlancs} />
      )}

      <style>{`.mp-qcm-row:hover { background: var(--gray-50); }`}</style>
    </div>
  )
}
