'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Search, FileText, Eye, Play, ListVideo } from 'lucide-react'
import type { LibraryItem } from '@/types'
import { LIBRARY_TYPES } from '@/types'
import { isVideoType } from '@/lib/youtube'
import { ScreenHeader, MODULE_THEME } from './primitives'
import { VideoViewer } from './video-viewer'
import { PlaylistViewer } from './playlist-viewer'

// react-pdf is heavy and browser-only — load it only when a document is opened.
const DocumentViewer = dynamic(
  () => import('./document-viewer').then((m) => m.DocumentViewer),
  { ssr: false }
)

const ALL = ''

function distinct(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim() !== '')))
}

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
      className="font-medium flex-shrink-0"
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

const selectStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 38,
  padding: '0 12px',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 8,
  fontSize: 13,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
  cursor: 'pointer',
}

export function LibraryBrowser({ items }: { items: LibraryItem[] }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(ALL)
  const [moduleFilter, setModuleFilter] = useState(ALL)
  const [coursFilter, setCoursFilter] = useState(ALL)
  const [viewing, setViewing] = useState<LibraryItem | null>(null)
  const [viewingVideo, setViewingVideo] = useState<LibraryItem | null>(null)
  const [openPlaylist, setOpenPlaylist] = useState<{ name: string; videos: LibraryItem[] } | null>(null)

  // Only surface filter values that actually exist in the library.
  const presentTypes = useMemo(
    () => LIBRARY_TYPES.filter((t) => items.some((it) => it.type === t)),
    [items]
  )
  const presentModules = useMemo(() => distinct(items.map((it) => it.module)), [items])
  const coursOptions = useMemo(
    () =>
      distinct(
        items.filter((it) => !moduleFilter || it.module === moduleFilter).map((it) => it.subject)
      ).sort((a, b) => a.localeCompare(b, 'fr')),
    [items, moduleFilter]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false
      if (moduleFilter && it.module !== moduleFilter) return false
      if (coursFilter && it.subject !== coursFilter) return false
      if (
        q &&
        !`${it.title} ${it.module ?? ''} ${it.subject ?? ''} ${it.playlist ?? ''}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [items, query, typeFilter, moduleFilter, coursFilter])

  // Split results into video playlists (grouped + ordered) and everything else.
  const { playlists, looseItems } = useMemo(() => {
    const groups = new Map<string, LibraryItem[]>()
    const loose: LibraryItem[] = []
    for (const it of filtered) {
      const pl = isVideoType(it.type) && it.playlist?.trim() ? it.playlist.trim() : null
      if (pl) {
        const g = groups.get(pl)
        if (g) g.push(it)
        else groups.set(pl, [it])
      } else {
        loose.push(it)
      }
    }
    const playlists = Array.from(groups.entries())
      .map(([name, vids]) => ({
        name,
        videos: vids
          .slice()
          .sort(
            (a, b) =>
              (a.position ?? Infinity) - (b.position ?? Infinity) ||
              a.title.localeCompare(b.title, 'fr')
          ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return { playlists, looseItems: loose }
  }, [filtered])

  function changeModule(value: string) {
    setModuleFilter(value)
    // Drop a cours filter that no longer belongs to the chosen matière.
    if (coursFilter && value && !items.some((it) => it.module === value && it.subject === coursFilter)) {
      setCoursFilter(ALL)
    }
  }

  function openItem(item: LibraryItem) {
    if (!item.file_url) return
    if (isVideoType(item.type)) setViewingVideo(item)
    else setViewing(item)
  }

  return (
    <div>
      <ScreenHeader title="Bibliothèque" />

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search */}
        <div className="relative flex items-center">
          <span className="absolute flex" style={{ left: 11, color: 'var(--gray-400)' }}>
            <Search size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un document…"
            style={{
              width: '100%',
              height: 40,
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

        {/* Type chips */}
        {presentTypes.length > 0 && (
          <div className="flex items-center" style={{ gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            <Chip active={typeFilter === ALL} onClick={() => setTypeFilter(ALL)}>
              Tous
            </Chip>
            {presentTypes.map((t) => (
              <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                {t}
              </Chip>
            ))}
          </div>
        )}

        {/* Matière + cours selects */}
        {(presentModules.length > 0 || coursOptions.length > 0) && (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select
              value={moduleFilter}
              onChange={(e) => changeModule(e.target.value)}
              style={selectStyle}
              aria-label="Filtrer par matière"
            >
              <option value={ALL}>Toutes les matières</option>
              {presentModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={coursFilter}
              onChange={(e) => setCoursFilter(e.target.value)}
              style={selectStyle}
              disabled={coursOptions.length === 0}
              aria-label="Filtrer par chapitre"
            >
              <option value={ALL}>Tous les chapitres</option>
              {coursOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Documents */}
      <div
        className="flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-3"
        style={{ padding: '14px 20px 28px' }}
      >
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center lg:col-span-2"
            style={{ border: '0.5px solid var(--gray-200)', borderRadius: 16, padding: '48px 20px', gap: 10 }}
          >
            <div
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gray-100)', color: 'var(--gray-400)' }}
            >
              <FileText size={22} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 260 }}>
              {items.length === 0
                ? 'La bibliothèque est vide pour le moment.'
                : 'Aucun document ne correspond à ta recherche.'}
            </div>
          </div>
        ) : (
          <>
            {playlists.map((g) => {
              const mod = g.videos.find((v) => v.module)?.module ?? null
              const theme = mod ? MODULE_THEME[mod] : null
              const accent = theme ? theme.color : 'var(--accent-500, #7C5CFF)'
              const tint = theme ? theme.bg : 'var(--accent-50, #F1ECFF)'
              const plMeta = `${g.videos.length} vidéo${g.videos.length > 1 ? 's' : ''}${mod ? ` · ${mod}` : ''}`
              return (
                <button
                  key={`pl-${g.name}`}
                  type="button"
                  onClick={() => setOpenPlaylist(g)}
                  className="flex items-center w-full text-left"
                  style={{ gap: 13, padding: '14px 15px', borderRadius: 18, background: tint, cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 46, height: 46, borderRadius: 13, background: accent, color: '#fff' }}
                  >
                    <ListVideo size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--gray-900)' }}>
                      {g.name}
                    </div>
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
                      Playlist · {plMeta}
                    </div>
                  </div>
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 34, height: 34, borderRadius: 9999, background: '#fff', color: accent }}
                    title="Ouvrir la playlist"
                  >
                    <Play size={17} />
                  </span>
                </button>
              )
            })}
            {looseItems.map((item) => {
              const isVid = isVideoType(item.type)
              const theme = item.module ? MODULE_THEME[item.module] : null
              const accent = theme ? theme.color : isVid ? 'var(--accent-500, #7C5CFF)' : 'var(--gray-500)'
              const tint = theme ? theme.bg : isVid ? 'var(--accent-50, #F1ECFF)' : 'var(--gray-50)'
              const ChipIcon = isVid ? Play : theme ? theme.icon : FileText
              const meta = [item.type, item.subject].filter(Boolean).join(' · ')
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex items-center w-full text-left"
                  style={{ gap: 13, padding: '14px 15px', borderRadius: 18, background: tint, cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 46, height: 46, borderRadius: 13, background: accent, color: '#fff' }}
                  >
                    <ChipIcon size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--gray-900)' }}
                    >
                      {item.title}
                    </div>
                    <div
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}
                    >
                      {meta}
                    </div>
                  </div>
                  <span
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 34, height: 34, borderRadius: 9999, background: '#fff', color: accent }}
                    title={isVid ? 'Regarder' : 'Consulter'}
                  >
                    {isVid ? <Play size={17} /> : <Eye size={17} />}
                  </span>
                </button>
              )
            })}
          </>
        )}
      </div>

      {viewing && <DocumentViewer item={viewing} onClose={() => setViewing(null)} />}
      {viewingVideo && <VideoViewer item={viewingVideo} onClose={() => setViewingVideo(null)} />}
      {openPlaylist && (
        <PlaylistViewer
          name={openPlaylist.name}
          videos={openPlaylist.videos}
          onClose={() => setOpenPlaylist(null)}
        />
      )}
    </div>
  )
}
