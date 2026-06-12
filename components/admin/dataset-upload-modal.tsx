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

export function DatasetUploadModal({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    if (!/\.(pdf|png|jpe?g|txt|md)$/i.test(f.name)) {
      toast.error('Format non supporté. Utilisez PDF, image, TXT ou MD.')
      return
    }
    setFile(f)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Le titre est requis.')
      return
    }
    if (!file) {
      toast.error('Veuillez sélectionner un fichier.')
      return
    }
    setBusy(true)

    const supabase = createClient()
    const path = `${crypto.randomUUID()}-${sanitize(file.name)}`

    const { error: upErr } = await supabase.storage.from('dataset').upload(path, file)
    if (upErr) {
      setBusy(false)
      toast.error(`Échec du téléversement : ${upErr.message}`)
      return
    }

    const res = await createDatasetItem({ title, subject: subjects.join(', ') || null, path })
    setBusy(false)

    if (res.success) {
      toast.success('Document ajouté au dataset.')
      onDone()
    } else {
      await supabase.storage.from('dataset').remove([path]).catch(() => {})
      toast.error(res.error)
    }
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
          <div>
            <label style={labelStyle}>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Ex. Référentiel — Biochimie" />
          </div>

          <div>
            <label style={labelStyle}>Matière(s)</label>
            <ModuleMultiSelect value={subjects} onChange={setSubjects} />
          </div>

          <div>
            <label style={labelStyle}>Fichier</label>
            {file ? (
              <div
                className="flex items-center"
                style={{ gap: 10, border: '0.5px solid var(--gray-200)', borderRadius: 12, padding: '14px 16px' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)' }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</div>
                </div>
                {!busy && (
                  <button onClick={() => setFile(null)} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) pickFile(f)
                }}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center"
                style={{
                  border: `1.5px dashed ${dragging ? 'var(--primary-500)' : 'var(--gray-200)'}`,
                  borderRadius: 12,
                  padding: '26px 18px',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) pickFile(f)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
                  <UploadCloud size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginTop: 10 }}>
                  Glissez un fichier ou cliquez
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 3 }}>PDF, image, TXT ou MD — max 50 Mo</div>
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
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 size={14} className="mp-spin" /> : <FileText size={14} />}
            {busy ? 'Ajout…' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  )
}
