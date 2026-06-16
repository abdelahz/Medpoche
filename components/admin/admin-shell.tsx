'use client'

import { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { SidebarNav } from './sidebar-nav'
import { TopBar } from './top-bar'
import { Avatar } from './primitives'
import { createClient } from '@/lib/supabase/client'

interface AdminShellProps {
  children: React.ReactNode
  profile: {
    full_name: string | null
    email: string | null
  }
  reportCount?: number
}

function getInitials(fullName: string | null): string {
  if (!fullName?.trim()) return 'A'
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AdminShell({ children, profile, reportCount = 0 }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const initials = getInitials(profile.full_name)

  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1')
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--gray-50)' }}>
      {/* ── Sidebar (white) ── */}
      <aside
        className="flex flex-col h-full flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 60 : 240,
          background: '#fff',
          borderRight: '0.5px solid var(--gray-200)',
          transition: 'width 200ms ease',
        }}
      >
        {/* Logo header */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            height: 56,
            borderBottom: '0.5px solid var(--gray-200)',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? 0 : '0 14px 0 16px',
          }}
        >
          {collapsed ? (
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-500)' }}>M</span>
          ) : (
            <>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>
                MedenPoche
              </span>
              <button
                onClick={toggle}
                title="Réduire le menu"
                className="flex cursor-pointer"
                style={{ color: 'var(--gray-400)' }}
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          )}
        </div>

        {/* Collapsed expander */}
        {collapsed && (
          <button
            onClick={toggle}
            title="Ouvrir le menu"
            className="flex justify-center cursor-pointer"
            style={{ padding: '8px 0', color: 'var(--gray-400)' }}
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* Nav */}
        <SidebarNav collapsed={collapsed} reportCount={reportCount} />

        {/* User footer */}
        <div
          className="flex-shrink-0"
          style={{ borderTop: '0.5px solid var(--gray-200)', padding: 12 }}
        >
          <div
            className="flex items-center"
            style={{ gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <Avatar initials={initials} size={collapsed ? 32 : 36} />
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}
                >
                  {profile.full_name ?? 'Admin'}
                </div>
                <div
                  className="whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontSize: 11, color: 'var(--gray-600)' }}
                >
                  {profile.email}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            title={collapsed ? 'Se déconnecter' : undefined}
            className="flex items-center w-full cursor-pointer"
            style={{
              gap: 8,
              marginTop: 8,
              borderRadius: 8,
              padding: collapsed ? '8px 0' : '7px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--gray-600)',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={collapsed ? 18 : 16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Se déconnecter</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar initials={initials} reportCount={reportCount} />
        <main className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
