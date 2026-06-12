'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AuthField, AuthShell, StrengthBar } from '@/components/auth/auth-parts'

type Status = 'checking' | 'ready' | 'invalid'

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('checking')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // The recovery link (via /auth/callback) establishes a session. Confirm it's
  // there before showing the form — otherwise the link is invalid or expired.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? 'ready' : 'invalid')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwd.length < 8) {
      setErr('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pwd !== pwd2) {
      setErr('Les deux mots de passe ne correspondent pas.')
      return
    }
    setErr('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwd })
    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }

    toast.success('Mot de passe mis à jour.')
    // The recovery session is now a normal session → the role router takes over.
    window.location.href = '/'
  }

  if (status === 'checking') {
    return (
      <AuthShell>
        <div className="flex items-center" style={{ gap: 10, color: 'var(--gray-600)' }}>
          <Loader2 size={18} className="mp-spin" /> Vérification du lien…
        </div>
      </AuthShell>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
          Lien invalide ou expiré
        </h1>
        <p className="text-base mt-3" style={{ color: 'var(--gray-600)' }}>
          Ce lien de réinitialisation n&apos;est plus valable. Demandez-en un nouveau pour
          continuer.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block mt-7 text-sm font-medium"
          style={{ color: 'var(--primary-500)' }}
        >
          Demander un nouveau lien →
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>
        Nouveau mot de passe
      </h1>
      <p className="text-base mt-2 mb-7" style={{ color: 'var(--gray-600)' }}>
        Choisissez un mot de passe d&apos;au moins 8 caractères.
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

      <form onSubmit={handleSubmit}>
        <AuthField
          label="Nouveau mot de passe"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="••••••••"
          invalid={Boolean(err && pwd.length < 8)}
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
        <StrengthBar pw={pwd} />
        <AuthField
          label="Confirmer le mot de passe"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          placeholder="••••••••"
          invalid={Boolean(err && pwd !== pwd2)}
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
          {loading ? 'Enregistrement…' : 'Mettre à jour'}
        </button>
      </form>
    </AuthShell>
  )
}
