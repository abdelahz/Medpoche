'use client'

import { useEffect } from 'react'
import { X, FileWarning } from 'lucide-react'
import type { LibraryItem } from '@/types'
import { youtubeEmbedUrl, isYoutubeId } from '@/lib/youtube'
import { ReportButton } from '@/components/shared/report-button'

/** Full-screen modal that embeds a library "Vidéo" item (YouTube). */
export function VideoViewer({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  const id = item.file_url

  // Close on Escape (mirrors the document viewer).
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
            {item.title}
          </div>
          <div
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ fontSize: 12, color: 'var(--gray-600)' }}
          >
            {[item.type, item.module, item.subject].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36 }}>
          <ReportButton context="library" contextId={item.id} label={item.title} tone="var(--gray-500)" size={18} />
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

      {/* Stage */}
      <div className="flex-1 overflow-auto flex items-center justify-center" style={{ padding: 16 }}>
        {isYoutubeId(id) ? (
          <div
            style={{
              width: '100%',
              maxWidth: 960,
              aspectRatio: '16 / 9',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#000',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <iframe
              src={youtubeEmbedUrl(id)}
              title={item.title}
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
    </div>
  )
}
