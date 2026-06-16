'use client'

import { useEffect, useState } from 'react'
import { X, Play, FileWarning } from 'lucide-react'
import type { LibraryItem } from '@/types'
import { youtubeEmbedUrl, isYoutubeId } from '@/lib/youtube'
import { ReportButton } from '@/components/shared/report-button'

/** Full-screen playlist player: the selected video + a clickable ordered list. */
export function PlaylistViewer({
  name,
  videos,
  onClose,
}: {
  name: string
  videos: LibraryItem[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  const current = videos[index]
  const id = current?.file_url ?? null

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'rgba(26,29,46,0.72)', zIndex: 60 }}>
      {/* Top bar */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ gap: 12, padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid var(--gray-200)' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}
          >
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
            Vidéo {Math.min(index + 1, videos.length)} / {videos.length}
          </div>
        </div>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36 }}>
          <ReportButton
            context="library"
            contextId={current?.id}
            label={current ? `${name} — ${current.title}` : name}
            tone="var(--gray-500)"
            size={18}
          />
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 36, height: 36, borderRadius: 9999, background: 'var(--gray-100)', color: 'var(--gray-600)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body: player + list (stacked on mobile, side-by-side on laptop) */}
      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>
        {/* Player */}
        <div className="flex items-center justify-center" style={{ flex: 1, padding: 16, minHeight: 0 }}>
          {isYoutubeId(id) ? (
            <div
              style={{
                width: '100%',
                maxWidth: 900,
                aspectRatio: '16 / 9',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#000',
                boxShadow: 'var(--shadow-modal)',
              }}
            >
              <iframe
                key={id}
                src={youtubeEmbedUrl(id)}
                title={current?.title ?? name}
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center text-center"
              style={{ gap: 10, color: 'var(--gray-100)', maxWidth: 280 }}
            >
              <FileWarning size={28} />
              <div style={{ fontSize: 13 }}>Cette vidéo est indisponible.</div>
            </div>
          )}
        </div>

        {/* List */}
        <div
          className="overflow-y-auto flex-shrink-0 max-h-[38vh] lg:max-h-none lg:w-[360px]"
          style={{ background: '#fff', borderTop: '0.5px solid var(--gray-200)' }}
        >
          {videos.map((v, i) => {
            const active = i === index
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setIndex(i)}
                className="flex items-center w-full text-left"
                style={{
                  gap: 12,
                  padding: '11px 16px',
                  borderBottom: '0.5px solid var(--gray-100)',
                  background: active ? 'var(--primary-50)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: active ? 'var(--primary-500)' : 'var(--gray-100)',
                    color: active ? '#fff' : 'var(--gray-600)',
                  }}
                >
                  {active ? <Play size={13} /> : i + 1}
                </span>
                <span
                  className="overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? 'var(--primary-600)' : 'var(--gray-900)', minWidth: 0, flex: 1 }}
                >
                  {v.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
