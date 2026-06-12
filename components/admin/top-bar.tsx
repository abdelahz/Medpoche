'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar } from './primitives'

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/qcms': 'Banque de QCMs',
  '/admin/bibliotheque': 'Bibliothèque',
  '/admin/dataset': 'Dataset IA',
  '/admin/etudiants': 'Étudiants',
  '/admin/analytics': 'Analytiques',
  '/admin/parametres': 'Paramètres',
}

export function TopBar({ initials }: { initials: string }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Admin'

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '0.5px solid var(--gray-200)',
        padding: '0 24px',
      }}
    >
      <h1 style={{ fontSize: 17, fontWeight: 600, color: 'var(--gray-900)', margin: 0 }}>
        {title}
      </h1>
      <div className="flex items-center" style={{ gap: 14 }}>
        <button type="button" className="flex cursor-pointer" style={{ color: 'var(--gray-400)' }}>
          <Bell size={20} />
        </button>
        <Avatar initials={initials} size={36} />
      </div>
    </header>
  )
}
