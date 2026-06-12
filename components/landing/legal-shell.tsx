import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Container, BrandMark } from './primitives'

/** Shared layout for legal pages (mentions légales, confidentialité, CGU). */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main style={{ background: '#fff', color: 'var(--gray-900)', minHeight: '100vh' }}>
      <header style={{ borderBottom: '0.5px solid var(--gray-200)' }}>
        <Container>
          <div className="flex items-center justify-between" style={{ height: 66 }}>
            <Link href="/" aria-label="MedenPoche — accueil" className="flex items-center">
              <BrandMark height={30} />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center font-semibold"
              style={{ gap: 7, fontSize: 13.5, color: 'var(--gray-600)', textDecoration: 'none' }}
            >
              <ArrowLeft size={16} /> Accueil
            </Link>
          </div>
        </Container>
      </header>

      <Container style={{ maxWidth: 800 }}>
        <article style={{ padding: '48px 0 72px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: '12px 0 0' }}>
            Dernière mise à jour : {updated}
          </p>
          <div style={{ marginTop: 32 }}>{children}</div>
        </article>
      </Container>

      <footer style={{ borderTop: '0.5px solid var(--gray-200)', padding: '28px 0' }}>
        <Container>
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>
              © {new Date().getFullYear()} MedenPoche. Tous droits réservés.
            </span>
            <div className="flex items-center" style={{ gap: 18 }}>
              <Link href="/mentions-legales" style={legalLink}>Mentions légales</Link>
              <Link href="/confidentialite" style={legalLink}>Confidentialité</Link>
              <Link href="/conditions" style={legalLink}>CGU</Link>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  )
}

const legalLink: React.CSSProperties = { fontSize: 12.5, color: 'var(--gray-600)', textDecoration: 'none' }

/* ---- Content helpers (consistent typography across legal pages) ---- */

export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em', margin: '34px 0 12px' }}>
      {children}
    </h2>
  )
}

export function LegalP({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--gray-700, #46506a)', margin: '0 0 14px' }}>{children}</p>
}

export function LegalUl({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--gray-700, #46506a)' }}>
          {it}
        </li>
      ))}
    </ul>
  )
}

/** Placeholder for company-specific info the operator must fill in. */
export function Fill({ children }: { children: ReactNode }) {
  return (
    <span style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '0 5px', borderRadius: 4, fontWeight: 600 }}>
      [{children}]
    </span>
  )
}
