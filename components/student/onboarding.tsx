'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { updateStudentProfile } from '@/app/actions/profile'
import { daysUntilConcours } from '@/lib/exam'
import { FILIERES } from '@/types'

const SKIP_KEY = 'mp-onboard-skip'

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 10,
  padding: '11px 12px',
  fontSize: 14,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }

/**
 * First-run onboarding. Captures prénom / nom / filière when the profile is
 * incomplete — improves the greeting/avatar and unlocks filière-aware copy. The
 * countdown adds motivation. Dismissable ("Plus tard" → device-local skip flag).
 */
export function Onboarding({
  prenom,
  nom,
  filiere,
  phone,
}: {
  prenom: string | null
  nom: string | null
  filiere: string | null
  phone: string | null
}) {
  const router = useRouter()
  const incomplete = !prenom?.trim() || !nom?.trim() || !filiere?.trim()
  const [open, setOpen] = useState(false)
  const [p, setP] = useState(prenom ?? '')
  const [n, setN] = useState(nom ?? '')
  const [f, setF] = useState(filiere ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!incomplete) return
    try {
      if (localStorage.getItem(SKIP_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setOpen(true)
  }, [incomplete])

  if (!open) return null

  const days = daysUntilConcours()

  function skip() {
    try {
      localStorage.setItem(SKIP_KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  async function save() {
    if (!p.trim() || !n.trim()) {
      toast.error('Le prénom et le nom sont requis.')
      return
    }
    setSaving(true)
    const res = await updateStudentProfile({ prenom: p, nom: n, filiere: f || null, phone: phone ?? null })
    setSaving(false)
    if (res.success) {
      try {
        localStorage.setItem(SKIP_KEY, '1')
      } catch {
        /* ignore */
      }
      setOpen(false)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(15,20,36,0.45)', zIndex: 90, padding: 20 }}>
      <div className="mp-pop" style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow-modal)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center" style={{ gap: 11, marginBottom: 6 }}>
          <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--grad-primary)', color: '#fff' }}>
            <GraduationCap size={21} />
          </span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--gray-900)' }}>Bienvenue 👋</div>
            <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
              {days > 0 ? `J-${days} avant le concours — on personnalise ta préparation.` : 'On personnalise ta préparation.'}
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Prénom</label>
            <input value={p} onChange={(e) => setP(e.target.value)} style={field} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Nom</label>
            <input value={n} onChange={(e) => setN(e.target.value)} style={field} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle}>Ta filière</label>
          <select value={f} onChange={(e) => setF(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
            <option value="">Choisis ta filière</option>
            {FILIERES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center justify-center w-full font-bold text-white"
          style={{ gap: 7, marginTop: 20, height: 48, borderRadius: 9999, background: 'var(--grad-primary)', fontSize: 14, cursor: saving ? 'default' : 'pointer' }}
        >
          {saving ? <Loader2 size={16} className="mp-spin" /> : <>C&apos;est parti <ArrowRight size={16} /></>}
        </button>
        <button
          type="button"
          onClick={skip}
          style={{ marginTop: 10, width: '100%', padding: 8, fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', background: 'transparent', cursor: 'pointer' }}
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
