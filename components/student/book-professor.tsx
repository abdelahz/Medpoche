'use client'

import { useState } from 'react'
import { GraduationCap, X, ArrowRight } from 'lucide-react'
import { MODULES, type Module } from '@/types'
import { whatsappProfessorUrl, PROFESSOR_SESSION_PRICE } from '@/lib/upgrade'

const field: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '0.5px solid var(--gray-200)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13.5,
  color: 'var(--gray-900)',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }

/**
 * À-la-carte private lesson with a professor (paid per session). Card on the
 * dashboard opens a short form (matière / chapitre / questions); submitting opens
 * WhatsApp with the request pre-filled. Available to every student.
 */
export function BookProfessor() {
  const [open, setOpen] = useState(false)
  const [matiere, setMatiere] = useState<Module | ''>('')
  const [chapitre, setChapitre] = useState('')
  const [questions, setQuestions] = useState('')

  const canSubmit = matiere !== '' && chapitre.trim().length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center w-full text-left"
        style={{ gap: 13, padding: '15px 17px', borderRadius: 18, background: '#fff', border: '0.5px solid var(--gray-200)' }}
      >
        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--success-bg)', color: 'var(--success-text)' }}>
          <GraduationCap size={20} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="block" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>
            Cours particulier avec un professeur
          </span>
          <span className="block" style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
            Réserve une séance ciblée · {PROFESSOR_SESSION_PRICE}
          </span>
        </span>
        <ArrowRight size={18} color="var(--gray-400)" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(15,20,36,0.45)', zIndex: 80, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mp-pop"
            style={{ position: 'relative', width: '100%', maxWidth: 380, background: '#fff', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow-modal)', maxHeight: '88vh', overflowY: 'auto' }}
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

            <div className="flex items-center" style={{ gap: 11, marginBottom: 4 }}>
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                <GraduationCap size={20} />
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>Cours particulier</div>
                <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>Avec un professeur · {PROFESSOR_SESSION_PRICE}</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={labelStyle}>Matière</label>
              <select value={matiere} onChange={(e) => setMatiere(e.target.value as Module)} style={{ ...field, cursor: 'pointer' }}>
                <option value="">Choisis une matière</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Chapitre</label>
              <input
                value={chapitre}
                onChange={(e) => setChapitre(e.target.value)}
                placeholder="Ex. Les nombres complexes"
                style={field}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Tes questions / objectifs (optionnel)</label>
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={3}
                placeholder="Ce que tu veux travailler pendant la séance…"
                style={{ ...field, resize: 'none' }}
              />
            </div>

            <a
              href={canSubmit ? whatsappProfessorUrl({ matiere, chapitre, questions }) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!canSubmit) e.preventDefault()
                else setOpen(false)
              }}
              aria-disabled={!canSubmit}
              className="flex items-center justify-center font-bold text-white"
              style={{
                gap: 8, marginTop: 20, height: 46, borderRadius: 9999,
                background: canSubmit ? '#25D366' : 'var(--gray-200)',
                color: canSubmit ? '#fff' : 'var(--gray-400)',
                fontSize: 14, textDecoration: 'none', cursor: canSubmit ? 'pointer' : 'default',
              }}
            >
              Réserver sur WhatsApp
            </a>
            <p style={{ fontSize: 11.5, color: 'var(--gray-600)', textAlign: 'center', margin: '10px 0 0' }}>
              On confirme le créneau ensemble sur WhatsApp.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
