'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, Loader2, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ExtractedMCQ } from '@/types'
import { McqPreviewTable } from './mcq-preview-table'
import { Button } from './button'

type Phase = 'idle' | 'extracting' | 'preview'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.txt,.md'

/** One drag-and-drop / click slot for a single file. */
function DropSlot({
  label,
  hint,
  file,
  onFile,
  onClear,
  disabled,
}: {
  label: string
  hint: string
  file: File | null
  onFile: (f: File) => void
  onClear: () => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  if (file) {
    return (
      <div
        className="flex items-center"
        style={{
          gap: 10,
          background: '#fff',
          border: '0.5px solid var(--gray-200)',
          borderRadius: 12,
          padding: '16px 18px',
          minHeight: 132,
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)' }}
        >
          <CheckCircle2 size={20} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--gray-600)', marginBottom: 2 }}>{label}</div>
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}
          >
            {file.name}
          </div>
        </div>
        {!disabled && (
          <button type="button" onClick={onClear} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files?.[0]
        if (f && !disabled) onFile(f)
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className="flex flex-col items-center justify-center text-center"
      style={{
        background: '#fff',
        border: `1.5px dashed ${dragging ? 'var(--primary-500)' : 'var(--gray-200)'}`,
        borderRadius: 12,
        padding: '22px 18px',
        minHeight: 132,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'border-color 150ms ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
      <div
        className="flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-500)' }}
      >
        <UploadCloud size={20} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginTop: 10 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 3 }}>{hint}</div>
    </div>
  )
}

export function McqUpload() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [questionsFile, setQuestionsFile] = useState<File | null>(null)
  const [correctionsFile, setCorrectionsFile] = useState<File | null>(null)
  const [mcqs, setMcqs] = useState<ExtractedMCQ[]>([])

  async function extract() {
    if (!questionsFile) return
    setPhase('extracting')

    const form = new FormData()
    form.append('file', questionsFile)
    if (correctionsFile) form.append('corrections', correctionsFile)

    try {
      const res = await fetch('/api/admin/extract', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Échec de l'extraction.")
        setPhase('idle')
        return
      }

      const extracted = (data.mcqs ?? []) as ExtractedMCQ[]
      if (extracted.length === 0) {
        toast.error('Aucun QCM détecté dans ce fichier.')
        setPhase('idle')
        return
      }

      setMcqs(extracted)
      setPhase('preview')
    } catch {
      toast.error('Erreur réseau lors de l’extraction.')
      setPhase('idle')
    }
  }

  function reset() {
    setMcqs([])
    setQuestionsFile(null)
    setCorrectionsFile(null)
    setPhase('idle')
  }

  function afterImport() {
    reset()
    router.push('/admin/qcms')
    router.refresh()
  }

  if (phase === 'preview') {
    return <McqPreviewTable initial={mcqs} onImported={afterImport} onCancel={reset} />
  }

  const extracting = phase === 'extracting'

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DropSlot
          label="Questions"
          hint="PDF, PNG, JPG ou TXT — requis (max 15 Mo)"
          file={questionsFile}
          onFile={setQuestionsFile}
          onClear={() => setQuestionsFile(null)}
          disabled={extracting}
        />
        <DropSlot
          label="Corrigé (optionnel)"
          hint="Le corrigé permet de remplir réponses et explications"
          file={correctionsFile}
          onFile={setCorrectionsFile}
          onClear={() => setCorrectionsFile(null)}
          disabled={extracting}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center" style={{ gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
          {extracting && (
            <>
              <FileText size={13} />
              {questionsFile?.name}
              {correctionsFile ? ` + ${correctionsFile.name}` : ''}
            </>
          )}
        </span>
        <Button onClick={extract} disabled={!questionsFile || extracting}>
          {extracting && <Loader2 size={14} className="mp-spin" />}
          {extracting ? 'Extraction…' : 'Extraire les QCMs'}
        </Button>
      </div>

      {extracting && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          L&apos;IA analyse {correctionsFile ? 'les documents' : 'le document'}, cela peut prendre quelques instants.
        </div>
      )}
    </div>
  )
}
