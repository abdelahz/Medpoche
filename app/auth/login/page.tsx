'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthField, AuthShell } from '@/components/auth/auth-parts'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setErr('Veuillez renseigner votre email et votre mot de passe.')
      return
    }
    setErr('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Generic message — never reveal whether the email exists (anti-enumeration).
      setErr('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // '/' is the role router → admins land on /admin, students on /student.
    router.refresh()
    router.push('/')
  }

  // NOTE: Google sign-in temporarily removed (re-enable in ~2 days). See git history.

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
        Bon retour
      </h1>
      <p className="text-base mt-2 mb-7" style={{ color: 'var(--gray-600)' }}>
        Connectez-vous à votre compte
      </p>

      {err && (
        <div
          className="text-xs px-3 py-2.5 mb-4"
          style={{
            background: 'var(--danger-bg)',
            border: '0.5px solid var(--danger-border)',
            color: 'var(--danger-text)',
            borderRadius: 10,
          }}
        >
          {err}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <AuthField
          label="Adresse email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          invalid={Boolean(err && !email)}
        />
        <AuthField
          label="Mot de passe"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          invalid={Boolean(err && !password)}
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              style={{ color: 'var(--gray-600)', display: 'flex' }}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        <div className="text-right -mt-1.5 mb-4">
          <Link
            href="/auth/forgot-password"
            className="text-xs cursor-pointer"
            style={{ color: 'var(--primary-500)' }}
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 text-base font-medium text-white"
          style={{
            height: 42,
            borderRadius: 10,
            background: loading ? 'var(--primary-600)' : 'var(--primary-500)',
            transition: 'background 150ms ease',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading && <Loader2 size={16} className="mp-spin" />}
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="text-sm text-center mt-7" style={{ color: 'var(--gray-600)' }}>
        Pas encore de compte ?{' '}
        <Link href="/auth/register" className="font-medium" style={{ color: 'var(--primary-500)' }}>
          S&apos;inscrire →
        </Link>
      </p>
    </AuthShell>
  )
}
