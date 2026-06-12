'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, BookOpen, MessageSquare, TrendingUp, type LucideIcon } from 'lucide-react'

interface Tab {
  href: string
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { href: '/student/accueil', label: 'Accueil', icon: Home },
  { href: '/student/entrainement', label: "S'entraîner", icon: Zap },
  { href: '/student/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { href: '/student/ia', label: 'IA', icon: MessageSquare },
  { href: '/student/progres', label: 'Progrès', icon: TrendingUp },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex lg:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        height: 60,
        background: '#fff',
        borderTop: '0.5px solid var(--gray-200)',
        zIndex: 30,
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        const color = active ? 'var(--primary-500)' : 'var(--gray-400)'
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center"
            style={{ flex: 1, gap: 3, color, paddingTop: 2 }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{tab.label}</span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 9999,
                background: active ? 'var(--primary-500)' : 'transparent',
              }}
            />
          </Link>
        )
      })}
    </nav>
  )
}
