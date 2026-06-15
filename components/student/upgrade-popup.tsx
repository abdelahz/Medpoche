'use client'

import { useEffect, useState } from 'react'
import { X, Video, PartyPopper } from 'lucide-react'
import type { Plan } from '@/types'
import { whatsappMentorUrl, INSTAGRAM_GRADIENT } from '@/lib/upgrade'

const RANK: Record<Plan, number> = { gratuit: 0, basic: 1, premium: 2 }
const KEY = 'mp-plan-seen'

/**
 * One-time celebration shown when a student's plan is upgraded to a paying tier.
 * Upgrades are applied admin-side, so we detect the change client-side by
 * comparing the current plan to the last one we recorded in localStorage. First
 * load just records silently (so existing paid users aren't falsely greeted).
 */
export function UpgradePopup({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as Plan | null
      if (stored && RANK[plan] > RANK[stored] && plan !== 'gratuit') {
        setOpen(true)
      }
      localStorage.setItem(KEY, plan)
    } catch {
      /* localStorage unavailable — skip */
    }
  }, [plan])

  if (!open) return null

  const label = plan === 'premium' ? 'Premium' : 'Basic'
  const message =
    plan === 'premium'
      ? "Tu es passé Premium 👑 Réserve dès maintenant ton appel hebdomadaire d'accompagnement avec un étudiant en médecine."
      : 'Tu as débloqué le plan Basic 🎉 Profite de ton appel avec un étudiant en médecine pour booster ta préparation.'

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(15,20,36,0.45)', zIndex: 80, padding: 22 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mp-pop"
        style={{ position: 'relative', width: '100%', maxWidth: 360, background: '#fff', borderRadius: 22, padding: 26, textAlign: 'center', boxShadow: 'var(--shadow-modal)' }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="flex items-center justify-center"
          style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 9999, color: 'var(--gray-400)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>

        <div
          className="flex items-center justify-center mx-auto"
          style={{ width: 58, height: 58, borderRadius: 18, background: 'var(--grad-accent)', color: '#fff' }}
        >
          <PartyPopper size={28} />
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: '16px 0 8px', color: 'var(--gray-900)' }}>
          Bienvenue dans {label} !
        </h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--gray-600)', margin: 0 }}>{message}</p>

        <a
          href={whatsappMentorUrl(label)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex items-center justify-center font-bold text-white"
          style={{ gap: 8, marginTop: 20, height: 46, borderRadius: 9999, background: INSTAGRAM_GRADIENT, fontSize: 14, textDecoration: 'none' }}
        >
          <Video size={17} /> Réserver mon appel
        </a>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-600)', fontWeight: 600, cursor: 'pointer', background: 'transparent', width: '100%', padding: 8 }}
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
