'use client'

import { useState, useRef } from 'react'
import { X, UploadCloud, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createLibraryItem } from '@/app/actions/library'
import { LIBRARY_TYPES, MODULES, COURS_BY_MATIERE } from '@/types'
import { isVideoType, extractYoutubeId } from '@/lib/youtube'
import { Button } from './button'

const ACCEPT = '.pdf,.png,.jpg,.jpeg'

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

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function LibraryUploadModal({
  onClose,
  onDone,
  existingPlaylists = [],
}: {
  onClose: () => void
  onDone: () => void
  existingPlaylists?: string[]
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>(LIBRARY_TYPES[0])
  const [module, setModule] = useState('')
  const [subject, setSubject] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [playlist, setPlaylist] = useState('')
  const [position, setPosition] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const video = isVideoType(type)
  const previewId = video ? extractYoutubeId(videoUrl) : null

  function pickFile(f: File) {
    if (!/\.(pdf|png|jpe?g)$/i.test(f.name)) {
      toast.error('Format non supporté. Utilisez PDF, PNG ou JPG.')
      return
    }
    setFile(f)
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''))
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Le titre est requis.')
      return
    }

    // ── Video: store the YouTube id, no Storage upload ──
    if (video) {
      const id = extractYoutubeId(videoUrl)
      if (!id) {
        toast.error('Lien YouTube invalide. Collez l’URL d’une vidéo YouTube.')
        return
      }
      setBusy(true)
      const res = await createLibraryItem({
        title,
        type,
        module: module || null,
        subject: subject.trim() || null,
        path: id,
        playlist: playlist.trim() || null,
        position: position.trim() ? Number(position) : null,
      })
      setBusy(false)
      if (res.success) {
        toast.success('Vidéo ajoutée à la bibliothèque.')
        onDone()
      } else {
        toast.error(res.error)
      }
      return
    }

    // ── File document ──
    if (!file) {
      toast.error('Veuillez sélectionner un fichier.')
      return
    }
    setBusy(true)

    const supabase = createClient()
    const path = `${crypto.randomUUID()}-${sanitize(file.name)}`

    const { error: upErr } = await supabase.storage.from('library').upload(path, file)
    if (upErr) {
      setBusy(false)
      toast.error(`Échec du téléversement : ${upErr.message}`)
      return
    }

    const res = await createLibraryItem({
      title,
      type,
      module: module || null,
      subject: subject.trim() || null,
      path,
    })
    setBusy(false)

    if (res.success) {
      toast.success('Document ajouté à la bibliothèque.')
      onDone()
    } else {
      // Row failed after upload — drop the orphan file.
      await supabase.storage.from('library').remove([path]).catch(() => {})
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
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: 'var(--shadow-modal)',
          width: 520,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
            Ajouter un document
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {LIBRARY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'Vidéo' ? 'Vidéo (YouTube)' : t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Titre</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Ex. Cours — Thermochimie" />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Matière</label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
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
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                list="library-cours"
                placeholder="Ex. Thermochimie"
                style={inputStyle}
              />
              <datalist id="library-cours">
                {(COURS_BY_MATIERE[module] ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* YouTube video */}
          {video ? (
            <div>
              <label style={labelStyle}>Lien YouTube</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                style={inputStyle}
                inputMode="url"
                autoCapitalize="off"
                spellCheck={false}
              />
              {previewId ? (
                <div
                  style={{
                    position: 'relative',
                    marginTop: 10,
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'var(--gray-100)',
                    border: '0.5px solid var(--gray-200)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail, no optimization needed */}
                  <img
                    src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`}
                    alt="Aperçu de la vidéo"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : videoUrl.trim() ? (
                <div style={{ fontSize: 12, color: 'var(--danger-text)', marginTop: 6 }}>
                  Lien non reconnu — collez l’URL d’une vidéo YouTube.
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 6 }}>
                  Collez l’URL d’une vidéo YouTube (watch, youtu.be, /embed ou Short).
                </div>
              )}

              <div className="grid" style={{ gridTemplateColumns: '1fr 96px', gap: 12, marginTop: 14 }}>
                <div>
                  <label style={labelStyle}>Playlist (optionnel)</label>
                  <input
                    value={playlist}
                    onChange={(e) => setPlaylist(e.target.value)}
                    list="library-playlists"
                    placeholder="Ex. Mécanique — Chapitre 1"
                    style={inputStyle}
                  />
                  <datalist id="library-playlists">
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
            </div>
          ) : (
            /* File drop */
            <div>
              <label style={labelStyle}>Fichier</label>
              {file ? (
              <div
                className="flex items-center"
                style={{ gap: 10, border: '0.5px solid var(--gray-200)', borderRadius: 12, padding: '14px 16px' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--success-bg)', color: 'var(--success-text)' }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</div>
                </div>
                {!busy && (
                  <button onClick={() => setFile(null)} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) pickFile(f)
                }}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center text-center"
                style={{
                  border: `1.5px dashed ${dragging ? 'var(--primary-500)' : 'var(--gray-200)'}`,
                  borderRadius: 12,
                  padding: '26px 18px',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) pickFile(f)
                    e.target.value = ''
                  }}
                  style={{ display: 'none' }}
                />
                <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
                  <UploadCloud size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', marginTop: 10 }}>
                  Glissez un fichier ou cliquez
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 3 }}>PDF, PNG ou JPG — max 50 Mo</div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end flex-shrink-0"
          style={{ gap: 10, padding: '14px 20px', borderTop: '0.5px solid var(--gray-200)' }}
        >
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 size={14} className="mp-spin" /> : <FileText size={14} />}
            {busy ? 'Ajout…' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  )
}
