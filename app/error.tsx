'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface for monitoring; the user only ever sees the friendly message.
    console.error(error)
  }, [error])

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center text-center"
      style={{ background: 'var(--gray-50)', padding: 24 }}
    >
      <h1 className="font-semibold" style={{ fontSize: 18, color: 'var(--gray-900)', marginBottom: 8 }}>
        Une erreur est survenue
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--gray-600)', maxWidth: 340, lineHeight: 1.5 }}>
        Quelque chose s&apos;est mal passé de notre côté. Réessaie dans un instant — ce n&apos;est pas
        de ta faute.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center font-medium text-white"
        style={{
          marginTop: 24,
          height: 42,
          padding: '0 22px',
          borderRadius: 9999,
          background: 'var(--primary-500)',
          fontSize: 13.5,
          cursor: 'pointer',
        }}
      >
        Réessayer
      </button>
    </div>
  )
}
