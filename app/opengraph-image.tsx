import { ImageResponse } from 'next/og'

/**
 * Build-time generated 1200×630 social share card (Open Graph + Twitter).
 * Replaces the old square logo that rendered cropped on every share.
 * File-convention: applies app-wide unless a route sets its own image.
 */
export const runtime = 'edge'
export const alt = 'MedenPoche — Réussis ton concours de médecine au Maroc'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#3B6BE8',
          backgroundImage: 'linear-gradient(135deg, #4C7BFF 0%, #7C5CFF 100%)',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>MedenPoche</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>
            Réussis ton concours
            <br />
            de médecine au Maroc
          </div>
          <div style={{ fontSize: 30, fontWeight: 400, color: 'rgba(255,255,255,0.92)' }}>
            QCM · examens blancs · tuteur IA — commence gratuitement
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {['Maths', 'Physique', 'Chimie', 'SVT'].map((m) => (
            <div
              key={m}
              style={{
                display: 'flex',
                fontSize: 24,
                fontWeight: 600,
                padding: '10px 22px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255,255,255,0.16)',
              }}
            >
              {m}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
