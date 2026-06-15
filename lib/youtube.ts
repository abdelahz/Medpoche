/**
 * YouTube helpers for the library "Vidéo" type. Pure (no server/client deps) so
 * it can be imported anywhere. Video library items store the 11-char YouTube
 * video id in `library.file_url` instead of a Storage path.
 */

/** The library `type` value used for embedded YouTube videos. Must match LIBRARY_TYPES. */
export const VIDEO_TYPE = 'Vidéo'

const ID_RE = /^[A-Za-z0-9_-]{11}$/

export function isVideoType(type: string | null | undefined): boolean {
  return type === VIDEO_TYPE
}

/** A bare 11-char YouTube id (what we store and embed). */
export function isYoutubeId(value: string | null | undefined): value is string {
  return !!value && ID_RE.test(value)
}

/**
 * Extract the YouTube video id from a pasted URL or a bare id. Accepts watch,
 * youtu.be, /embed/, /shorts/, /live/, /v/ forms (with any extra query params).
 * Returns null when nothing valid is found.
 */
export function extractYoutubeId(input: string): string | null {
  const s = (input ?? '').trim()
  if (!s) return null
  if (ID_RE.test(s)) return s
  try {
    const url = new URL(s)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]
      return ID_RE.test(id) ? id : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v')
      if (v && ID_RE.test(v)) return v
      const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[1]
    }
    return null
  } catch {
    return null
  }
}

/** Privacy-enhanced embed URL (youtube-nocookie). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`
}

/** Public watch URL (used by the admin "open" action). */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
}
