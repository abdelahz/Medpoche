'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, GraduationCap, Zap, Calendar, BookText, ClipboardList, ChevronRight, Loader2, Bookmark, RotateCcw, Flame, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { whatsappUpgradeUrl } from '@/lib/upgrade'
import { pricePhrase } from '@/lib/plans'
import type { PracticeFacet, PracticeMode, PracticeQuestion } from '@/types'
import { usePracticeStore } from '@/lib/store/practice'
import { getPracticeQuestions, getExamSession, getMistakeQuestions, getMatiereQuickSeries, type PracticeFilter } from '@/app/actions/practice'
import { getBookmarkedQuestions } from '@/app/actions/bookmarks'
import { ScreenHeader, MODULE_THEME, MODULES } from './primitives'
import { PracticeRunner } from './practice-runner'

type SessionType = 'annees' | 'cours' | 'examens'
const ALL = '__all__'

function distinct<T>(arr: (T | null)[]): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x !== null && x !== undefined && x !== '')))
}

function Tile({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center w-full text-left"
      style={{ gap: 14, padding: '16px', borderRadius: 16, border: '0.5px solid var(--gray-200)', background: '#fff' }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-50)', color: 'var(--primary-500)' }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <ChevronRight size={18} color="var(--gray-400)" />
    </button>
  )
}

