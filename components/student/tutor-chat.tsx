'use client'

/* eslint-disable @next/next/no-img-element --
   User-attached photo data URLs (not optimizable by next/image). */

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, ThumbsUp, ThumbsDown, Sparkles, BookText, ImagePlus, X, Crown } from 'lucide-react'
import { ReportButton } from '@/components/shared/report-button'
import { toast } from 'sonner'
import { MCQRenderer } from '@/components/shared/mcq-renderer'
import { saveChatTurn, setChatFeedback } from '@/app/actions/chat'
import type { QuotaSnapshot } from '@/lib/usage'
import { whatsappUpgradeUrl } from '@/lib/upgrade'
import { UpgradeButton } from './upgrade-button'
import { ScreenHeader } from './primitives'

interface Source {
  title: string
  page: number | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string // data URL, for display in the user bubble
  chatId?: number
  feedback?: 1 | -1 | null
  sources?: Source[]
  streaming?: boolean
  limitReached?: boolean // daily quota hit — show the upgrade CTA, never saved
}

interface Attachment {
  dataUrl: string
  blob: Blob
}

const SUGGESTIONS = [
  'Donne-moi des astuces pour les suites numériques',
  'Comment bien gérer mon temps pendant le concours ?',
  "Explique la méthode d'élimination des cas dans un QCM",
]

function decodeB64<T>(header: string | null, fallback: T): T {
  if (!header) return fallback
  try {
    const bytes = Uint8Array.from(atob(header), (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return fallback
  }
}

/** Downscale + JPEG-compress a chosen image so uploads stay small. */
function compressImage(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1024
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width >= height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas'))
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('blob'))
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.8), blob })
        },
        'image/jpeg',
        0.8
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

