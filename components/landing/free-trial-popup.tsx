'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Target, ArrowRight } from 'lucide-react'

/**
 * Conversion nudge that appears 4s after the landing page loads — on every
 * load/reload (landing only): "Essaie 20 questions gratuitement" → register.
 */
export function FreeTrialPopup() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 4000)
    return () => clearTimeout(t)
  }, [])

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(15,20,36,0.5)', zIndex: 90, padding: 22 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mp-pop"
        style={{ position: 'relative', width: '100%', maxWidth: 380, background: '#fff', borderRadius: 24, padding: 30, textAlign: 'center', boxShadow: 'var(--shadow-modal)' }}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="flex items-center justify-center"
          style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 9999, color: 'var(--gray-400)', cursor: 'pointer', background: 'transparent' }}
        >
          <X size={18} />
        </button>

        <div
          className="lp-gradient-animated flex items-center justify-center mx-auto"
          style={{ width: 60, height: 60, borderRadius: 18, background: 'var(--grad-primary)', color: '#fff' }}
        >
          <Target size={28} />
        </div>
        <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.01em', margin: '18px 0 8px', color: 'var(--gray-900)' }}>
          Essaie 20 questions gratuitement 🎯
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--gray-600)', margin: 0 }}>
          Crée ton compte en 30 secondes, sans carte bancaire, et commence à t&apos;entraîner tout de
          suite.
        </p>

        <Link
          href="/auth/register"
          className="flex items-center justify-center font-bold text-white"
          style={{ gap: 8, marginTop: 22, height: 50, borderRadius: 9999, background: 'var(--grad-primary)', fontSize: 15, textDecoration: 'none', boxShadow: '0 10px 26px rgba(76,123,255,0.4)' }}
        >
          Commencer gratuitement <ArrowRight size={18} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-600)', fontWeight: 600, cursor: 'pointer', background: 'transparent', width: '100%', padding: 6 }}
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