export function PracticeSetup({
  facets,
  initialModule,
  bookmarkCount = 0,
  mistakeCount = 0,
  autoFavoris = false,
  autoErreurs = false,
  mcqRemaining = null,
  canExamensBlancs = true,
}: {
  facets: PracticeFacet[]
  initialModule?: string
  bookmarkCount?: number
  mistakeCount?: number
  autoFavoris?: boolean
  autoErreurs?: boolean
  /** Remaining daily QCM allowance, or null when unlimited. */
  mcqRemaining?: number | null
  /** Whether the student's plan includes examens blancs. */
  canExamensBlancs?: boolean
}) {
  const outOfQuota = mcqRemaining === 0
  const openUpgrade = (plan?: string) =>
    window.open(whatsappUpgradeUrl(plan), '_blank', 'noopener,noreferrer')
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<PracticeMode | null>(null)
  const [type, setType] = useState<SessionType | null>(null)
  const [matiere, setMatiere] = useState<string | null>(null) // module name or ALL
  const [examFilter, setExamFilter] = useState<{ year?: number; exam_blanc?: string } | null>(null)
  const [order, setOrder] = useState<string[]>([]) // chosen matière order for "Les 4"

  // Quick-review sessions (favoris / erreurs) — always in Apprentissage mode.
  async function startReview(
    load: () => Promise<PracticeQuestion[]>,
    emptyMsg: string
  ) {
    if (quotaBlocked()) return
    setLoading(true)
    const qs = await load()
    setLoading(false)
    if (qs.length === 0) {
      toast.error(emptyMsg)
      return
    }
    usePracticeStore.getState().start('apprentissage', qs)
    setMode('apprentissage')
    setStarted(true)
  }
  const startFavoris = () => startReview(getBookmarkedQuestions, 'Aucun favori disponible.')
  const startErreurs = () => startReview(getMistakeQuestions, 'Aucune erreur à réviser.')

  useEffect(() => {
    if (autoFavoris) startFavoris()
    else if (autoErreurs) startErreurs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFavoris, autoErreurs])

  function back() {
    setStep((s) => Math.max(0, s - 1))
  }

  /** True (and prompts an upgrade) when the daily QCM quota is exhausted. */
  function quotaBlocked(): boolean {
    if (outOfQuota) {
      toast.error('Tu as atteint ta limite de QCM du jour. Passe à un plan supérieur pour continuer.')
      return true
    }
    return false
  }

  function exit() {
    usePracticeStore.getState().reset()
    setStarted(false)
    setStep(0)
    setMode(null)
    setType(null)
    setMatiere(null)
    setExamFilter(null)
    setOrder([])
  }

  async function startSession(filter: PracticeFilter) {
    if (!mode) return
    if (quotaBlocked()) return
    setLoading(true)
    const qs = await getPracticeQuestions(filter)
    setLoading(false)
    if (qs.length === 0) {
      toast.error('Aucune question disponible pour cette sélection.')
      return
    }
    // Année / examen blanc = a timed exam simulation → count-up stopwatch.
    usePracticeStore.getState().start(mode, qs, !!(filter.year || filter.exam_blanc))
    setStarted(true)
  }

  // "Les 4 matières" for a year / examen blanc, played in the chosen matière order.
  async function startExamSession() {
    if (!mode || !examFilter) return
    if (quotaBlocked()) return
    setLoading(true)
    const qs = await getExamSession(examFilter, order)
    setLoading(false)
    if (qs.length === 0) {
      toast.error('Aucune question disponible pour cette sélection.')
      return
    }
    usePracticeStore.getState().start(mode, qs, true)
    setStarted(true)
  }

  function toggleOrder(m: string) {
    setOrder((o) => (o.includes(m) ? o.filter((x) => x !== m) : [...o, m]))
  }

  // One-tap 10-question series targeting the student's mistakes in a matière.
  async function startQuickSeries(module: string) {
    if (!mode) return
    if (quotaBlocked()) return
    setLoading(true)
    const qs = await getMatiereQuickSeries(module)
    setLoading(false)
    if (qs.length === 0) {
      toast.error('Aucune question disponible pour cette matière.')
      return
    }
    usePracticeStore.getState().start(mode, qs)
    setStarted(true)
  }

  if (started) return <PracticeRunner onExit={exit} />

  // Derived option lists, filtered by the chosen matière.
  const moduleMatch = (f: PracticeFacet) => matiere === ALL || f.module === matiere
  const years = distinct(facets.filter(moduleMatch).map((f) => f.year)).sort((a, b) => b - a)
  const cours = distinct(facets.filter((f) => f.module === matiere).map((f) => f.subject)).sort()
  const examens = distinct(facets.filter(moduleMatch).map((f) => f.exam_blanc)).sort()

  const modeFilter = (): { module: string | null } => ({ module: matiere === ALL ? null : matiere })

  // Matières that actually have questions for the chosen year / examen blanc.
  const examMatieres = examFilter
    ? MODULES.filter((m) =>
        facets.some(
          (f) =>
            f.module === m &&
            (examFilter.year ? f.year === examFilter.year : f.exam_blanc === examFilter.exam_blanc)
        )
      )
    : []

  return (
    <div>
      {step === 0 ? (
        <ScreenHeader title="S'entraîner" />
      ) : (
        <div className="flex items-center" style={{ padding: '40px 20px 14px', gap: 10 }}>
          <button type="button" onClick={back} className="flex" style={{ color: 'var(--gray-600)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
            {step === 1 ? 'Type de session' : step === 2 ? 'Matière' : step === 4 ? 'Ordre des matières' : 'Choisir'}
          </h1>
        </div>
      )}

      <div style={{ padding: '0 20px' }} className="flex flex-col">
        {facets.length === 0 ? (
          <div
            className="flex flex-col items-center text-center"
            style={{ padding: '48px 20px', border: '0.5px solid var(--gray-200)', borderRadius: 16, gap: 8 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>Aucun QCM disponible</div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)', maxWidth: 260 }}>
              Les questions apparaîtront ici une fois publiées.
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {/* Step 0 — mode */}
            {step === 0 && (
              <>
                {mcqRemaining !== null &&
                  (outOfQuota ? (
                    <button
                      type="button"
                      onClick={() => openUpgrade('Premium')}
                      className="flex items-center w-full text-left"
                      style={{
                        gap: 12,
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: 'var(--reward-50, #FFF7E6)',
                        border: '0.5px solid var(--reward-500, #FFB020)',
                      }}
                    >
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--reward-500, #FFB020)', color: '#fff', fontSize: 18 }}
                      >
                        🔥
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gray-900)' }}>
                          Bravo, tu as fini tes QCM du jour !
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                          Les abonnés Premium ne s’arrêtent jamais — QCM illimités pour {pricePhrase('premium')}.
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--gray-400)" />
                    </button>
                  ) : (
                    <div
                      className="flex items-center justify-center"
                      style={{ gap: 6, padding: '8px 0', fontSize: 12, color: 'var(--gray-500)' }}
                    >
                      Il te reste {mcqRemaining} QCM aujourd&apos;hui
                    </div>
                  ))}
                <Tile
                  icon={<GraduationCap size={22} />}
                  title="Apprentissage"
                  subtitle="Correction après chaque question"
                  onClick={() => {
                    setMode('apprentissage')
                    setStep(1)
                  }}
                />
                <Tile
                  icon={<Zap size={22} />}
                  title="Entraînement"
                  subtitle="Correction à la fin de la série"
                  onClick={() => {
                    setMode('entrainement')
                    setStep(1)
                  }}
                />
                {mistakeCount > 0 && (
                  <Tile
                    icon={<RotateCcw size={22} />}
                    title="Mes erreurs"
                    subtitle={`${mistakeCount} question${mistakeCount > 1 ? 's' : ''} à revoir`}
                    onClick={startErreurs}
                  />
                )}
                {bookmarkCount > 0 && (
                  <Tile
                    icon={<Bookmark size={22} />}
                    title="Mes favoris"
                    subtitle={`${bookmarkCount} question${bookmarkCount > 1 ? 's' : ''} à réviser`}
                    onClick={startFavoris}
                  />
                )}
              </>
            )}

            {/* Step 1 — type */}
            {step === 1 && (
              <>
                <Tile icon={<Calendar size={22} />} title="Par année" onClick={() => { setType('annees'); setMatiere(initialModule ?? null); setStep(2) }} />
                <Tile icon={<BookText size={22} />} title="Par chapitre" onClick={() => { setType('cours'); setMatiere(initialModule ?? null); setStep(2) }} />
                {canExamensBlancs ? (
                  <Tile icon={<ClipboardList size={22} />} title="Examens blancs" onClick={() => { setType('examens'); setMatiere(initialModule ?? null); setStep(2) }} />
                ) : (
                  <button
                    type="button"
                    onClick={() => openUpgrade('Basic')}
                    className="flex items-center w-full text-left"
                    style={{ gap: 14, padding: '16px', borderRadius: 16, border: '0.5px solid var(--gray-200)', background: 'var(--gray-50)' }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--gray-100)', color: 'var(--gray-400)' }}
                    >
                      <ClipboardList size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>Examens blancs</span>
                        <span
                          className="inline-flex items-center"
                          style={{ gap: 3, padding: '2px 7px', borderRadius: 9999, fontSize: 10.5, fontWeight: 600, background: 'var(--primary-50)', color: 'var(--primary-600)' }}
                        >
                          <Lock size={10} /> Basic
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                        Débloque les examens blancs avec un abonnement
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--gray-400)" />
                  </button>
                )}
              </>
            )}

            {/* Step 2 — matière (Cours = single only) */}
            {step === 2 && (
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {MODULES.map((m) => {
                  const theme = MODULE_THEME[m] ?? MODULE_THEME.Mathématiques
                  const Icon = theme.icon
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMatiere(m); setStep(3) }}
                      style={{ borderRadius: 18, background: theme.bg, padding: 16, textAlign: 'left' }}
                    >
                      <span className="flex items-center justify-center" style={{ width: 42, height: 42, borderRadius: 13, background: theme.color, color: '#fff' }}>
                        <Icon size={21} />
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginTop: 12 }}>{m}</div>
                    </button>
                  )
                })}
                {type !== 'cours' && (
                  <button
                    type="button"
                    onClick={() => { setMatiere(ALL); setStep(3) }}
                    className="flex flex-col items-center justify-center font-bold"
                    style={{ gridColumn: '1 / -1', borderRadius: 18, background: 'var(--grad-primary)', padding: 16, color: '#fff', fontSize: 14 }}
                  >
                    Les 4 matières
                  </button>
                )}
              </div>
            )}

            {/* Step 3 — item */}
            {step === 3 && (
              <>
                {type === 'annees' &&
                  (years.length === 0 ? (
                    <EmptyItems />
                  ) : (
                    years.map((y) => (
                      <Tile
                        key={y}
                        icon={<Calendar size={20} />}
                        title={`Année ${y}`}
                        onClick={() => {
                          if (matiere === ALL) {
                            setExamFilter({ year: y })
                            setOrder([])
                            setStep(4)
                          } else startSession({ ...modeFilter(), year: y })
                        }}
                      />
                    ))
                  ))}
                {type === 'cours' && (
                  <>
                    <button
                      type="button"
                      onClick={() => matiere && matiere !== ALL && startQuickSeries(matiere)}
                      className="flex items-center text-left"
                      style={{ gap: 14, padding: 16, borderRadius: 18, background: 'var(--grad-primary)', color: '#fff' }}
                    >
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)' }}>
                        <Flame size={22} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>Série rapide 🔥</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                          10 questions ciblées sur tes erreurs{matiere && matiere !== ALL ? ` en ${matiere}` : ''}
                        </div>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                    {cours.length === 0 ? (
                      <EmptyItems />
                    ) : (
                      cours.map((c) => (
                        <Tile key={c} icon={<BookText size={20} />} title={c} onClick={() => startSession({ module: matiere, subject: c })} />
                      ))
                    )}
                  </>
                )}
                {type === 'examens' &&
                  (examens.length === 0 ? (
                    <EmptyItems />
                  ) : (
                    examens.map((x) => (
                      <Tile
                        key={x}
                        icon={<ClipboardList size={20} />}
                        title={x}
                        onClick={() => {
                          if (matiere === ALL) {
                            setExamFilter({ exam_blanc: x })
                            setOrder([])
                            setStep(4)
                          } else startSession({ ...modeFilter(), exam_blanc: x })
                        }}
                      />
                    ))
                  ))}
              </>
            )}

            {/* Step 4 — matière order (only for "Les 4 matières" of a year / examen blanc) */}
            {step === 4 && examFilter && (
              <>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 2 }}>
                  Touche les matières dans l&apos;ordre où tu veux les faire.
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {examMatieres.map((m) => {
                    const theme = MODULE_THEME[m] ?? MODULE_THEME.Mathématiques
                    const Icon = theme.icon
                    const pos = order.indexOf(m)
                    const isSel = pos >= 0
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleOrder(m)}
                        style={{ position: 'relative', borderRadius: 18, background: theme.bg, padding: 16, textAlign: 'left', border: isSel ? `1.5px solid ${theme.color}` : '1.5px solid transparent' }}
                      >
                        <span className="flex items-center justify-center" style={{ width: 42, height: 42, borderRadius: 13, background: theme.color, color: '#fff' }}>
                          <Icon size={21} />
                        </span>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginTop: 12 }}>{m}</div>
                        {isSel && (
                          <span
                            className="flex items-center justify-center font-bold"
                            style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 9999, background: theme.color, color: '#fff', fontSize: 12 }}
                          >
                            {pos + 1}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={startExamSession}
                  className="flex items-center justify-center w-full font-bold text-white"
                  style={{ marginTop: 8, height: 50, borderRadius: 9999, background: 'var(--grad-primary)', gap: 6 }}
                >
                  Commencer
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center" style={{ padding: '24px 0', color: 'var(--primary-500)' }}>
            <Loader2 size={22} className="mp-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyItems() {
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
      Rien de disponible pour cette matière.
    </div>
  )
}
