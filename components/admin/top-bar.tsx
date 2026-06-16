'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Avatar } from './primitives'

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Tableau de bord',
  '/admin/qcms': 'Banque de QCMs',
  '/admin/bibliotheque': 'Bibliothèque',
  '/admin/dataset': 'Dataset IA',
  '/admin/etudiants': 'Étudiants',
  '/admin/signalements': 'Signalements',
  '/admin/analytics': 'Analytiques',
  '/admin/parametres': 'Paramètres',
}

export function TopBar({ initials, reportCount = 0 }: { initials: string; reportCount?: number }) {
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
        <Link
          href="/admin/signalements"
          title={reportCount > 0 ? `${reportCount} signalement(s) à traiter` : 'Signalements'}
          aria-label="Signalements"
          className="relative flex cursor-pointer"
          style={{ color: reportCount > 0 ? 'var(--primary-600)' : 'var(--gray-400)' }}
        >
          <Bell size={20} />
          {reportCount > 0 && (
            <span
              className="flex items-center justify-center font-bold"
              style={{
                position: 'absolute',
                top: -5,
                right: -6,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 9999,
                background: 'var(--danger-solid, #EF4444)',
                color: '#fff',
                fontSize: 10,
                border: '1.5px solid #fff',
              }}
            >
              {reportCount > 99 ? '99+' : reportCount}
            </span>
          )}
        </Link>
        <Avatar initials={initials} size={36} />
      </div>
    </header>
  )
}
