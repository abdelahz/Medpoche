'use client'

import Image from 'next/image'
import { Rocket, BellRing, LogOut, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Blob } from '@/components/landing/primitives'

/**
 * Pre-launch waiting screen for free-plan students: their account is created
 * (lead captured), the platform opens once all the MCQs are uploaded.
 */
export function ComingSoon({ firstName, email }: { firstName: string; email: string | null }) {
  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--gray-50)', padding: 24 }}
    >
      <Blob color="var(--primary-100)" size={460} style={{ top: -120, right: -140 }} />
      <Blob color="var(--accent-50)" size={420} style={{ bottom: -120, left: -140 }} className="lp-float-slow" />

      <div
        className="mp-pop flex flex-col items-center text-center"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          borderRadius: 28,
          border: '0.5px solid var(--gray-200)',
          boxShadow: 'var(--shadow-modal)',
          padding: 'clamp(28px, 6vw, 44px)',
        }}
      >
        <Image src="/brand/logo.png" alt="MedenPoche" width={140} height={82} priority style={{ width: 140, height: 'auto' }} />

        <div
          className="lp-float lp-gradient-animated flex items-center justify-center"
          style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--grad-primary)', color: '#fff', marginTop: 26 }}
        >
          <Rocket size={34} />
        </div>

        <h1 style={{ fontSize: 'clamp(22px, 4.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.01em', margin: '22px 0 0', color: 'var(--gray-900)' }}>
          {firstName ? `${firstName}, ton compte est prêt 🎉` : 'Ton compte est prêt 🎉'}
        </h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--gray-600)', margin: '14px 0 0', maxWidth: 360 }}>
          On met la dernière main à la plateforme : tous les QCM du concours sont en train
          d&apos;être ajoutés. <strong style={{ color: 'var(--gray-900)' }}>Tu fais partie des premiers inscrits</strong> —
          ton accès s&apos;ouvrira automatiquement au lancement.
        </p>

        <div
          className="flex items-center"
          style={{ gap: 10, marginTop: 24, padding: '12px 16px', borderRadius: 14, background: 'var(--primary-50)', maxWidth: '100%' }}
        >
          <BellRing size={17} color="var(--primary-600)" style={{ flexShrink: 0 }} />
          <span className="text-left" style={{ fontSize: 12.5, color: 'var(--primary-600)', fontWeight: 600, minWidth: 0 }}>
            On te préviendra {email ? <>sur <span style={{ wordBreak: 'break-all' }}>{email}</span></> : 'par email'} dès l&apos;ouverture.
          </span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 9, alignSelf: 'stretch' }}>
          {['20 QCM gratuits par jour dès le lancement', 'Corrections expliquées pour chaque question', 'Classement, séries et suivi de progression'].map((t) => (
            <li key={t} className="flex items-center text-left" style={{ gap: 9, fontSize: 13, color: 'var(--gray-600)' }}>
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 20, height: 20, borderRadius: 9999, background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                <Check size={12} />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={signOut}
          className="flex items-center justify-center"
          style={{ gap: 7, marginTop: 28, fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', cursor: 'pointer', background: 'transparent', padding: 8 }}
        >
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </main>
  )
}
