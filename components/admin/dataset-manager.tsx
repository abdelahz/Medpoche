'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Download, Trash2, Loader2, Database, Sparkles, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { DatasetItem, IndexStatus } from '@/types'
import { deleteDatasetItem, getDatasetSignedUrl, setDatasetPriority } from '@/app/actions/dataset'
import { Card } from './primitives'
import { Button } from './button'
import { DatasetUploadModal } from './dataset-upload-modal'

const GRID = '1fr 120px 132px 92px 132px'

const STATUS_STYLE: Record<IndexStatus, { label: string; bg: string; color: string }> = {
  pending: { label: 'Non indexé', bg: 'var(--gray-100)', color: 'var(--gray-600)' },
  indexing: { label: 'Indexation…', bg: 'var(--info-bg)', color: 'var(--info-text)' },
  indexed: { label: 'Indexé', bg: 'var(--success-bg)', color: 'var(--success-text)' },
  failed: { label: 'Échec', bg: 'var(--danger-bg)', color: 'var(--danger-text)' },
}

function StatusChip({ status, count }: { status: IndexStatus; count: number }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{ gap: 5, padding: '3px 9px', borderRadius: 9999, fontSize: 11, background: s.bg, color: s.color }}
    >
      {status === 'indexing' && <Loader2 size={11} className="mp-spin" />}
      {s.label}
      {status === 'indexed' && count > 0 ? ` · ${count}` : ''}
    </span>
  )
}

export function DatasetManager({ items }: { items: DatasetItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [viewingId, setViewingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [indexingId, setIndexingId] = useState<number | null>(null)
  const [priorityId, setPriorityId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => `${it.title} ${it.subject ?? ''}`.toLowerCase().includes(q))
  }, [items, query])

  // While an indexing job runs, poll the server data so the status chip reflects
  // completion even if the request outlives this view (job runs server-side).
  useEffect(() => {
    if (indexingId === null) return
    const t = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(t)
  }, [indexingId, router])

  async function handleView(item: DatasetItem) {
    if (!item.file_url) return
    setViewingId(item.id)
    const res = await getDatasetSignedUrl(item.file_url)
    setViewingId(null)
    if ('url' in res) window.open(res.url, '_blank', 'noopener')
    else toast.error(res.error)
  }

  function handleIndex(item: DatasetItem) {
    if (indexingId !== null) return
    setIndexingId(item.id)
    // Fire the long job at a route handler (raised time budget) and don't block:
    // the row shows « Indexation… » and the poll above reflects the final status.
    fetch('/api/admin/index-dataset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
      .then((r) => r.json())
      .then((res: { success: boolean; chunks?: number; error?: string }) => {
        if (res.success) {
          const n = res.chunks ?? 0
          toast.success(`Indexé : ${n} extrait${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}.`)
        } else {
          toast.error(res.error ?? "Échec de l'indexation.")
        }
      })
      .catch(() => toast.error("L'indexation a échoué ou a expiré."))
      .finally(() => {
        setIndexingId(null)
        router.refresh()
      })
    router.refresh() // surface the « Indexation… » status immediately
  }

  async function handlePriority(item: DatasetItem) {
    if (priorityId !== null) return
    setPriorityId(item.id)
    const res = await setDatasetPriority(item.id, !(item.priority > 0))
    setPriorityId(null)
    if (res.success) {
      toast.success(item.priority > 0 ? 'Retiré des sources prioritaires.' : 'Marqué comme source prioritaire.')
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function handleDelete(item: DatasetItem) {
    if (!confirm(`Supprimer « ${item.title} » du dataset ? Le fichier sera également supprimé.`)) return
    setDeletingId(item.id)
    const res = await deleteDatasetItem(item.id)
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
      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 680 }}>
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
              {['Titre', 'Matière', 'Statut', 'Date', ''].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--gray-600)',
                    textAlign: i === 4 ? 'right' : 'left',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
                {items.length === 0
                  ? "Aucun document. Ajoutez la première source de connaissances de l'IA."
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
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gray-100)', color: 'var(--gray-600)' }}
                    >
                      <Database size={15} />
                    </span>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-900)', minWidth: 0 }}>
                      {item.title}
                    </span>
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    {item.subject ?? '—'}
                  </span>
                  <span>
                    <StatusChip status={item.index_status} count={item.chunk_count} />
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="flex items-center justify-end" style={{ gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handlePriority(item)}
                      disabled={priorityId !== null}
                      title={item.priority > 0 ? 'Source prioritaire — cliquer pour retirer' : 'Marquer comme source prioritaire'}
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: item.priority > 0 ? 'var(--reward-600)' : 'var(--gray-400)', cursor: priorityId !== null ? 'default' : 'pointer' }}
                    >
                      {priorityId === item.id ? (
                        <Loader2 size={15} className="mp-spin" />
                      ) : (
                        <Star size={15} fill={item.priority > 0 ? 'var(--reward-500)' : 'none'} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleIndex(item)}
                      disabled={indexingId !== null}
                      title={item.index_status === 'indexed' ? 'Ré-indexer' : 'Indexer pour l’IA'}
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--primary-600)', cursor: indexingId !== null ? 'default' : 'pointer' }}
                    >
                      {indexingId === item.id ? <Loader2 size={15} className="mp-spin" /> : <Sparkles size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleView(item)}
                      disabled={viewingId === item.id}
                      title="Voir / télécharger"
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--gray-600)', cursor: 'pointer' }}
                    >
                      {viewingId === item.id ? <Loader2 size={15} className="mp-spin" /> : <Download size={15} />}
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
        <DatasetUploadModal
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
