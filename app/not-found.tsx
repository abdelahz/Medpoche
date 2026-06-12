import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center text-center"
      style={{ background: 'var(--gray-50)', padding: 24 }}
    >
      <div style={{ fontSize: 56, fontWeight: 700, color: 'var(--primary-500)', lineHeight: 1 }}>404</div>
      <h1 className="font-semibold" style={{ fontSize: 18, color: 'var(--gray-900)', margin: '16px 0 8px' }}>
        Page introuvable
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--gray-600)', maxWidth: 320, lineHeight: 1.5 }}>
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center font-medium text-white"
        style={{
          marginTop: 24,
          height: 42,
          padding: '0 22px',
          borderRadius: 9999,
          background: 'var(--primary-500)',
          fontSize: 13.5,
          textDecoration: 'none',
        }}
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
