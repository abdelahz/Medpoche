'use client'

import { useEffect, useState } from 'react'
import { Flag, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createReport } from '@/app/actions/reports'
import type { ReportContext } from '@/types'

/**
 * "Signaler une erreur" button + dialog. Reusable across content surfaces
 * (QCM, IA, bibliothèque). Reports go only to admins — never shown to students.
 */
export function ReportButton({
  context,
  contextId,
  label,
  variant = 'icon',
  tone = 'var(--gray-400)',
  size = 16,
}: {
  context: ReportContext
  contextId?: string | number | null
  label?: string | null
  variant?: 'icon' | 'text'
  tone?: string
  size?: number
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function submit() {
    if (busy) return
    setBusy(true)
    const res = await createReport({
      context,
      contextId: contextId != null ? String(contextId) : null,
      label: label ?? null,
      message,
    })
    setBusy(false)
    if (res.success) {
      toast.success('Merci, ton signalement a été envoyé.')
      setMessage('')
      setOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen(true)
        }}
        title="Signaler une erreur"
        aria-label="Signaler une erreur"
        className="inline-flex items-center"
        style={
          variant === 'text'
            ? { gap: 6, fontSize: 12, fontWeight: 600, color: tone, cursor: 'pointer' }
            : { color: tone, cursor: 'pointer' }
        }
      >
        <Flag size={variant === 'text' ? 14 : size} />
        {variant === 'text' && 'Signaler'}
      </button>

      {open && (
        <div
          onClick={(e) => {
            e.stopPropagation()
            setOpen(false)
          }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(26,29,46,0.45)', zIndex: 70, padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col"
            style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-modal)', width: 420, maxWidth: '100%' }}
          >
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--gray-200)' }}
            >
              <div className="flex items-center" style={{ gap: 8 }}>
                <Flag size={16} style={{ color: 'var(--danger-text)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
                  Signaler une erreur
                </h2>
              </div>
              <button onClick={() => setOpen(false)} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: 0 }}>
                Qu&apos;est-ce qui ne va pas ? (réponse fausse, faute, image manquante…)
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                autoFocus
                placeholder="Décris le problème (optionnel)…"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '0.5px solid var(--gray-200)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 13,
                  color: 'var(--gray-900)',
                  background: '#fff',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div
              className="flex items-center justify-end flex-shrink-0"
              style={{ gap: 10, padding: '12px 18px', borderTop: '0.5px solid var(--gray-200)' }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', cursor: 'pointer', padding: '8px 12px' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center justify-center font-bold text-white"
                style={{ gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: 'var(--grad-primary)', fontSize: 13 }}
              >
                {busy && <Loader2 size={14} className="mp-spin" />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
