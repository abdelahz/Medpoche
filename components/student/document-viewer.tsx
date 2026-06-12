'use client'

/* eslint-disable @next/next/no-img-element --
   The image is an authenticated, `no-store` proxied stream. next/image would
   fetch it through the optimizer (server-side, without the user's cookie) and
   cache it, breaking both auth and the view-only intent. A raw <img> is correct. */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, Loader2, ChevronLeft, ChevronRight, FileWarning } from 'lucide-react'
import type { LibraryItem } from '@/types'

// pdf.js worker, served locally from /public (no external CDN — privacy/offline).
// Copied from pdfjs-dist by scripts/copy-pdf-worker.mjs on predev/prebuild so it
// always matches the installed version. Loaded as a module worker (type:"module").
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

function isImage(path: string | null): boolean {
  return !!path && /\.(png|jpe?g)$/i.test(path)
}

const MAX_WIDTH = 820

export function DocumentViewer({ item, onClose }: { item: LibraryItem; onClose: () => void }) {
  const src = `/student/bibliotheque/${item.id}/file`
  const image = isImage(item.file_url)

  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)
  const [width, setWidth] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)

  // Render the PDF page at the available stage width (capped), responsive to resize.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setWidth(Math.min(el.clientWidth - 24, MAX_WIDTH))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPage(1)
  }, [])

  const Spinner = (
    <div className="flex items-center justify-center" style={{ padding: 48, color: 'var(--gray-400)' }}>
      <Loader2 size={26} className="mp-spin" />
    </div>
  )

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'rgba(26,29,46,0.72)', zIndex: 60 }}
      onContextMenu={(e) => e.preventDefault()}
    >
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
          <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 12, color: 'var(--gray-600)' }}>
            {[item.type, item.module, item.subject].filter(Boolean).join(' · ')}
          </div>
        </div>
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
      <div
        ref={stageRef}
        className="flex-1 overflow-auto flex justify-center"
        style={{ padding: 12, userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {error ? (
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ gap: 10, margin: 'auto', color: 'var(--gray-100)', maxWidth: 280 }}
          >
            <FileWarning size={28} />
            <div style={{ fontSize: 13 }}>Impossible d&apos;afficher ce document.</div>
          </div>
        ) : image ? (
          <img
            src={src}
            alt={item.title}
            draggable={false}
            onError={() => setError(true)}
            style={{ maxWidth: '100%', height: 'fit-content', objectFit: 'contain', borderRadius: 8 }}
          />
        ) : (
          <Document
            file={src}
            onLoadSuccess={onLoad}
            onLoadError={() => setError(true)}
            loading={Spinner}
            error={Spinner}
          >
            {width > 0 && (
              <Page
                pageNumber={page}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={Spinner}
              />
            )}
          </Document>
        )}
      </div>

      {/* Pager (multi-page PDFs only) */}
      {!image && !error && numPages > 1 && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ gap: 16, padding: '10px 16px', background: '#fff', borderTop: '0.5px solid var(--gray-200)' }}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Page précédente"
            className="flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: 8, color: page <= 1 ? 'var(--gray-300)' : 'var(--gray-700)', cursor: page <= 1 ? 'default' : 'pointer' }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--gray-600)', minWidth: 70, textAlign: 'center' }}>
            {page} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            aria-label="Page suivante"
            className="flex items-center justify-center"
            style={{ width: 34, height: 34, borderRadius: 8, color: page >= numPages ? 'var(--gray-300)' : 'var(--gray-700)', cursor: page >= numPages ? 'default' : 'pointer' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
