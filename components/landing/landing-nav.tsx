'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Container, Cta, BrandMark } from './primitives'

const LINKS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#comment', label: 'Comment ça marche' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
        borderBottom: scrolled ? '0.5px solid var(--gray-200)' : '0.5px solid transparent',
        transition: 'background 200ms ease, border-color 200ms ease',
      }}
    >
      <Container>
        <div className="flex items-center justify-between" style={{ height: 66 }}>
          <Link href="/" aria-label="MedenPoche — accueil" className="flex items-center">
            <BrandMark height={30} />
          </Link>

          <nav className="hidden md:flex items-center" style={{ gap: 4 }}>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-medium"
                style={{ padding: '8px 12px', borderRadius: 9999, fontSize: 13.5, color: 'var(--gray-600)' }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center" style={{ gap: 10 }}>
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center font-semibold"
              style={{ height: 40, padding: '0 14px', borderRadius: 9999, fontSize: 13.5, color: 'var(--gray-900)', textDecoration: 'none' }}
            >
              Se connecter
            </Link>
            <Cta href="/auth/register" size="md">
              Commencer gratuitement
            </Cta>
          </div>
        </div>
      </Container>
    </header>
  )
}
