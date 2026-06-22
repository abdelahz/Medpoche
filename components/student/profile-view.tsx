'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Check, LogOut, Crown, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateStudentProfile } from '@/app/actions/profile'
import { whatsappUpgradeUrl } from '@/lib/upgrade'
import { PLAN_DISPLAY, PLAN_PRICE, PLAN_PRICE_ORIGINAL, isOnPromo, discountPct } from '@/lib/plans'
import { FILIERES, type Profile, type Plan } from '@/types'
import { ScreenHeader, StudentAvatar } from './primitives'
import { HowItWorks } from './how-it-works'

const PLAN_ORDER: Plan[] = ['gratuit', 'basic', 'premium']

const label: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 6 }
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13.5,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
}
const card: React.CSSProperties = {
  margin: '0 20px 16px',
  background: '#fff',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 18,
  padding: '18px 20px',
}
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--gray-900)', margin: '0 0 14px' }

function initialsFrom(prenom: string | null, nom: string | null, full: string | null): string {
  const a = prenom?.trim()?.[0] ?? ''
  const b = nom?.trim()?.[0] ?? ''
  const combined = `${a}${b}`.toUpperCase()
  if (combined) return combined
  if (full?.trim()) return full.trim().split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return 'É'
}

export function ProfileView({ profile, email }: { profile: Profile | null; email: string | null }) {
  const router = useRouter()
  const plan: Plan = profile?.plan ?? 'gratuit'

  const [prenom, setPrenom] = useState(profile?.prenom ?? '')
  const [nom, setNom] = useState(profile?.nom ?? '')
  const [filiere, setFiliere] = useState(profile?.filiere ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingInfo, setSavingInfo] = useState(false)

  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  async function saveInfo() {
    if (!prenom.trim() || !nom.trim()) {
      toast.error('Le prénom et le nom sont requis.')
      return
    }
    setSavingInfo(true)
    const res = await updateStudentProfile({ prenom, nom, filiere: filiere || null, phone: phone || null })
    setSavingInfo(false)
    if (res.success) {
      toast.success('Informations enregistrées.')
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  async function changePassword() {
    if (pwd.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pwd !== pwd2) {
      toast.error('Les deux mots de passe ne correspondent pas.')
      return
    }
    setSavingPwd(true)
    const { error } = await createClient().auth.updateUser({ password: pwd })
    setSavingPwd(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Mot de passe mis à jour.')
      setPwd('')
      setPwd2('')
    }
  }

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/auth/login'
  }

  // Highest tier first so Premium leads the upsell.
  const upgradeTargets = PLAN_ORDER.slice(PLAN_ORDER.indexOf(plan) + 1).reverse()

  return (
    <div>
      <ScreenHeader title="Profil" />

      {/* Identity */}
      <div className="flex items-center" style={{ ...card, gap: 14 }}>
        <StudentAvatar initials={initialsFrom(prenom, nom, profile?.full_name ?? null)} size={56} />
        <div style={{ minWidth: 0 }}>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)' }}>
            {[prenom, nom].filter(Boolean).join(' ') || 'Ton profil'}
          </div>
          <div className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            {email ?? '—'}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div style={card}>
        <h2 style={sectionTitle}>Informations personnelles</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Prénom</label>
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} style={input} />
          </div>
          <div>
            <label style={label}>Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} style={input} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Email</label>
          <input value={email ?? ''} disabled style={{ ...input, background: 'var(--gray-50)', color: 'var(--gray-600)' }} />
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={label}>Filière</label>
            <select value={filiere} onChange={(e) => setFiliere(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
              <option value="">Non définie</option>
              {FILIERES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 …" style={input} />
          </div>
        </div>
        <button
          onClick={saveInfo}
          disabled={savingInfo}
          className="inline-flex items-center font-bold"
          style={{ gap: 7, marginTop: 16, padding: '11px 20px', borderRadius: 9999, background: 'var(--grad-primary)', color: '#fff', fontSize: 13, cursor: savingInfo ? 'default' : 'pointer' }}
        >
          {savingInfo ? <Loader2 size={14} className="mp-spin" /> : <Save size={14} />}
          {savingInfo ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Subscription */}
      <div style={card}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>Abonnement</h2>
          <span
            className="inline-flex items-center font-medium"
            style={{ gap: 5, padding: '4px 10px', borderRadius: 9999, fontSize: 12, background: plan === 'gratuit' ? 'var(--gray-100)' : 'var(--primary-50)', color: plan === 'gratuit' ? 'var(--gray-600)' : 'var(--primary-600)' }}
          >
            {plan !== 'gratuit' && <Crown size={13} />}
            {PLAN_DISPLAY[plan].label}
          </span>
        </div>

        {upgradeTargets.length === 0 ? (
          <div className="flex items-center" style={{ gap: 8, fontSize: 13, color: 'var(--gray-700)' }}>
            <Crown size={16} color="var(--primary-500)" /> Tu profites de tous les avantages Premium ✨
          </div>
        ) : (
          <>
            <div className="flex flex-col" style={{ gap: 12 }}>
              {upgradeTargets.map((t) => {
                const meta = PLAN_DISPLAY[t]
                const hero = meta.mostPopular
                return (
                  <div
                    key={t}
                    style={{
                      position: 'relative',
                      border: hero ? '1.5px solid var(--primary-500)' : '0.5px solid var(--gray-200)',
                      borderRadius: 16,
                      padding: 16,
                      background: hero ? 'var(--primary-50)' : '#fff',
                    }}
                  >
                    {hero && (
                      <span
                        className="inline-flex items-center"
                        style={{ position: 'absolute', top: -10, right: 14, gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 10.5, fontWeight: 700, background: 'var(--grad-primary)', color: '#fff' }}
                      >
                        <Crown size={11} /> Le plus populaire
                      </span>
                    )}
                    <div className="flex items-baseline justify-between" style={{ marginBottom: 10 }}>
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <Crown size={16} color="var(--primary-500)" />
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>{meta.label}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="flex items-baseline justify-end" style={{ gap: 6 }}>
                          {isOnPromo(t) && (
                            <span style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'line-through' }}>
                              {PLAN_PRICE_ORIGINAL[t]} DH
                            </span>
                          )}
                          <span>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>{PLAN_PRICE[t]} DH</span>
                            <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>/mois</span>
                          </span>
                        </div>
                        {isOnPromo(t) && (
                          <span className="inline-flex items-center" style={{ marginTop: 4, padding: '2px 7px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: 'var(--reward-50)', color: 'var(--reward-600)' }}>
                            Promo −{discountPct(t)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {meta.benefits.map((b) => (
                        <li key={b} className="flex items-start" style={{ gap: 7, fontSize: 12.5, color: 'var(--gray-700)' }}>
                          <Check size={14} color="var(--success-text)" style={{ flexShrink: 0, marginTop: 1 }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={whatsappUpgradeUrl(meta.label)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full font-bold"
                      style={{ gap: 6, padding: '11px 16px', borderRadius: 9999, background: hero ? 'var(--grad-primary)' : 'var(--grad-accent)', color: '#fff', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      Passer à {meta.label}
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                )
              })}
            </div>
            <HowItWorks />
          </>
        )}
      </div>

      {/* Password */}
      <div style={card}>
        <h2 style={sectionTitle}>Mot de passe</h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Nouveau mot de passe</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} style={input} autoComplete="new-password" />
          </div>
          <div>
            <label style={label}>Confirmer</label>
            <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} style={input} autoComplete="new-password" />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={savingPwd || !pwd || !pwd2}
          className="inline-flex items-center font-medium"
          style={{ gap: 7, marginTop: 16, padding: '11px 20px', borderRadius: 9999, border: '0.5px solid var(--gray-200)', background: '#fff', color: 'var(--gray-900)', fontSize: 13, cursor: savingPwd || !pwd || !pwd2 ? 'default' : 'pointer' }}
        >
          {savingPwd ? <Loader2 size={14} className="mp-spin" /> : <Check size={14} />}
          Mettre à jour le mot de passe
        </button>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 20px 28px' }}>
        <button
          onClick={signOut}
          className="flex items-center justify-center w-full font-medium"
          style={{ gap: 8, padding: '13px 16px', borderRadius: 9999, border: '0.5px solid var(--gray-200)', background: '#fff', color: 'var(--danger-text)', fontSize: 13.5, cursor: 'pointer' }}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
