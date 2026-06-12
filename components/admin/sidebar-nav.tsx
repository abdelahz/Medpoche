'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Database,
  Users,
  BarChart2,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/qcms', label: 'QCMs', icon: FileText },
  { href: '/admin/bibliotheque', label: 'Bibliothèque', icon: BookOpen },
  { href: '/admin/dataset', label: 'Dataset IA', icon: Database },
  { href: '/admin/etudiants', label: 'Étudiants', icon: Users },
  { href: '/admin/analytics', label: 'Analytiques', icon: BarChart2 },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
]

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const [hover, setHover] = useState(false)
  const Icon = item.icon

  const bg = active ? 'var(--primary-50)' : hover ? 'var(--gray-50)' : 'transparent'
  const color = active ? 'var(--primary-600)' : 'var(--gray-600)'
  const iconColor = active
    ? 'var(--primary-500)'
    : hover
    ? 'var(--gray-600)'
    : 'var(--gray-400)'

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center font-medium"
      style={{
        gap: 10,
        padding: collapsed ? '8px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
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
      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
    </Link>
  )
}

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  return (
    <nav
      className="flex flex-col flex-1"
      style={{ gap: 4, padding: collapsed ? '10px 8px' : '12px 12px' }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          collapsed={collapsed}
          active={pathname === item.href}
        />
      ))}
    </nav>
  )
}
