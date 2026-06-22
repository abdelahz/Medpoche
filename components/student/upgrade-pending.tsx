'use client'

import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import type { Plan } from '@/types'

const KEY = 'mp-upgrade-requested'

/**
 * "Demande envoyée" reassurance banner. Because billing is manual (WhatsApp →
 * RIB → virement → preuve → activation), a student who taps an upgrade CTA lands
 * in WhatsApp and then nothing changes in-app until an admin flips their plan.
 * This bridges that gap: we detect the upgrade tap (any wa.me link whose message
 * asks for the RIB) and show a pending state until the plan actually upgrades.
 */
export function UpgradePendingBanner({ plan }: { plan: Plan }) {
  const [requested, setRequested] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Already upgraded → clear any stale request and never show.
    if (plan !== 'gratuit') {
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      if (localStorage.getItem(KEY)) setRequested(true)
    } catch {
      /* ignore */
    }
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="https://wa.me/"]') as
        | HTMLAnchorElement
        | null
      if (!a) return
      // Upgrade messages ask for the RIB; mentor / professor messages don't.
      if (!decodeURIComponent(a.href).includes('RIB')) return
      try {
        localStorage.setItem(KEY, String(Date.now()))
      } catch {
        /* ignore */
      }
      setRequested(true)
      setDismissed(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [plan])

  if (plan !== 'gratuit' || !requested || dismissed) return null

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div
        className="flex items-start"
        style={{ gap: 11, padding: '12px 14px', borderRadius: 14, background: 'var(--reward-50, #FFF7E6)', border: '0.5px solid var(--reward-500, #FFB020)' }}
      >
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--reward-500, #FFB020)', color: '#fff' }}>
          <Clock size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>Demande envoyée ✅</div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2, lineHeight: 1.45 }}>
            Dès qu’on reçoit ta preuve de virement sur WhatsApp, ton compte passe à la vitesse supérieure.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 26, height: 26, borderRadius: 9999, color: 'var(--gray-400)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
