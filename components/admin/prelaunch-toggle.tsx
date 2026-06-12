'use client'

import { useState } from 'react'
import { Rocket, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { setPrelaunchMode } from '@/app/actions/settings'
import { Card } from './primitives'

/**
 * Pre-launch switch: while ON, free-plan students land on the "launching soon"
 * page instead of the app. Admins and Basic/Premium accounts always get in.
 */
export function PrelaunchToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    const next = !on
    setBusy(true)
    const res = await setPrelaunchMode(next)
    setBusy(false)
    if (res.success) {
      setOn(next)
      toast.success(next ? 'Mode pré-lancement activé.' : 'Plateforme ouverte aux étudiants.')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Card style={{ padding: 20, marginBottom: 16 }}>
      <div className="flex items-center" style={{ gap: 14 }}>
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, borderRadius: 10, background: on ? 'var(--warning-bg)' : 'var(--success-bg)', color: on ? 'var(--warning-text)' : 'var(--success-text)' }}
        >
          <Rocket size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Mode pré-lancement</div>
          <div style={{ fontSize: 12.5, color: 'var(--gray-600)', marginTop: 2 }}>
            {on
              ? 'ACTIF — les comptes gratuits voient la page « Bientôt disponible ». Les admins et les plans payants accèdent normalement.'
              : 'Inactif — tous les étudiants accèdent à la plateforme.'}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          role="switch"
          aria-checked={on}
          style={{
            width: 44,
            height: 24,
            borderRadius: 9999,
            background: on ? 'var(--warning-solid)' : 'var(--gray-200)',
            position: 'relative',
            cursor: busy ? 'default' : 'pointer',
            transition: 'background 150ms ease',
            flexShrink: 0,
          }}
        >
          {busy ? (
            <Loader2 size={14} className="mp-spin" style={{ position: 'absolute', top: 5, left: on ? 24 : 6, color: '#fff' }} />
          ) : (
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: on ? 22 : 2,
                width: 20,
                height: 20,
                borderRadius: 9999,
                background: '#fff',
                transition: 'left 150ms ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
          )}
        </button>
      </div>
    </Card>
  )
}
