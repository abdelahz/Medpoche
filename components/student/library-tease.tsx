import { Lock, Play, FileText } from 'lucide-react'
import type { LibraryItem } from '@/types'
import { isVideoType } from '@/lib/youtube'
import { ScreenHeader, MODULE_THEME } from './primitives'
import { UpgradeButton } from './upgrade-button'
import { HowItWorks } from './how-it-works'

/**
 * Free-plan library teaser: a blurred, non-interactive peek at the real catalogue
 * (true titles + counts) behind a lock card — "tease then gate" converts better
 * than a blank wall. The actual files stay gated (no signed URLs are minted here).
 */
export function LibraryTease({ items }: { items: LibraryItem[] }) {
  const videos = items.filter((it) => isVideoType(it.type)).length
  const docs = items.length - videos
  const parts: string[] = []
  if (videos > 0) parts.push(`${videos} vidéo${videos > 1 ? 's' : ''}`)
  if (docs > 0) parts.push(`${docs} document${docs > 1 ? 's' : ''}`)
  const summary = parts.join(' · ')

  const preview = items.slice(0, 8)

  return (
    <div>
      <ScreenHeader title="Bibliothèque" />
      <div style={{ padding: '0 20px 28px' }}>
        {/* Lock card */}
        <div
          className="flex flex-col items-center text-center"
          style={{ padding: '28px 22px', borderRadius: 18, background: 'var(--primary-50)', border: '0.5px solid var(--gray-200)', gap: 11 }}
        >
          <div className="flex items-center justify-center" style={{ width: 54, height: 54, borderRadius: 18, background: 'var(--primary-500)', color: '#fff' }}>
            <Lock size={25} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>
            Débloque toute la bibliothèque
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--gray-600)', maxWidth: 320, lineHeight: 1.5 }}>
            {summary ? `${summary} t’attendent — ` : ''}cours, résumés, fiches, annales et vidéos.{' '}
            Accède à tout avec un abonnement Basic ou Premium.
          </div>
          <div style={{ marginTop: 4 }}>
            <UpgradeButton variant="whatsapp" targetPlan="Basic" label="Débloquer la bibliothèque" />
          </div>
          <div style={{ width: '100%', maxWidth: 340 }}>
            <HowItWorks compact />
          </div>
        </div>

        {/* Blurred non-interactive preview of the real catalogue */}
        {preview.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', margin: '22px 0 12px' }}>
              Un aperçu de ce qui t’attend
            </div>
            <div
              aria-hidden
              className="grid grid-cols-1 sm:grid-cols-2"
              style={{ gap: 12, filter: 'blur(2.5px)', opacity: 0.85, pointerEvents: 'none', userSelect: 'none' }}
            >
              {preview.map((it) => {
                const theme = (it.module && MODULE_THEME[it.module]) || null
                const vid = isVideoType(it.type)
                return (
                  <div
                    key={it.id}
                    className="flex items-center"
                    style={{ gap: 12, padding: '13px 14px', borderRadius: 14, background: theme?.bg ?? 'var(--gray-50)', border: '0.5px solid var(--gray-200)' }}
                  >
                    <span className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 11, background: theme?.color ?? 'var(--primary-500)', color: '#fff' }}>
                      {vid ? <Play size={18} /> : <FileText size={18} />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>
                        {it.title}
                      </span>
                      <span className="block" style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        {it.type}
                        {it.module ? ` · ${it.module}` : ''}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
