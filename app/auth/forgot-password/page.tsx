'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthField, AuthShell } from '@/components/auth/auth-parts'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const supabase = createClient()
    // The recovery link routes through /auth/callback (it exchanges the code and
    // sets the session) then on to /auth/reset-password to choose a new password.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    // Anti-enumeration: always confirm, never reveal whether the email exists.
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
          Vérifiez votre email
        </h1>
        <p className="text-base mt-3" style={{ color: 'var(--gray-600)' }}>
          Si un compte existe pour <strong style={{ color: 'var(--gray-900)' }}>{email}</strong>, un
          lien de réinitialisation vient d&apos;être envoyé. Cliquez dessus pour choisir un nouveau
          mot de passe.
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
        Mot de passe oublié
      </h1>
      <p className="text-base mt-2 mb-7" style={{ color: 'var(--gray-600)' }}>
        Entrez votre email et nous vous enverrons un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit}>
        <AuthField
          label="Adresse email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
        />
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
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>

      <p className="text-sm text-center mt-7" style={{ color: 'var(--gray-600)' }}>
        <Link href="/auth/login" className="font-medium" style={{ color: 'var(--primary-500)' }}>
          ← Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  )
}
