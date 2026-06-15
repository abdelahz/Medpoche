'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Download, Trash2, Loader2, FileText, Play } from 'lucide-react'
import { toast } from 'sonner'
import type { LibraryItem } from '@/types'
import { LIBRARY_TYPES } from '@/types'
import { isVideoType, youtubeWatchUrl } from '@/lib/youtube'
import { deleteLibraryItem, getLibrarySignedUrl } from '@/app/actions/library'
import { Card } from './primitives'
import { Button } from './button'
import { LibraryUploadModal } from './library-upload-modal'

const GRID = '1fr 100px 130px 150px 96px 96px'

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium"
      style={{
        padding: '6px 13px',
        borderRadius: 9999,
        fontSize: 12,
        cursor: 'pointer',
        border: active ? '0.5px solid var(--primary-100)' : '0.5px solid var(--gray-200)',
        background: active ? 'var(--primary-50)' : '#fff',
        color: active ? 'var(--primary-600)' : 'var(--gray-600)',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}
    >
      {children}
    </button>
  )
}

export function LibraryManager({ items }: { items: LibraryItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false
      if (q && !`${it.title} ${it.module ?? ''} ${it.subject ?? ''}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [items, query, typeFilter])

  async function handleView(item: LibraryItem) {
    if (!item.file_url) return
    if (isVideoType(item.type)) {
      window.open(youtubeWatchUrl(item.file_url), '_blank', 'noopener')
      return
    }
    setViewingId(item.id)
    const res = await getLibrarySignedUrl(item.file_url)
    setViewingId(null)
    if ('url' in res) window.open(res.url, '_blank', 'noopener')
    else toast.error(res.error)
  }

  async function handleDelete(item: LibraryItem) {
    if (!confirm(`Supprimer « ${item.title} » ? Le fichier sera également supprimé.`)) return
    setDeletingId(item.id)
    const res = await deleteLibraryItem(item.id)
    setDeletingId(null)
    if (res.success) {
      toast.success('Document supprimé.')
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Toolbar */}
      <div className="flex flex-col" style={{ gap: 12, marginBottom: 16 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className="relative flex items-center" style={{ flex: '0 0 320px' }}>
            <span className="absolute flex" style={{ left: 11, color: 'var(--gray-400)' }}>
              <Search size={16} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un document…"
              style={{
                width: '100%',
                height: 38,
                boxSizing: 'border-box',
                padding: '9px 12px 9px 34px',
                border: '0.5px solid var(--gray-200)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--gray-900)',
                background: '#fff',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button onClick={() => setShowUpload(true)}>
              <Plus size={15} />
              Ajouter un document
            </Button>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Chip active={typeFilter === ''} onClick={() => setTypeFilter('')}>
            Tous
          </Chip>
          {LIBRARY_TYPES.map((t) => (
            <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 760 }}>
            {/* Header */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: GRID,
                gap: 12,
                padding: '11px 20px',
                borderBottom: '0.5px solid var(--gray-200)',
                background: 'var(--gray-50)',
              }}
            >
              {['Titre', 'Type', 'Matière', 'Chapitre', 'Date', ''].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--gray-600)',
                    textAlign: i === 5 ? 'right' : 'left',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
                {items.length === 0
                  ? 'Aucun document. Ajoutez votre premier cours ou résumé.'
                  : 'Aucun document ne correspond.'}
              </div>
            ) : (
              filtered.map((item, i) => (
                <div
                  key={item.id}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: GRID,
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--gray-100)' : 'none',
                  }}
                >
                  <span className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                    <span
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: isVideoType(item.type) ? 'var(--primary-50)' : 'var(--gray-100)',
                        color: isVideoType(item.type) ? 'var(--primary-600)' : 'var(--gray-600)',
                      }}
                    >
                      {isVideoType(item.type) ? <Play size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-900)', minWidth: 0 }}>
                      {item.title}
                    </span>
                  </span>
                  <span>
                    <span
                      className="inline-flex items-center font-medium"
                      style={{ padding: '3px 9px', borderRadius: 9999, fontSize: 11, background: 'var(--info-bg)', color: 'var(--info-text)' }}
                    >
                      {item.type}
                    </span>
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    {item.module ?? '—'}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    {item.subject ?? '—'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="flex items-center justify-end" style={{ gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleView(item)}
                      disabled={viewingId === item.id}
                      title={isVideoType(item.type) ? 'Regarder sur YouTube' : 'Voir / télécharger'}
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--gray-600)', cursor: 'pointer' }}
                    >
                      {viewingId === item.id ? (
                        <Loader2 size={15} className="mp-spin" />
                      ) : isVideoType(item.type) ? (
                        <Play size={15} />
                      ) : (
                        <Download size={15} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      title="Supprimer"
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--danger-text)', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? <Loader2 size={15} className="mp-spin" /> : <Trash2 size={15} />}
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {showUpload && (
        <LibraryUploadModal
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
