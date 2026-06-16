'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ============================================================
   Auth split-layout shell: brand panel (45%) + form panel.
   Brand panel hides under 768px; a compact logo shows instead.
   ============================================================ */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left brand panel */}
      <div
        className="auth-left flex-col items-center justify-center relative"
        style={{
          flex: '0 0 45%',
          display: 'flex',
          background: 'var(--gray-50)',
          padding: 56,
          borderRight: '0.5px solid var(--gray-200)',
        }}
      >
        <div className="flex flex-col items-center text-center" style={{ maxWidth: 360 }}>
          <Link href="/" aria-label="Retour à l'accueil">
            <Image
              src="/brand/logo.png"
              alt="Med En Poche"
              width={208}
              height={120}
              priority
              style={{ width: 208, height: 'auto', display: 'block' }}
            />
          </Link>
          <div
            style={{
              width: 44,
              height: 3,
              borderRadius: 9999,
              background: 'var(--brand-green)',
              margin: '34px 0 22px',
            }}
          />
          <h2
            className="font-semibold"
            style={{
              fontSize: 21,
              color: 'var(--brand-blue)',
              lineHeight: 1.45,
              letterSpacing: '-0.01em',
            }}
          >
            Votre clé d&apos;accès à la faculté de médecine
          </h2>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right flex-1 flex flex-col items-center bg-white">
        {/* Mobile logo (shown < 768px) */}
        <div
          className="auth-mobile-logo flex-col items-center"
          style={{ display: 'none', paddingTop: 40, paddingBottom: 4, gap: 14 }}
        >
          <Link href="/" aria-label="Retour à l'accueil">
            <Image
              src="/brand/logo.png"
              alt="Med En Poche"
              width={128}
              height={74}
              style={{ width: 128, height: 'auto' }}
            />
          </Link>
          <div
            className="text-center font-medium"
            style={{ fontSize: 13, color: 'var(--brand-blue)', maxWidth: 300 }}
          >
            Votre clé d&apos;accès à la faculté de médecine
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full" style={{ padding: '48px 24px' }}>
          <div className="w-full" style={{ maxWidth: 380 }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

/* ---- Field ---- */
interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  invalid?: boolean
  trailing?: React.ReactNode
}

export function AuthField({ label, invalid, trailing, ...props }: AuthFieldProps) {
  const [focus, setFocus] = useState(false)
  const border = invalid
    ? '1px solid var(--danger-solid)'
    : focus
    ? '1px solid var(--primary-500)'
    : '0.5px solid var(--gray-200)'
  const ring = invalid
    ? '0 0 0 3px var(--danger-bg)'
    : focus
    ? '0 0 0 3px var(--primary-50)'
    : 'none'

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        className="block font-medium"
        style={{ fontSize: 12, color: 'var(--gray-900)', marginBottom: 6 }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          {...props}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            height: 42,
            boxSizing: 'border-box',
            padding: trailing ? '10px 42px 10px 14px' : '10px 14px',
            border,
            borderRadius: 10,
            boxShadow: ring,
            fontSize: 13,
            color: 'var(--gray-900)',
            background: '#fff',
            outline: 'none',
            transition: 'box-shadow 150ms ease, border-color 150ms ease',
          }}
        />
        {trailing && (
          <div className="absolute flex" style={{ right: 10 }}>
            {trailing}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---- Google button ---- */
function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

export function GoogleButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center justify-center gap-2.5 font-medium"
      style={{
        height: 42,
        borderRadius: 10,
        border: '0.5px solid var(--gray-200)',
        background: hover ? 'var(--gray-50)' : '#fff',
        color: 'var(--gray-900)',
        fontSize: 13,
        cursor: 'pointer',
        transition: 'background 150ms ease',
      }}
    >
      <GoogleG />
      {children}
    </button>
  )
}

/* ---- Divider ---- */
export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: 12, margin: '18px 0' }}>
      <div className="flex-1" style={{ height: 0.5, background: 'var(--gray-200)' }} />
      <span className="whitespace-nowrap" style={{ fontSize: 12, color: 'var(--gray-600)' }}>
        {children}
      </span>
      <div className="flex-1" style={{ height: 0.5, background: 'var(--gray-200)' }} />
    </div>
  )
}

/* ---- Password strength ---- */
function strengthOf(pw: string): number {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

export function StrengthBar({ pw }: { pw: string }) {
  const s = strengthOf(pw)
  const colors = ['#EF4444', '#EF4444', '#F59E0B', '#22C55E', '#22C55E']
  const labels = ['Trop court', 'Faible', 'Moyen', 'Bon', 'Excellent']
  return (
    <div style={{ marginTop: -6, marginBottom: 16 }}>
      <div className="flex" style={{ gap: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 9999,
              background: i < s ? colors[s] : 'var(--gray-200)',
              transition: 'background 250ms ease',
            }}
          />
        ))}
      </div>
      {pw && (
        <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 6 }}>{labels[s]}</div>
      )}
    </div>
  )
}
