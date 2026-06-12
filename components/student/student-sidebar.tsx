'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Zap, BookOpen, MessageSquare, TrendingUp, LogOut, Crown, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { whatsappUpgradeUrl } from '@/lib/upgrade'
import type { Plan } from '@/types'
import { StudentAvatar, initialsOf } from './primitives'

interface Tab {
  href: string
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { href: '/student/accueil', label: 'Accueil', icon: Home },
  { href: '/student/entrainement', label: "S'entraîner", icon: Zap },
  { href: '/student/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { href: '/student/ia', label: 'Assistant IA', icon: MessageSquare },
  { href: '/student/progres', label: 'Progrès', icon: TrendingUp },
]

function NavLink({ tab, active }: { tab: Tab; active: boolean }) {
  const [hover, setHover] = useState(false)
  const Icon = tab.icon
  const bg = active ? 'var(--primary-50)' : hover ? 'var(--gray-50)' : 'transparent'
  const color = active ? 'var(--primary-600)' : 'var(--gray-600)'
  const iconColor = active ? 'var(--primary-500)' : hover ? 'var(--gray-600)' : 'var(--gray-400)'
  return (
    <Link
      href={tab.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center font-medium"
      style={{
        gap: 11,
        padding: '9px 12px',
        borderRadius: 8,
        background: bg,
        color,
        fontSize: 13,
        borderLeft: active ? '2px solid var(--primary-500)' : '2px solid transparent',
        borderTopLeftRadius: active ? 0 : 8,
        borderBottomLeftRadius: active ? 0 : 8,
        transition: 'background 150ms ease',
      }}
    >
      <Icon size={20} color={iconColor} style={{ flexShrink: 0 }} />
      <span className="whitespace-nowrap">{tab.label}</span>
    </Link>
  )
}

export function StudentSidebar({ fullName, plan = 'gratuit' }: { fullName: string | null; plan?: Plan }) {
  const pathname = usePathname()
  const showUpgrade = plan !== 'premium'
  const upgradeTarget = plan === 'gratuit' ? 'Basic' : 'Premium'

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 flex-shrink-0"
      style={{
        width: 240,
        height: '100vh',
        background: '#fff',
        borderRight: '0.5px solid var(--gray-200)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ height: 56, padding: '0 18px', borderBottom: '0.5px solid var(--gray-200)' }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>MedenPoche</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1" style={{ gap: 4, padding: 12 }}>
        {tabs.map((t) => (
          <NavLink key={t.href} tab={t} active={pathname === t.href} />
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0" style={{ borderTop: '0.5px solid var(--gray-200)', padding: 12 }}>
        {showUpgrade && (
          <a
            href={whatsappUpgradeUrl(upgradeTarget)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center font-bold text-white"
            style={{ gap: 7, marginBottom: 10, height: 40, borderRadius: 9999, background: 'var(--grad-accent)', fontSize: 13, textDecoration: 'none' }}
          >
            <Crown size={15} />
            Passer à {upgradeTarget}
          </a>
        )}
        <Link
          href="/student/profil"
          className="flex items-center"
          style={{ gap: 10, borderRadius: 8, padding: '6px 8px', margin: '0 -8px', transition: 'background 150ms ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <StudentAvatar initials={initialsOf(fullName)} size={36} />
          <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', minWidth: 0, flex: 1 }}>
            {fullName?.split(' ')[0] ?? 'Étudiant'}
          </div>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center w-full"
          style={{ gap: 8, marginTop: 8, borderRadius: 8, padding: '7px 10px', fontSize: 13, fontWeight: 500, color: 'var(--gray-600)', cursor: 'pointer', transition: 'background 150ms ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
