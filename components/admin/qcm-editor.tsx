'use client'

import { useState, useRef } from 'react'
import { X, Trash2, Image as ImageIcon, Check, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { MCQ } from '@/types'
import { COURS_BY_MATIERE } from '@/types'
import { saveMcq, deleteMcq, generateExplanation, type McqInput } from '@/app/actions/mcqs'
import { MCQRenderer } from '@/components/shared/mcq-renderer'
import { Button } from './button'

const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT']
const OPTION_DEFS = [
  { key: 'A', field: 'option_a' as const },
  { key: 'B', field: 'option_b' as const },
  { key: 'C', field: 'option_c' as const },
  { key: 'D', field: 'option_d' as const },
  { key: 'E', field: 'option_e' as const },
]

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024 // keep embedded images reasonable

type FormState = McqInput

function blankForm(): FormState {
  return {
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: null,
    correct: '',
    explanation: null,
    module: null,
    subject: null,
    year: null,
    exam_blanc: null,
    position: null,
    has_list: false,
    image_required: false,
  }
}

function fromMcq(m: MCQ): FormState {
  return {
    question: m.question,
    option_a: m.option_a,
    option_b: m.option_b,
    option_c: m.option_c,
    option_d: m.option_d,
    option_e: m.option_e,
    correct: m.correct ?? '',
    explanation: m.explanation,
    module: m.module,
    subject: m.subject,
    year: m.year,
    exam_blanc: m.exam_blanc,
    position: m.position,
    has_list: m.has_list,
    image_required: m.image_required,
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gray-600)',
  marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
}

export function QcmEditor({
  mcq,
  onClose,
  subjects = [],
  examBlancs = [],
}: {
  mcq: MCQ | 'new'
  onClose: () => void
  subjects?: string[]
  examBlancs?: string[]
}) {
  const isNew = mcq === 'new'
  const [form, setForm] = useState<FormState>(() => (isNew ? blankForm() : fromMcq(mcq)))
  const [showE, setShowE] = useState(() => !isNew && mcq.option_e !== null)
  const [busy, setBusy] = useState(false)
  const fileTarget = useRef<keyof FormState | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const status = isNew ? 'flagged' : mcq.status
  const [generating, setGenerating] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleGenerateExplanation() {
    if (generating) return
    if (!form.question.trim()) {
      toast.error("Saisis d'abord l'énoncé.")
      return
    }
    if (!form.correct) {
      toast.error('Indique la bonne réponse avant de générer.')
      return
    }
    setGenerating(true)
    const res = await generateExplanation(form)
    setGenerating(false)
    if (res.success) {
      set('explanation', res.explanation)
      toast.success("Explication générée — relis-la avant de publier.")
    } else {
      toast.error(res.error)
    }
  }

  // Single-answer QCMs: clicking sets the one correct option (click again to clear).
  function selectCorrect(letter: string) {
    setForm((f) => ({ ...f, correct: f.correct === letter ? '' : letter }))
  }

  // ── Image embedding (base64 markdown) ──
  function embedImage(field: keyof FormState, dataUrl: string) {
    setForm((f) => {
      const current = (f[field] as string) ?? ''
      const md = `${current ? current + '\n\n' : ''}![image](${dataUrl})`
      return { ...f, [field]: md }
    })
  }

  function handleFile(file: File, field: keyof FormState) {
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image trop volumineuse (max 1,5 Mo).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => embedImage(field, String(reader.result))
    reader.readAsDataURL(file)
  }

  function onPaste(e: React.ClipboardEvent, field: keyof FormState) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (item) {
      const file = item.getAsFile()
      if (file) {
        e.preventDefault()
        handleFile(file, field)
      }
    }
  }

  function pickImageFor(field: keyof FormState) {
    fileTarget.current = field
    fileInputRef.current?.click()
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && fileTarget.current) handleFile(file, fileTarget.current)
    e.target.value = ''
  }

  // ── Persistence ──
  async function persist(targetStatus: 'ready' | 'flagged') {
    setBusy(true)
    const res = await saveMcq({
      id: isNew ? null : mcq.id,
      fields: { ...form, option_e: showE ? form.option_e ?? '' : null },
      status: targetStatus,
    })
    setBusy(false)
    if (res.success) {
      toast.success(
        targetStatus === 'ready' ? 'QCM publié.' : isNew ? 'QCM créé.' : 'Modifications enregistrées.'
      )
      onClose()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDelete() {
    if (isNew) return
    if (!confirm('Supprimer définitivement ce QCM ? Cette action est irréversible.')) return
    setBusy(true)
    const res = await deleteMcq(mcq.id)
    setBusy(false)
    if (res.success) {
      toast.success('QCM supprimé.')
      onClose()
    } else {
      toast.error(res.error)
    }
  }

  const imgBtn = (field: keyof FormState) => (
    <button
      type="button"
      onClick={() => pickImageFor(field)}
      title="Insérer une image"
      className="flex items-center"
      style={{ gap: 4, fontSize: 11, color: 'var(--primary-500)', cursor: 'pointer' }}
    >
      <ImageIcon size={13} />
      Image
    </button>
  )

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
          width: 640,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            {isNew ? 'Nouveau QCM' : `Modifier le QCM #${mcq.id}`}
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFilePicked}
            style={{ display: 'none' }}
          />

          {/* Énoncé */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Énoncé</label>
              {imgBtn('question')}
            </div>
            <textarea
              value={form.question}
              onChange={(e) => set('question', e.target.value)}
              onPaste={(e) => onPaste(e, 'question')}
              rows={3}
              placeholder="Saisissez l'énoncé. Math en KaTeX : $\frac{1}{2}$. Collez une image (Ctrl+V)."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
            {form.question.trim() && (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  background: 'var(--gray-50)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Aperçu
                </div>
                <MCQRenderer text={form.question} />
              </div>
            )}
          </div>

          {/* Réponses */}
          <div>
            <label style={labelStyle}>Réponses — cliquez sur la lettre pour marquer la bonne</label>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {OPTION_DEFS.map(({ key, field }) => {
                if (field === 'option_e' && !showE) return null
                const correct = form.correct === key
                return (
                  <div key={key}>
                    <div
                      className="flex items-center"
                      style={{
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: correct ? '1.5px solid var(--success-solid)' : '0.5px solid var(--gray-200)',
                        background: correct ? 'var(--success-bg)' : '#fff',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => selectCorrect(key)}
                        title={correct ? 'Bonne réponse' : 'Marquer comme correcte'}
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 9999,
                          background: correct ? 'var(--success-solid)' : 'var(--gray-100)',
                          color: correct ? '#fff' : 'var(--gray-600)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {correct ? <Check size={13} /> : key}
                      </button>
                      <input
                        value={(form[field] as string) ?? ''}
                        onChange={(e) => set(field, e.target.value)}
                        onPaste={(e) => onPaste(e, field)}
                        placeholder={`Option ${key}`}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: 13,
                          color: 'var(--gray-900)',
                        }}
                      />
                      {imgBtn(field)}
                      {field === 'option_e' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowE(false)
                            set('option_e', null)
                          }}
                          title="Retirer l'option E"
                          className="flex"
                          style={{ color: 'var(--gray-400)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {(() => {
                      const v = (form[field] as string) ?? ''
                      return v.includes('$') || v.includes('data:image') ? (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 8 }}>
                          <MCQRenderer text={v} />
                        </div>
                      ) : null
                    })()}
                  </div>
                )
              })}
              {!showE && (
                <button
                  type="button"
                  onClick={() => {
                    setShowE(true)
                    set('option_e', '')
                  }}
                  className="flex items-center"
                  style={{ gap: 6, fontSize: 12, color: 'var(--primary-500)', cursor: 'pointer', padding: '4px 0' }}
                >
                  + Ajouter l&apos;option E
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Matière</label>
              <select
                value={form.module ?? ''}
                onChange={(e) => set('module', e.target.value || null)}
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
              <label style={labelStyle}>Chapitre</label>
              <input
                value={form.subject ?? ''}
                onChange={(e) => set('subject', e.target.value || null)}
                list="qcm-subjects"
                placeholder="Ex. Thermochimie"
                style={inputStyle}
              />
              <datalist id="qcm-subjects">
                {Array.from(
                  new Set([...(COURS_BY_MATIERE[form.module ?? ''] ?? []), ...subjects])
                ).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Année</label>
              <input
                type="number"
                value={form.year ?? ''}
                onChange={(e) => set('year', e.target.value ? Number(e.target.value) : null)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Examen blanc</label>
              <input
                value={form.exam_blanc ?? ''}
                onChange={(e) => set('exam_blanc', e.target.value || null)}
                list="qcm-exam-blancs"
                placeholder="Ex. Examen blanc 1"
                style={inputStyle}
              />
              <datalist id="qcm-exam-blancs">
                {examBlancs.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={labelStyle}>Position (ordre)</label>
              <input
                type="number"
                value={form.position ?? ''}
                onChange={(e) => set('position', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ordre dans l'examen"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Correction / explication</label>
              <button
                type="button"
                onClick={handleGenerateExplanation}
                disabled={generating}
                className="inline-flex items-center font-medium"
                style={{
                  gap: 5,
                  padding: '4px 9px',
                  borderRadius: 8,
                  fontSize: 11,
                  border: '0.5px solid var(--primary-100)',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  cursor: generating ? 'default' : 'pointer',
                }}
              >
                {generating ? <Loader2 size={12} className="mp-spin" /> : <Sparkles size={12} />}
                {generating ? 'Génération…' : "Générer avec l'IA"}
              </button>
            </div>
            <textarea
              value={form.explanation ?? ''}
              onChange={(e) => set('explanation', e.target.value || null)}
              rows={2}
              placeholder="Optionnel — ou génère une explication ancrée dans la base de connaissances."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center" style={{ gap: 20 }}>
            <label className="flex items-center" style={{ gap: 7, fontSize: 13, color: 'var(--gray-900)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.image_required}
                onChange={(e) => set('image_required', e.target.checked)}
              />
              Nécessite une image
            </label>
            <label className="flex items-center" style={{ gap: 7, fontSize: 13, color: 'var(--gray-900)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.has_list}
                onChange={(e) => set('has_list', e.target.checked)}
              />
              Contient une liste
            </label>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '14px 20px', borderTop: '0.5px solid var(--gray-200)' }}
        >
          <div>
            {!isNew && (
              <Button variant="danger" onClick={handleDelete} disabled={busy}>
                <Trash2 size={14} />
                Supprimer
              </Button>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
            {status === 'ready' ? (
              <Button variant="secondary" onClick={() => persist('flagged')} disabled={busy}>
                Repasser en révision
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => persist('flagged')} disabled={busy}>
                {busy && <Loader2 size={14} className="mp-spin" />}
                Enregistrer
              </Button>
            )}
            {status === 'ready' ? (
              <Button onClick={() => persist('ready')} disabled={busy}>
                {busy && <Loader2 size={14} className="mp-spin" />}
                Enregistrer
              </Button>
            ) : (
              <Button onClick={() => persist('ready')} disabled={busy}>
                {busy && <Loader2 size={14} className="mp-spin" />}
                Publier
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
