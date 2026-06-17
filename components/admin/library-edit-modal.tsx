'use client'

import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { updateLibraryItem } from '@/app/actions/library'
import { LIBRARY_TYPES, MODULES, COURS_BY_MATIERE } from '@/types'
import type { LibraryItem } from '@/types'
import { isVideoType } from '@/lib/youtube'
import { Button } from './button'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--gray-600)',
  marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
}

/** Edit a library item's metadata (title, matière, cours, and — for videos —
 *  playlist + order). The file/video itself isn't changed. */
export function LibraryEditModal({
  item,
  existingPlaylists = [],
  onClose,
  onDone,
}: {
  item: LibraryItem
  existingPlaylists?: string[]
  onClose: () => void
  onDone: () => void
}) {
  const isVid = isVideoType(item.type)
  const fileTypes = LIBRARY_TYPES.filter((t) => !isVideoType(t))

  const [title, setTitle] = useState(item.title)
  const [type, setType] = useState(item.type)
  const [module, setModule] = useState(item.module ?? '')
  const [subject, setSubject] = useState(item.subject ?? '')
  const [playlist, setPlaylist] = useState(item.playlist ?? '')
  const [position, setPosition] = useState(item.position != null ? String(item.position) : '')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!title.trim()) {
      toast.error('Le titre est requis.')
      return
    }
    setBusy(true)
    const res = await updateLibraryItem({
      id: item.id,
      title,
      type,
      module: module || null,
      subject: subject.trim() || null,
      playlist: playlist.trim() || null,
      position: position.trim() ? Number(position) : null,
    })
    setBusy(false)
    if (res.success) {
      toast.success('Document mis à jour.')
      onDone()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(26,29,46,0.35)', zIndex: 50, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col"
        style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-modal)', width: 520, maxWidth: '100%', maxHeight: '90vh' }}
      >
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            Modifier {isVid ? 'la vidéo' : 'le document'}
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            {isVid ? (
              <div style={{ ...inputStyle, color: 'var(--gray-600)', background: 'var(--gray-50)' }}>Vidéo (YouTube)</div>
            ) : (
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {fileTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Matière</label>
              <select value={module} onChange={(e) => setModule(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Non définie</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chapitre</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} list="library-edit-cours" style={inputStyle} />
              <datalist id="library-edit-cours">
                {(COURS_BY_MATIERE[module] ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {isVid && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 96px', gap: 12 }}>
              <div>
                <label style={labelStyle}>Playlist (optionnel)</label>
                <input
                  value={playlist}
                  onChange={(e) => setPlaylist(e.target.value)}
                  list="library-edit-playlists"
                  placeholder="Ex. Mécanique — Chapitre 1"
                  style={inputStyle}
                />
                <datalist id="library-edit-playlists">
                  {existingPlaylists.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>Ordre</label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  placeholder="1"
                  style={inputStyle}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-end flex-shrink-0"
          style={{ gap: 10, padding: '14px 20px', borderTop: '0.5px solid var(--gray-200)' }}
        >
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 size={14} className="mp-spin" /> : <Check size={14} />}
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
