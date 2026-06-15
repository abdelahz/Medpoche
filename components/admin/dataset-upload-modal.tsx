'use client'

import { useState, useRef } from 'react'
import { X, UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createDatasetItem } from '@/app/actions/dataset'
import { Button } from './button'
import { ModuleMultiSelect } from './module-multiselect'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.txt,.md'

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

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function titleFromName(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

export function DatasetUploadModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const valid = incoming.filter((f) => /\.(pdf|png|jpe?g|txt|md)$/i.test(f.name))
    const rejected = incoming.length - valid.length
    if (rejected > 0) {
      toast.error(`${rejected} fichier(s) ignoré(s) : format non supporté (PDF, image, TXT ou MD).`)
    }
    if (valid.length === 0) return
    setFiles((prev) => {
      const seen = new Set(prev.map((p) => `${p.name}:${p.size}`))
      const merged = [...prev]
      for (const f of valid) {
        const key = `${f.name}:${f.size}`
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(f)
        }
      }
      return merged
    })
  }

  function removeAt(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (files.length === 0) {
      toast.error('Veuillez sélectionner au moins un fichier.')
      return
    }
    setBusy(true)
    setProgress({ done: 0, total: files.length })

    const supabase = createClient()
    const subject = subjects.join(', ') || null
    let ok = 0
    const failed: string[] = []

    for (const file of files) {
      const titleForFile =
        files.length === 1 && title.trim() ? title.trim() : titleFromName(file.name)
      const path = `${crypto.randomUUID()}-${sanitize(file.name)}`

      const { error: upErr } = await supabase.storage.from('dataset').upload(path, file)
      if (upErr) {
        failed.push(file.name)
        setProgress((p) => ({ ...p, done: p.done + 1 }))
        continue
      }

      const res = await createDatasetItem({ title: titleForFile, subject, path })
      if (res.success) {
        ok++
      } else {
        failed.push(file.name)
        await supabase.storage.from('dataset').remove([path]).catch(() => {})
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }))
    }

    setBusy(false)
    if (ok > 0) toast.success(`${ok} document${ok > 1 ? 's' : ''} ajouté${ok > 1 ? 's' : ''} au dataset.`)
    if (failed.length > 0) toast.error(`Échec : ${failed.join(', ')}`)
    if (ok > 0) onDone()
  }

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
          width: 520,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            Ajouter au dataset IA
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {files.length <= 1 ? (
            <div>
              <label style={labelStyle}>Titre {files.length === 1 ? '' : '(optionnel)'}</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                placeholder="Ex. Référentiel — Biochimie"
              />
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
              Chaque document prendra le nom de son fichier comme titre.
            </div>
          )}

          <div>
            <label style={labelStyle}>Matière(s)</label>
            <ModuleMultiSelect value={subjects} onChange={setSubjects} />
          </div>

          <div>
            <label style={labelStyle}>
              Fichiers{files.length > 0 ? ` (${files.length})` : ''}
            </label>

            {files.length > 0 && (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, maxHeight: 220, overflowY: 'auto' }}
              >
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center"
                    style={{ gap: 10, border: '0.5px solid var(--gray-200)', borderRadius: 12, padding: '10px 14px' }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)' }}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                        {f.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{(f.size / 1024 / 1024).toFixed(1)} Mo</div>
                    </div>
                    {!busy && (
                      <button onClick={() => removeAt(i)} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!busy && (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
                }}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center"
                style={{
                  border: `1.5px dashed ${dragging ? 'var(--primary-500)' : 'var(--gray-200)'}`,
                  borderRadius: 12,
                  padding: '22px 18px',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
                  <UploadCloud size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginTop: 10 }}>
                  {files.length > 0 ? 'Ajouter d’autres fichiers' : 'Glissez des fichiers ou cliquez'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 3 }}>
                  PDF, image, TXT ou MD — max 50 Mo · sélection multiple
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-end flex-shrink-0"
          style={{ gap: 10, padding: '14px 20px', borderTop: '0.5px solid var(--gray-200)' }}
        >
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={busy || files.length === 0}>
            {busy ? <Loader2 size={14} className="mp-spin" /> : <FileText size={14} />}
            {busy
              ? `Ajout… ${progress.done}/${progress.total}`
              : `Ajouter${files.length > 1 ? ` (${files.length})` : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
