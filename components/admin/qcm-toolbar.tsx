'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, UploadCloud, Sparkles, Loader2, CheckCheck, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { indexMcqBank } from '@/app/actions/dataset'
import { bulkPublish, bulkDelete } from '@/app/actions/mcqs'
import { Button } from './button'

const MODULE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'Mathématiques', label: 'Mathématiques' },
  { value: 'Chimie', label: 'Chimie' },
  { value: 'Physique', label: 'Physique' },
  { value: 'SVT', label: 'SVT' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Tous les états' },
  { value: 'ready', label: 'Publiés' },
  { value: 'flagged', label: 'En révision' },
]

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

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: string[]
  onChange: (v: string) => void
}) {
  if (options.length === 0) return null
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        height: 32,
        padding: '0 10px',
        border: '0.5px solid var(--gray-200)',
        borderRadius: 9999,
        fontSize: 12,
        color: value ? 'var(--primary-600)' : 'var(--gray-600)',
        background: value ? 'var(--primary-50)' : '#fff',
        cursor: 'pointer',
        outline: 'none',
        maxWidth: 160,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export function QcmToolbar({
  years,
  subjects,
  examBlancs,
  total,
  onNew,
}: {
  years: number[]
  subjects: string[]
  examBlancs: string[]
  total: number
  onNew: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const moduleFilter = searchParams.get('module') ?? ''
  const status = searchParams.get('status') ?? ''
  const year = searchParams.get('year') ?? ''
  const subject = searchParams.get('subject') ?? ''
  const examBlanc = searchParams.get('exam_blanc') ?? ''
  const q = searchParams.get('q') ?? ''

  const [search, setSearch] = useState(q)
  const [indexing, setIndexing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Only delete in bulk when the list is actually narrowed — never wipe the
  // whole bank from one click.
  const filterActive = !!(moduleFilter || status || year || subject || examBlanc || q)

  async function publishAll() {
    if (publishing) return
    const scoped = moduleFilter || year || subject || examBlanc || q
    const msg = scoped
      ? 'Publier les QCM en révision (complets) correspondant au filtre actuel ?'
      : 'Publier TOUS les QCM en révision complets de la base ?'
    if (!confirm(msg)) return
    setPublishing(true)
    const res = await bulkPublish({
      module: moduleFilter || undefined,
      year: year ? Number(year) : undefined,
      subject: subject || undefined,
      exam_blanc: examBlanc || undefined,
      q: q || undefined,
    })
    setPublishing(false)
    if (res.success) {
      toast.success(
        `${res.published} QCM publié${res.published > 1 ? 's' : ''}.` +
          (res.skipped > 0 ? ` ${res.skipped} ignoré${res.skipped > 1 ? 's' : ''} (correction ou matière manquante).` : '')
      )
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function deleteAll() {
    if (deleting) return
    if (!filterActive) {
      toast.error('Appliquez au moins un filtre avant de supprimer en masse.')
      return
    }
    if (total === 0) {
      toast.error('Aucun QCM à supprimer pour ce filtre.')
      return
    }
    if (
      !confirm(
        `Supprimer définitivement les ${total} QCM correspondant au filtre actuel ?\n\n` +
          'Cette action est irréversible et efface aussi les réponses et favoris associés.'
      )
    )
      return
    setDeleting(true)
    const res = await bulkDelete({
      module: moduleFilter || undefined,
      status: status || undefined,
      year: year ? Number(year) : undefined,
      subject: subject || undefined,
      exam_blanc: examBlanc || undefined,
      q: q || undefined,
    })
    setDeleting(false)
    if (res.success) {
      toast.success(`${res.deleted} QCM supprimé${res.deleted > 1 ? 's' : ''}.`)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function reindexAi() {
    if (indexing) return
    setIndexing(true)
    const res = await indexMcqBank({
      module: moduleFilter || undefined,
      year: year ? Number(year) : undefined,
      subject: subject || undefined,
      exam_blanc: examBlanc || undefined,
      q: q || undefined,
    })
    setIndexing(false)
    if (res.success) {
      toast.success(
        res.chunks > 0
          ? `${res.chunks} QCM indexés pour l'IA.`
          : 'Aucun QCM publié à indexer.'
      )
    } else {
      toast.error(res.error)
    }
  }

  // Build a new URL with updated params (resets page to 1 on any filter change).
  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val)
        else params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  // Debounced search → URL
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => setParam({ q: search }), 350)
    return () => clearTimeout(t)
  }, [search, q, setParam])

  return (
    <div className="flex flex-col" style={{ gap: 12, marginBottom: 16 }}>
      {/* Row 1: search + actions */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <div className="relative flex items-center" style={{ flex: '0 0 320px' }}>
          <span className="absolute flex" style={{ left: 11, color: 'var(--gray-400)' }}>
            <Search size={16} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un QCM…"
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

        <div className="flex items-center" style={{ gap: 8, marginLeft: 'auto' }}>
          {filterActive && (
            <Button variant="danger" onClick={deleteAll} disabled={deleting}>
              {deleting ? <Loader2 size={15} className="mp-spin" /> : <Trash2 size={15} />}
              {deleting ? 'Suppression…' : `Supprimer (${total})`}
            </Button>
          )}
          <Button variant="ghost" onClick={publishAll} disabled={publishing}>
            {publishing ? <Loader2 size={15} className="mp-spin" /> : <CheckCheck size={15} />}
            {publishing ? 'Publication…' : 'Publier tout'}
          </Button>
          <Button variant="ghost" onClick={reindexAi} disabled={indexing}>
            {indexing ? <Loader2 size={15} className="mp-spin" /> : <Sparkles size={15} />}
            {indexing ? 'Indexation…' : 'Indexer l’IA'}
          </Button>
          <Link href="/admin/qcms/import">
            <Button variant="ghost">
              <UploadCloud size={15} />
              Importer
            </Button>
          </Link>
          <Button onClick={onNew}>
            <Plus size={15} />
            Nouveau QCM
          </Button>
        </div>
      </div>

      {/* Row 2: filters */}
      <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
        {MODULE_FILTERS.map((m) => (
          <Chip
            key={m.value}
            active={moduleFilter === m.value}
            onClick={() => setParam({ module: m.value })}
          >
            {m.label}
          </Chip>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--gray-200)', margin: '0 4px' }} />

        {STATUS_FILTERS.map((s) => (
          <Chip
            key={s.value}
            active={status === s.value}
            onClick={() => setParam({ status: s.value })}
          >
            {s.label}
          </Chip>
        ))}

        <div className="flex items-center" style={{ gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <FilterSelect
            value={year}
            placeholder="Toutes les années"
            options={years.map(String)}
            onChange={(v) => setParam({ year: v })}
          />
          <FilterSelect
            value={subject}
            placeholder="Tous les chapitres"
            options={subjects}
            onChange={(v) => setParam({ subject: v })}
          />
          <FilterSelect
            value={examBlanc}
            placeholder="Examens blancs"
            options={examBlancs}
            onChange={(v) => setParam({ exam_blanc: v })}
          />
        </div>
      </div>
    </div>
  )
}
