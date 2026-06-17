'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SESSION_COOKIE, SESSION_COOKIE_MAX_AGE } from '@/lib/session'
import { toast } from 'sonner'
import { AuthField, AuthShell, StrengthBar } from '@/components/auth/auth-parts'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !phone || !password) {
      setErr('Tous les champs sont requis pour créer un compte.')
      return
    }
    // Lenient but real: at least 9 digits (handles 06…, +212 6…, spaces/dashes).
    if (phone.replace(/\D/g, '').length < 9) {
      setErr('Entre un numéro de téléphone valide.')
      return
    }
    if (password.length < 8) {
      setErr('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    setErr('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // When email confirmation is OFF, signUp returns a session (the user is
    // logged in) — claim the single active session, then hard-navigate so the
    // fresh auth cookie reaches the server role router. When confirmation is ON
    // there's no session yet → show the "verify your email" screen.
    if (data.session && data.user) {
      const token = crypto.randomUUID()
      await supabase.from('profiles').update({ session_token: token }).eq('id', data.user.id)
      document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`
      window.location.assign('/')
      return
    }

    setDone(true)
  }

  // NOTE: Google sign-up temporarily removed (re-enable in ~2 days). See git history.

  if (done) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
          Vérifiez votre email
        </h1>
        <p className="text-base mt-3" style={{ color: 'var(--gray-600)' }}>
          Un lien de confirmation a été envoyé à <strong style={{ color: 'var(--gray-900)' }}>{email}</strong>.
          Cliquez dessus pour activer votre compte.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-7 text-sm font-medium"
          style={{ color: 'var(--primary-500)' }}
        >
          ← Retour à la connexion
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
        Créer un compte
      </h1>
      <p className="text-base mt-2 mb-7" style={{ color: 'var(--gray-600)' }}>
        Rejoignez MedenPoche gratuitement
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

      <form onSubmit={handleRegister}>
        <AuthField
          label="Nom complet"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Sara Lahlou"
          invalid={Boolean(err && !fullName)}
        />
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
          label="Numéro de téléphone (WhatsApp)"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          invalid={Boolean(err && phone.replace(/\D/g, '').length < 9)}
        />
        <AuthField
          label="Mot de passe"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          invalid={Boolean(err && password.length < 8)}
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
        <StrengthBar pw={password} />

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
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-sm text-center mt-7" style={{ color: 'var(--gray-600)' }}>
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="font-medium" style={{ color: 'var(--primary-500)' }}>
          Se connecter →
        </Link>
      </p>
    </AuthShell>
  )
}
