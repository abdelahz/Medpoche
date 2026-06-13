'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, FileText, Loader2, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ExtractedMCQ } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { McqPreviewTable } from './mcq-preview-table'
import { Button } from './button'

type Phase = 'idle' | 'uploading' | 'extracting' | 'preview'

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.txt,.md'
const MAX_BYTES = 40 * 1024 * 1024 // 40 Mo

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

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
  const [progress, setProgress] = useState<{ done: number; total: number | null }>({
    done: 0,
    total: null,
  })

  async function extract() {
    if (!questionsFile) return
    if (questionsFile.size > MAX_BYTES || (correctionsFile && correctionsFile.size > MAX_BYTES)) {
      toast.error('Fichier trop volumineux (max 40 Mo).')
      return
    }

    // ── Upload sources directly to Storage (avoids the function body-size limit) ──
    setPhase('uploading')
    const supabase = createClient()

    async function put(file: File): Promise<string | null> {
      const path = `${crypto.randomUUID()}-${sanitize(file.name)}`
      const { error } = await supabase.storage.from('extractions').upload(path, file)
      if (error) {
        toast.error(`Échec du téléversement : ${error.message}`)
        return null
      }
      return path
    }

    const questionsPath = await put(questionsFile)
    if (!questionsPath) return setPhase('idle')
    let correctionsPath: string | null = null
    if (correctionsFile) {
      correctionsPath = await put(correctionsFile)
      if (!correctionsPath) return setPhase('idle')
    }

    // ── Drive the chunked extraction job, polling page-batch by page-batch ──
    setPhase('extracting')
    setProgress({ done: 0, total: null })

    const fail = (msg?: string) => {
      toast.error(msg ?? "Échec de l'extraction.")
      setPhase('idle')
    }

    try {
      const startRes = await fetch('/api/admin/extract/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionsPath, correctionsPath }),
      })
      const startData = await startRes.json()
      if (!startRes.ok) return fail(startData.error)
      const id = startData.id as string

      // Each step processes a few pages (< 60s); loop until the job is done.
      for (let i = 0; i < 500; i++) {
        const stepRes = await fetch('/api/admin/extract/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const step = await stepRes.json()
        if (!stepRes.ok) return fail(step.error)

        setProgress({ done: step.cursor ?? 0, total: step.total_pages ?? null })

        if (step.status === 'error') return fail(step.error)
        if (step.status === 'done') {
          const extracted = (step.result ?? []) as ExtractedMCQ[]
          if (extracted.length === 0) return fail('Aucun QCM détecté dans ce fichier.')
          setMcqs(extracted)
          setPhase('preview')
          return
        }
      }
      fail("L'extraction est trop longue. Essayez un fichier plus court.")
    } catch {
      fail('Erreur réseau lors de l’extraction.')
    }
  }

  function reset() {
    setMcqs([])
    setQuestionsFile(null)
    setCorrectionsFile(null)
    setProgress({ done: 0, total: null })
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

  const uploading = phase === 'uploading'
  const extracting = phase === 'extracting'
  const busy = uploading || extracting

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DropSlot
          label="Questions"
          hint="PDF, PNG, JPG ou TXT — requis (max 40 Mo)"
          file={questionsFile}
          onFile={setQuestionsFile}
          onClear={() => setQuestionsFile(null)}
          disabled={busy}
        />
        <DropSlot
          label="Corrigé (optionnel)"
          hint="Le corrigé permet de remplir réponses et explications"
          file={correctionsFile}
          onFile={setCorrectionsFile}
          onClear={() => setCorrectionsFile(null)}
          disabled={busy}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center" style={{ gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
          {busy && (
            <>
              <FileText size={13} />
              {questionsFile?.name}
              {correctionsFile ? ` + ${correctionsFile.name}` : ''}
            </>
          )}
        </span>
        <Button onClick={extract} disabled={!questionsFile || busy}>
          {busy && <Loader2 size={14} className="mp-spin" />}
          {uploading ? 'Téléversement…' : extracting ? 'Extraction…' : 'Extraire les QCMs'}
        </Button>
      </div>

      {busy && (
        <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
          {uploading
            ? 'Téléversement du document…'
            : progress.total
              ? `L'IA analyse le document — page ${Math.min(progress.done, progress.total)} / ${progress.total}…`
              : "L'IA prépare le document…"}
        </div>
      )}
    </div>
  )
}