export function TutorChat({
  initial,
  quota,
}: {
  initial: ChatMessage[]
  quota: QuotaSnapshot | null
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial)
  const [input, setInput] = useState('')
  const [attached, setAttached] = useState<Attachment | null>(null)
  const [busy, setBusy] = useState(false)
  const [messagesLeft, setMessagesLeft] = useState<number | null>(quota?.messagesLeft ?? null)
  const [photosLeft, setPhotosLeft] = useState<number | null>(quota?.photosLeft ?? null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choisis une image.')
      return
    }
    try {
      setAttached(await compressImage(file))
    } catch {
      toast.error("Impossible de charger l'image.")
    }
  }

  /** Append the attempted question + a friendly "limit reached" answer (never saved). */
  function pushLimit(q: string, image: string | undefined, message: string) {
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: q, image },
      { role: 'assistant', content: message, limitReached: true },
    ])
  }

  async function ask(text: string) {
    const q = text.trim()
    const img = attached
    if ((!q && !img) || busy) return

    const isPhoto = !!img
    // Proactive client-side gate (the server still enforces authoritatively).
    if (isPhoto && photosLeft === 0) {
      pushLimit(
        q,
        img?.dataUrl,
        "Tu as utilisé toutes tes questions par photo pour aujourd'hui 📸 Reviens demain, ou passe à un plan supérieur pour continuer sans limite."
      )
      setInput('')
      setAttached(null)
      return
    }
    if (messagesLeft === 0) {
      pushLimit(
        q,
        img?.dataUrl,
        "Tu as utilisé toutes tes questions IA pour aujourd'hui 🌙 Reviens demain, ou passe à un plan supérieur pour continuer sans limite."
      )
      setInput('')
      setAttached(null)
      return
    }

    setInput('')
    setAttached(null)
    setBusy(true)

    const history = messages
      .filter((m) => m.content.trim())
      .slice(-6)
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }))

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: q, image: img?.dataUrl },
      { role: 'assistant', content: '', streaming: true },
    ])

    try {
      let res: Response
      if (img) {
        const fd = new FormData()
        fd.append('question', q)
        fd.append('history', JSON.stringify(history))
        fd.append('image', img.blob, 'question.jpg')
        res = await fetch('/api/chat', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, history }),
        })
      }

      // Daily quota hit — show the friendly limit card with an upgrade CTA.
      if (res.status === 429) {
        const message = await res.text()
        if (res.headers.get('X-Quota-Exceeded') === 'photos') setPhotosLeft(0)
        else setMessagesLeft(0)
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: message, limitReached: true }
          return next
        })
        return
      }
      if (!res.ok || !res.body) throw new Error('no stream')

      const sources = decodeB64<Source[]>(res.headers.get('X-Sources'), [])
      const savedQuestion = decodeB64<string>(res.headers.get('X-Question'), q || 'Question (photo)')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: acc, streaming: true }
          return next
        })
      }

      const saved = await saveChatTurn(savedQuestion, acc)
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: acc,
          sources,
          feedback: null,
          chatId: 'id' in saved ? saved.id : undefined,
        }
        return next
      })

      // This request consumed one (and a photo slot, if applicable).
      setMessagesLeft((n) => (n === null ? null : Math.max(0, n - 1)))
      if (isPhoto) setPhotosLeft((n) => (n === null ? null : Math.max(0, n - 1)))
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Réessaie dans un instant.',
        }
        return next
      })
    } finally {
      setBusy(false)
      taRef.current?.focus()
    }
  }

  async function rate(index: number, value: 1 | -1) {
    const msg = messages[index]
    if (!msg.chatId) return
    const next = msg.feedback === value ? null : value
    setMessages((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], feedback: next }
      return copy
    })
    await setChatFeedback(msg.chatId, next)
  }

  const empty = messages.length === 0
  const canSend = !busy && (input.trim().length > 0 || attached !== null)

  return (
    <div>
      <div className="lg:mx-auto lg:max-w-[760px]">
        <ScreenHeader title="Assistant IA" />

        <div style={{ padding: '0 20px 112px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {empty ? (
          <div className="flex flex-col" style={{ gap: 16, marginTop: 8 }}>
            <div className="flex flex-col items-center text-center" style={{ gap: 10, padding: '24px 16px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--primary-50)', color: 'var(--primary-500)' }}
              >
                <Sparkles size={26} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>Pose ta question</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 280 }}>
                Écris ta question ou prends-la en photo 📸 — ton tuteur t&apos;explique, te donne des
                astuces et corrige, appuyé sur le programme du concours.
              </div>
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="text-left"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '0.5px solid var(--gray-200)',
                    background: '#fff',
                    fontSize: 13,
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 13px',
                    borderRadius: 14,
                    borderTopRightRadius: 4,
                    background: 'var(--primary-500)',
                    color: '#fff',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                  }}
                >
                  {m.image && (
                    <img
                      src={m.image}
                      alt="Question en photo"
                      style={{ maxWidth: '100%', borderRadius: 10, display: 'block', marginBottom: m.content ? 8 : 0 }}
                    />
                  )}
                  {m.content && <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>}
                </div>
              </div>
            ) : m.limitReached ? (
              <div
                key={i}
                className="flex flex-col"
                style={{
                  gap: 12,
                  padding: '16px',
                  borderRadius: 16,
                  background: 'var(--reward-50, #FFF7E6)',
                  border: '0.5px solid var(--reward-500, #FFB020)',
                }}
              >
                <div className="flex items-start" style={{ gap: 10 }}>
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--reward-500, #FFB020)', color: '#fff' }}
                  >
                    <Crown size={17} />
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--gray-900)', lineHeight: 1.5 }}>{m.content}</div>
                </div>
                <UpgradeButton variant="whatsapp" targetPlan="Premium" label="Améliorer mon abonnement" fullWidth />
              </div>
            ) : (
              <div key={i} className="flex flex-col" style={{ gap: 8, maxWidth: '100%' }}>
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    borderTopLeftRadius: 4,
                    background: 'var(--gray-50)',
                    border: '0.5px solid var(--gray-200)',
                    fontSize: 13.5,
                    color: 'var(--gray-900)',
                    lineHeight: 1.55,
                  }}
                >
                  {m.streaming && !m.content ? (
                    <span className="flex items-center" style={{ gap: 8, color: 'var(--gray-400)' }}>
                      <Loader2 size={14} className="mp-spin" /> Réflexion…
                    </span>
                  ) : m.streaming ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  ) : (
                    <MCQRenderer text={m.content} />
                  )}
                </div>

                {!m.streaming && m.sources && m.sources.length > 0 && (
                  <div className="flex items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <BookText size={13} color="var(--gray-400)" />
                    {m.sources.map((s, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center"
                        style={{ padding: '3px 8px', borderRadius: 9999, fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                      >
                        {s.title}
                        {s.page ? ` · p.${s.page}` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {!m.streaming && m.chatId && (
                  <div className="flex items-center" style={{ gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => rate(i, 1)}
                      aria-label="Utile"
                      className="flex items-center justify-center"
                      style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: m.feedback === 1 ? 'var(--success-text)' : 'var(--gray-400)' }}
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => rate(i, -1)}
                      aria-label="Pas utile"
                      className="flex items-center justify-center"
                      style={{ width: 28, height: 28, borderRadius: 8, cursor: 'pointer', color: m.feedback === -1 ? 'var(--danger-text)' : 'var(--gray-400)' }}
                    >
                      <ThumbsDown size={14} />
                    </button>
                    <span className="flex items-center justify-center" style={{ width: 28, height: 28 }}>
                      <ReportButton context="ai" contextId={m.chatId} label={m.content.slice(0, 160)} size={14} />
                    </span>
                  </div>
                )}
              </div>
            )
          )
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — above the bottom nav on mobile; sidebar-aligned on laptop. */}
      <div
        className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-[480px]
                   lg:bottom-0 lg:left-60 lg:right-0 lg:w-auto lg:max-w-none lg:translate-x-0"
        style={{ background: '#fff', borderTop: '0.5px solid var(--gray-200)', zIndex: 20 }}
      >
        <div className="lg:mx-auto lg:max-w-[760px]" style={{ padding: '10px 14px' }}>
        {messagesLeft !== null && (
          <div
            className="flex items-center justify-center"
            style={{ gap: 6, marginBottom: 8, fontSize: 11.5, color: 'var(--gray-500)' }}
          >
            {messagesLeft > 0 ? (
              <span>
                {messagesLeft} question{messagesLeft > 1 ? 's' : ''} IA restante
                {messagesLeft > 1 ? 's' : ''} aujourd&apos;hui
              </span>
            ) : (
              <span className="flex items-center" style={{ gap: 4 }}>
                Limite du jour atteinte ·{' '}
                <a
                  href={whatsappUpgradeUrl('Premium')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary-500)', fontWeight: 600 }}
                >
                  Améliorer
                </a>
              </span>
            )}
          </div>
        )}
        {attached && (
          <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
            <div style={{ position: 'relative' }}>
              <img
                src={attached.dataUrl}
                alt="Aperçu"
                style={{ height: 46, width: 46, objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--gray-200)', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => setAttached(null)}
                aria-label="Retirer la photo"
                className="flex items-center justify-center"
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9999, background: 'var(--gray-900)', color: '#fff', cursor: 'pointer' }}
              >
                <X size={11} />
              </button>
            </div>
            <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Photo jointe</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
          className="flex items-end"
          style={{ gap: 8 }}
        >
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPickFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Joindre une photo"
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 40, height: 40, borderRadius: 14, border: '0.5px solid var(--gray-200)', background: '#fff', color: 'var(--gray-600)', cursor: busy ? 'default' : 'pointer' }}
          >
            <ImagePlus size={18} />
          </button>

          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(input)
              }
            }}
            rows={1}
            placeholder="Pose ta question…"
            style={{
              flex: 1,
              resize: 'none',
              maxHeight: 120,
              boxSizing: 'border-box',
              padding: '10px 12px',
              border: '0.5px solid var(--gray-200)',
              borderRadius: 14,
              fontSize: 13.5,
              lineHeight: 1.4,
              color: 'var(--gray-900)',
              background: '#fff',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Envoyer"
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: canSend ? 'var(--primary-500)' : 'var(--gray-200)',
              color: '#fff',
              cursor: canSend ? 'pointer' : 'default',
              transition: 'background 150ms ease',
            }}
          >
            {busy ? <Loader2 size={17} className="mp-spin" /> : <Send size={17} />}
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}
