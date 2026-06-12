'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ExtractedMCQ } from '@/types'
import { saveMcqs } from '@/app/actions/mcqs'
import { MCQRenderer } from '@/components/shared/mcq-renderer'
import { Button } from './button'
import { Card } from './primitives'

const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT']

type Row = ExtractedMCQ & { _key: number }

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gray-600)',
  marginBottom: 4,
}

function FlagPill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        gap: 5,
        padding: '3px 9px',
        borderRadius: 9999,
        fontSize: 11,
        background: 'var(--warning-bg)',
        color: 'var(--warning-text)',
      }}
    >
      {icon}
      {children}
    </span>
  )
}

const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'] as const
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

/** A field is worth rendering (KaTeX preview) when it contains math or an embedded image. */
function needsPreview(text: string): boolean {
  return text.includes('$') || text.includes('data:image')
}

export function McqPreviewTable({
  initial,
  onImported,
  onCancel,
}: {
  initial: ExtractedMCQ[]
  onImported: () => void
  onCancel: () => void
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((m, i) => ({ ...m, _key: i }))
  )
  const [saving, setSaving] = useState(false)
  const [bulkExam, setBulkExam] = useState('')
  const [bulkYear, setBulkYear] = useState('')

  function update(key: number, patch: Partial<ExtractedMCQ>) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, ...patch } : r)))
  }

  function applyBulk() {
    const patch: Partial<ExtractedMCQ> = {}
    if (bulkExam.trim()) patch.exam_blanc = bulkExam.trim()
    if (bulkYear.trim()) patch.year = Number(bulkYear)
    if (Object.keys(patch).length === 0) return
    setRows((prev) => prev.map((r) => ({ ...r, ...patch })))
  }

  function remove(key: number) {
    setRows((prev) => prev.filter((r) => r._key !== key))
  }

  async function handleImport() {
    if (rows.length === 0) return
    setSaving(true)
    const payload: ExtractedMCQ[] = rows.map(({ _key, ...m }) => {
      void _key
      return m
    })
    const res = await saveMcqs(payload)
    setSaving(false)

    if (res.success) {
      toast.success(`${res.count} QCM${res.count > 1 ? 's' : ''} importé${res.count > 1 ? 's' : ''}.`)
      onImported()
    } else {
      toast.error(res.error)
    }
  }

  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center" style={{ gap: 12, padding: '40px 20px' }}>
        <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>Aucun QCM à importer.</p>
        <Button variant="ghost" onClick={onCancel}>
          Recommencer
        </Button>
      </Card>
    )
  }

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Action bar */}
      <div
        className="flex items-center justify-between sticky top-0 z-10"
        style={{
          background: 'var(--gray-50)',
          paddingBottom: 4,
        }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            {rows.length} QCM{rows.length > 1 ? 's' : ''} extrait{rows.length > 1 ? 's' : ''}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
            Vérifiez et corrigez avant l&apos;import. Les QCMs sont enregistrés en révision.
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={saving}>
            {saving && <Loader2 size={14} className="mp-spin" />}
            {saving ? 'Import…' : `Importer ${rows.length} QCM${rows.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Bulk assign — tag the whole batch at once */}
      <Card style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Examen blanc (tout le lot)</label>
          <input
            value={bulkExam}
            onChange={(e) => setBulkExam(e.target.value)}
            placeholder="Ex. Examen blanc 1"
            style={{ ...inputStyle, width: 200 }}
          />
        </div>
        <div>
          <label style={labelStyle}>Année (tout le lot)</label>
          <input
            type="number"
            value={bulkYear}
            onChange={(e) => setBulkYear(e.target.value)}
            placeholder="Ex. 2022"
            style={{ ...inputStyle, width: 120 }}
          />
        </div>
        <Button variant="secondary" onClick={applyBulk}>
          Appliquer à tous
        </Button>
      </Card>

      {/* Editable cards */}
      {rows.map((row, idx) => {
        const missingCorrection = !row.correct
        const lowModule = !row.module
        return (
          <Card key={row._key} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)' }}>
                QCM {idx + 1}
              </span>
              <div className="flex items-center" style={{ gap: 6 }}>
                {row.image_required && (
                  <FlagPill icon={<ImageIcon size={12} />}>Image requise</FlagPill>
                )}
                {missingCorrection && (
                  <FlagPill icon={<AlertTriangle size={12} />}>Correction manquante</FlagPill>
                )}
                {lowModule && (
                  <FlagPill icon={<AlertTriangle size={12} />}>Module incertain</FlagPill>
                )}
                <button
                  type="button"
                  onClick={() => remove(row._key)}
                  title="Supprimer ce QCM"
                  className="flex"
                  style={{ color: 'var(--gray-400)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Question */}
            <div>
              <label style={labelStyle}>Énoncé</label>
              <textarea
                value={row.question}
                onChange={(e) => update(row._key, { question: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              {needsPreview(row.question) && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    background: 'var(--gray-50)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Aperçu
                  </div>
                  <MCQRenderer text={row.question} />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {OPTION_KEYS.map((key, i) => {
                const value = row[key]
                if (key === 'option_e' && (value === null || value === undefined)) {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update(row._key, { option_e: '' })}
                      className="flex items-center"
                      style={{
                        gap: 6,
                        fontSize: 12,
                        color: 'var(--primary-500)',
                        cursor: 'pointer',
                        padding: '8px 0',
                      }}
                    >
                      + Ajouter l&apos;option E
                    </button>
                  )
                }
                const text = (value as string) ?? ''
                return (
                  <div key={key}>
                    <label style={labelStyle}>Option {OPTION_LABELS[i]}</label>
                    <input
                      value={text}
                      onChange={(e) =>
                        update(row._key, { [key]: e.target.value } as Partial<ExtractedMCQ>)
                      }
                      style={inputStyle}
                    />
                    {needsPreview(text) && (
                      <div style={{ marginTop: 5, padding: '6px 9px', background: 'var(--gray-50)', borderRadius: 8 }}>
                        <MCQRenderer text={text} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Meta row */}
            <div className="grid" style={{ gridTemplateColumns: '90px 1fr 1fr 90px', gap: 10 }}>
              <div>
                <label style={labelStyle}>Réponse</label>
                <input
                  value={row.correct}
                  onChange={(e) =>
                    update(row._key, {
                      correct: e.target.value.toUpperCase().replace(/[^A-E]/g, ''),
                    })
                  }
                  placeholder="ex. AC"
                  style={{ ...inputStyle, fontWeight: 600 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Module</label>
                <select
                  value={row.module ?? ''}
                  onChange={(e) => update(row._key, { module: e.target.value || null })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Non défini</option>
                  {MODULES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Matière / chapitre</label>
                <input
                  value={row.subject ?? ''}
                  onChange={(e) => update(row._key, { subject: e.target.value || null })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Année</label>
                <input
                  type="number"
                  value={row.year ?? ''}
                  onChange={(e) =>
                    update(row._key, { year: e.target.value ? Number(e.target.value) : null })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label style={labelStyle}>Correction / explication</label>
              <textarea
                value={row.explanation ?? ''}
                onChange={(e) => update(row._key, { explanation: e.target.value || null })}
                rows={2}
                placeholder="Optionnel"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
