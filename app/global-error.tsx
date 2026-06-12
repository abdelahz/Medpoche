'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, so it
 * must render its own <html>/<body> and cannot rely on globals.css being loaded.
 * Styles are inlined and self-contained.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 24,
          background: '#F7F8FC',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#0F172A',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Une erreur est survenue</h1>
        <p style={{ fontSize: 14, color: '#475569', maxWidth: 340, lineHeight: 1.5, margin: 0 }}>
          Quelque chose s&apos;est mal passé. Réessaie dans un instant.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 24,
            height: 42,
            padding: '0 22px',
            borderRadius: 9999,
            border: 'none',
            background: '#3B6BE8',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  )
}
