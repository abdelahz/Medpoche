'use client'

import { useRef, useState, useEffect } from 'react'
import { Check, X, Loader2, RotateCcw, Bookmark, Zap, Flame, Target, TrendingUp, ChevronDown, Clock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { usePracticeStore } from '@/lib/store/practice'
import { recordAttempt, getSessionWrapup, type SessionWrapup } from '@/app/actions/practice'
import { toggleBookmark } from '@/app/actions/bookmarks'
import { explainMcq } from '@/app/actions/explain'
import { MCQRenderer } from '@/components/shared/mcq-renderer'
import { ReportButton } from '@/components/shared/report-button'
import { DAILY_GOAL, levelFromXp } from '@/lib/gamification'
import type { PracticeQuestion } from '@/types'
import { MODULE_THEME } from './primitives'

type OptKey = 'A' | 'B' | 'C' | 'D' | 'E'

/** Per-question AI explanation state (lazily fetched + cached server-side). */
type AiExplainState = { loading: boolean; text?: string; error?: string }

/**
 * "Explique avec l'IA": a button that fetches an AI explanation for the QCM
 * (generated once, then cached in the DB) and renders it inline. Shows the
 * trigger, a loading state, or the resulting explanation.
 */
function AiExplain({ state, onClick, subtle = false }: { state?: AiExplainState; onClick: () => void; subtle?: boolean }) {
  if (state?.text) {
    return (
      <div style={{ marginTop: subtle ? 12 : 0, marginBottom: subtle ? 0 : 10, padding: '12px 14px', borderRadius: 12, background: 'var(--accent-50)', border: '0.5px solid var(--accent-50)' }}>
        <div className="flex items-center" style={{ gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-600)' }}>
          <Sparkles size={13} /> Explication de l&apos;IA
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray-900)' }}>
          <MCQRenderer text={state.text} />
        </div>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state?.loading}
      className="inline-flex items-center justify-center font-bold"
      style={{
        gap: 7,
        height: subtle ? 38 : 44,
        width: '100%',
        borderRadius: 9999,
        marginTop: subtle ? 0 : undefined,
        marginBottom: subtle ? 0 : 10,
        background: '#fff',
        border: '1px solid var(--accent-500)',
        color: 'var(--accent-600)',
        fontSize: 13,
        cursor: state?.loading ? 'default' : 'pointer',
      }}
    >
      {state?.loading ? (
        <>
          <Loader2 size={15} className="mp-spin" /> Génération…
        </>
      ) : (
        <>
          <Sparkles size={15} /> Explique avec l&apos;IA
        </>
      )}
    </button>
  )
}

/** Duolingo-style feedback panel shown after validating (Apprentissage mode). */
function FeedbackBar({
  correct,
  answer,
  explanation,
  combo,
  onContinue,
  onExplain,
  aiState,
  label,
}: {
  correct: boolean
  answer: string
  explanation: string | null
  combo: number
  onContinue: () => void
  onExplain: () => void
  aiState?: AiExplainState
  label: string
}) {
  return (
    <div
      className="mp-pop"
      style={{
        marginTop: 20,
        borderRadius: 18,
        padding: '16px 18px',
        background: correct ? 'var(--success-bg)' : 'var(--danger-bg)',
        border: `1px solid ${correct ? 'var(--success-border)' : 'var(--danger-border)'}`,
      }}
    >
      <div className="flex items-center" style={{ gap: 11, marginBottom: explanation ? 12 : 14 }}>
        <span
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 34, height: 34, borderRadius: 9999, background: correct ? 'var(--success-solid)' : 'var(--danger-solid)', color: '#fff' }}
        >
          {correct ? <Check size={18} /> : <X size={18} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: correct ? 'var(--success-text)' : 'var(--danger-text)' }}>
            {correct ? 'Bonne réponse !' : `Pas tout à fait — la bonne réponse est ${answer}.`}
          </div>
          {correct && (
            <div className="flex items-center" style={{ gap: 10, marginTop: 3, fontSize: 12, fontWeight: 700 }}>
              <span className="inline-flex items-center" style={{ gap: 4, color: 'var(--success-text)' }}>
                <Zap size={13} />+10 XP
              </span>
              {combo >= 2 && (
                <span className="inline-flex items-center" style={{ gap: 4, color: 'var(--reward-600)' }}>
                  <Flame size={13} />
                  {combo} d&apos;affilée
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {explanation && (
        <div style={{ fontSize: 13, color: 'var(--gray-900)', marginBottom: 14 }}>
          <MCQRenderer text={explanation} />
        </div>
      )}
      <AiExplain state={aiState} onClick={onExplain} />
      <button
        type="button"
        onClick={onContinue}
        className="flex items-center justify-center w-full font-bold text-white"
        style={{ height: 48, borderRadius: 9999, background: correct ? 'var(--success-solid)' : 'var(--grad-primary)' }}
      >
        {label}
      </button>
    </div>
  )
}

const CONFETTI_COLORS = ['#3B6BE8', '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B']

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden style={{ overflow: 'hidden' }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="mp-confetti-piece"
          style={{
            left: `${(i / 16) * 100 + Math.random() * 4}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${Math.random() * 250}ms`,
          }}
        />
      ))}
    </div>
  )
}

/** Ease-out count-up animation for the session XP — the little reward roll. */
function CountUp({ to, durationMs = 900 }: { to: number; durationMs?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (to <= 0) {
      setN(0)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      setN(Math.round(to * (1 - Math.pow(1 - p, 3)))) // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, durationMs])
  return <>{n}</>
}

/** Daily-goal progress ring (fills on mount). Amber once the goal is reached. */
function GoalRing({ value, goal }: { value: number; goal: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])
  const r = 34
  const c = 2 * Math.PI * r
  const pct = Math.min(1, goal > 0 ? value / goal : 0)
  const reached = value >= goal
  return (
    <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
      <svg width={84} height={84}>
        <circle cx={42} cy={42} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={8} />
        <circle
          cx={42}
          cy={42}
          r={r}
          fill="none"
          stroke={reached ? 'var(--reward-500)' : 'var(--primary-500)'}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={mounted ? c * (1 - pct) : c}
          transform="rotate(-90 42 42)"
          style={{ transition: 'stroke-dashoffset 900ms ease' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center" style={{ position: 'absolute', inset: 0 }}>
        <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--gray-900)' }}>{Math.min(value, goal)}</span>
        <span style={{ fontSize: 10, color: 'var(--gray-500)' }}>/{goal}</span>
      </div>
    </div>
  )
}

/** Count-up duration as m:ss (no countdown). */
function fmtTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function celebration(pct: number): { title: string; emoji: string } {
  if (pct >= 90) return { title: 'Excellent !', emoji: '🎉' }
  if (pct >= 70) return { title: 'Bien joué !', emoji: '💪' }
  if (pct >= 50) return { title: 'Continue comme ça !', emoji: '👍' }
  return { title: 'On révise et on y retourne', emoji: '📚' }
}

/** One option row in the end-of-session corrigé: green = correct answer, red = the
 *  student's wrong pick, neutral otherwise. */
function ReviewOption({
  letter,
  text,
  state,
}: {
  letter: string
  text: string
  state: 'correct' | 'wrong' | 'neutral'
}) {
  const box =
    state === 'correct'
      ? { border: '1.5px solid var(--success-solid)', background: 'var(--success-bg)' }
      : state === 'wrong'
        ? { border: '1.5px solid var(--danger-solid)', background: 'var(--danger-bg)' }
        : { border: '0.5px solid var(--gray-200)', background: '#fff' }
  const badgeBg =
    state === 'correct' ? 'var(--success-solid)' : state === 'wrong' ? 'var(--danger-solid)' : 'var(--gray-100)'
  return (
    <div className="flex items-start" style={{ gap: 9, padding: '9px 11px', borderRadius: 10, ...box }}>
      <span
        className="flex items-center justify-center flex-shrink-0 font-bold"
        style={{ width: 22, height: 22, borderRadius: 9999, fontSize: 11, marginTop: 1, background: badgeBg, color: state === 'neutral' ? 'var(--gray-600)' : '#fff' }}
      >
        {letter}
      </span>
      <div style={{ fontSize: 13, color: 'var(--gray-900)', minWidth: 0, flex: 1 }}>
        <MCQRenderer text={text} />
      </div>
    </div>
  )
}

export function PracticeRunner({ onExit }: { onExit: () => void }) {
  const { mode, questions, index, answers, revealed, finished, timed, setAnswer, reveal, next } =
    usePracticeStore()
  const [aiExpl, setAiExpl] = useState<Record<number, AiExplainState>>({})

  /** Fetch (and cache server-side) the AI explanation for a QCM, shown inline. */
  async function explainWithAi(question: PracticeQuestion) {
    const cur = aiExpl[question.id]
    if (cur?.text || cur?.loading) return
    setAiExpl((s) => ({ ...s, [question.id]: { loading: true } }))
    const res = await explainMcq(question.id)
    if ('error' in res) {
      setAiExpl((s) => ({ ...s, [question.id]: { loading: false, error: res.error } }))
      toast.error(res.error)
    } else {
      setAiExpl((s) => ({ ...s, [question.id]: { loading: false, text: res.explanation } }))
    }
  }
  const recorded = useRef<Set<number>>(new Set())
  const busy = useRef(false)
  const [marks, setMarks] = useState<Record<number, boolean>>({})
  const [wrapup, setWrapup] = useState<SessionWrapup | null>(null)
  const [openIds, setOpenIds] = useState<Set<number> | null>(null) // corrigé expand state (null = default: wrongs open)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  // Timing (année / examen blanc): count-up total + per-matière attribution.
  const sessionStartRef = useRef(Date.now())
  const segStartRef = useRef(Date.now())
  const perMatiereRef = useRef<Record<string, number>>({})
  const [, forceTick] = useState(0)

  const q = questions[index]

  // Fetch the post-session snapshot (streak, daily count, XP) for the celebration.
  useEffect(() => {
    if (finished) {
      getSessionWrapup()
        .then(setWrapup)
        .catch(() => {})
    }
  }, [finished])

  // Tick the count-up timer once a second while a timed session is running.
  useEffect(() => {
    if (!timed || finished) return
    const t = setInterval(() => forceTick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [timed, finished])

  // ── Results / celebration ──
  if (finished || !q) {
    const total = questions.length
    const correct = questions.filter((x) => answers[x.id] === x.correct).length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const xpGain = correct * 10 + (total - correct) * 4 // matches lib/gamification (correct=10, wrong=4)
    const { title, emoji } = celebration(pct)
    const totalXp = wrapup?.totalXp ?? 0
    const streak = wrapup?.streak ?? 0
    const todayCount = wrapup?.todayCount ?? 0
    // Did this session's XP push the student over a level boundary?
    const leveledUp =
      wrapup != null && levelFromXp(totalXp).level > levelFromXp(Math.max(0, totalXp - xpGain)).level
    const goalReached = wrapup != null && todayCount >= DAILY_GOAL
    // First-ever session: before this one the student had essentially no XP.
    const firstSession = wrapup != null && totalXp <= xpGain
    const party = pct >= 70 || leveledUp || goalReached || firstSession
    // Corrigé: default to opening the wrong ones (where learning happens) until
    // the student toggles anything, then track their explicit choices.
    const reviewOpen =
      openIds ?? new Set(questions.filter((x) => answers[x.id] !== x.correct).map((x) => x.id))
    const allReviewOpen = total > 0 && reviewOpen.size === total
    const toggleReview = (id: number) => {
      const n = new Set(reviewOpen)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      setOpenIds(n)
    }
    const toggleAllReview = () =>
      setOpenIds(allReviewOpen ? new Set<number>() : new Set(questions.map((x) => x.id)))
    // Timing breakdown (timed sessions only).
    const perMatiere = perMatiereRef.current
    const totalMs = Object.values(perMatiere).reduce((a, b) => a + b, 0)
    const matiereOrder = Array.from(
      new Set(questions.map((x) => x.module).filter((m): m is string => !!m))
    )
    return (
      <div style={{ padding: '40px 20px', position: 'relative' }}>
        {party && <Confetti />}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Résultats</h1>

        {leveledUp && (
          <div
            className="flex items-center mp-pop"
            style={{ marginTop: 16, gap: 11, padding: '13px 16px', borderRadius: 16, background: 'var(--grad-accent)', color: '#fff' }}
          >
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 9999, background: 'rgba(255,255,255,0.2)' }}>
              <TrendingUp size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Niveau {levelFromXp(totalXp).level} atteint ! 🚀</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Tu montes en puissance — continue comme ça.</div>
            </div>
          </div>
        )}

        <div
          className="flex flex-col items-center text-center mp-pop"
          style={{ marginTop: 20, padding: '30px 20px', borderRadius: 24, background: 'var(--grad-primary)', color: '#fff' }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{emoji} {title}</div>
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
            {correct} / {total} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap items-center justify-center" style={{ gap: 8, marginTop: 18 }}>
            <span className="inline-flex items-center font-bold" style={{ gap: 5, padding: '6px 13px', borderRadius: 9999, fontSize: 13, background: '#fff', color: 'var(--primary-600)' }}>
              <Zap size={14} />+<CountUp to={xpGain} /> XP
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center font-bold" style={{ gap: 5, padding: '6px 13px', borderRadius: 9999, fontSize: 13, background: '#fff', color: 'var(--reward-600)' }}>
                <Flame size={14} />
                {streak} jour{streak > 1 ? 's' : ''}
              </span>
            )}
            {bestCombo >= 3 && (
              <span className="inline-flex items-center font-bold" style={{ gap: 5, padding: '6px 13px', borderRadius: 9999, fontSize: 13, background: '#fff', color: 'var(--accent-600)' }}>
                <Flame size={14} />
                série {bestCombo}
              </span>
            )}
          </div>
        </div>

        {firstSession && (
          <div
            className="flex items-center mp-pop"
            style={{ marginTop: 16, gap: 11, padding: '14px 16px', borderRadius: 16, background: 'var(--grad-reward)', color: '#fff' }}
          >
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 9999, background: 'rgba(255,255,255,0.25)' }}>
              <Sparkles size={19} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Première série terminée ! 🎉</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>
                Tu viens de te lancer — reviens demain pour démarrer ta série 🔥
              </div>
            </div>
          </div>
        )}

        {wrapup != null && (
          <div
            className="flex items-center"
            style={{ marginTop: 16, gap: 16, padding: '16px 18px', borderRadius: 18, background: '#fff', border: '0.5px solid var(--gray-200)' }}
          >
            <GoalRing value={todayCount} goal={DAILY_GOAL} />
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center" style={{ gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>
                <Target size={16} style={{ color: goalReached ? 'var(--reward-600)' : 'var(--primary-500)' }} />
                Objectif du jour
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
                {goalReached
                  ? 'Objectif atteint ! 🎯 Reviens demain pour garder ta série.'
                  : `Plus que ${DAILY_GOAL - todayCount} QCM aujourd'hui pour atteindre ton objectif.`}
              </div>
            </div>
          </div>
        )}

        {/* Temps — total + per-matière (count-up, timed sessions only) */}
        {timed && totalMs > 0 && (
          <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 18, background: '#fff', border: '0.5px solid var(--gray-200)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>
                <Clock size={16} style={{ color: 'var(--primary-500)' }} />
                Temps total
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtTime(totalMs)}
              </div>
            </div>
            {matiereOrder.length > 1 && (
              <div className="flex flex-col" style={{ gap: 9, marginTop: 12 }}>
                {matiereOrder.map((m) => {
                  const theme = MODULE_THEME[m] ?? null
                  return (
                    <div key={m} className="flex items-center justify-between">
                      <span className="flex items-center" style={{ gap: 8, fontSize: 13, color: 'var(--gray-700)' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 9999, background: theme?.color ?? 'var(--gray-400)' }} />
                        {m}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtTime(perMatiere[m] ?? 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Corrigé — review every question, the right answer, and why */}
        {total > 0 && (
          <>
            <div className="flex items-center justify-between" style={{ marginTop: 24, marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Corrigé</h2>
              <button
                type="button"
                onClick={toggleAllReview}
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-600)', cursor: 'pointer' }}
              >
                {allReviewOpen ? 'Tout replier' : 'Tout déplier'}
              </button>
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {questions.map((x, i) => {
                const studentAns = answers[x.id]
                const ok = studentAns === x.correct
                const open = reviewOpen.has(x.id)
                const reviewOpts: [string, string][] = [
                  ['A', x.option_a],
                  ['B', x.option_b],
                  ['C', x.option_c],
                  ['D', x.option_d],
                  ...(x.option_e ? ([['E', x.option_e]] as [string, string][]) : []),
                ]
                return (
                  <div key={x.id} style={{ borderRadius: 12, border: '0.5px solid var(--gray-200)', overflow: 'hidden', background: '#fff' }}>
                    <button
                      type="button"
                      onClick={() => toggleReview(x.id)}
                      className="flex items-center w-full"
                      style={{ gap: 10, padding: '11px 13px', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{ width: 22, height: 22, borderRadius: 9999, background: ok ? 'var(--success-solid)' : 'var(--danger-solid)', color: '#fff' }}
                      >
                        {ok ? <Check size={13} /> : <X size={13} />}
                      </span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', flex: 1, minWidth: 0 }}>
                        Question {i + 1}{x.module ? ` — ${x.module}` : ''}
                      </span>
                      {!ok && (
                        <span className="flex-shrink-0" style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger-text)' }}>
                          Ta réponse : {studentAns ?? '—'}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        style={{ color: 'var(--gray-400)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
                      />
                    </button>
                    {open && (
                      <div style={{ padding: '0 13px 14px', borderTop: '0.5px solid var(--gray-100)' }}>
                        <div style={{ fontSize: 14, color: 'var(--gray-900)', lineHeight: 1.5, margin: '12px 0' }}>
                          <MCQRenderer text={x.question} />
                        </div>
                        <div className="flex flex-col" style={{ gap: 7 }}>
                          {reviewOpts.map(([letter, text]) => {
                            const isCorrect = letter === x.correct
                            const isWrongPick = letter === studentAns && !isCorrect
                            const state: 'correct' | 'wrong' | 'neutral' = isCorrect
                              ? 'correct'
                              : isWrongPick
                                ? 'wrong'
                                : 'neutral'
                            return <ReviewOption key={letter} letter={letter} text={text} state={state} />
                          })}
                        </div>
                        {x.explanation && (
                          <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 10, background: 'var(--gray-50)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-600)', marginBottom: 6 }}>
                              Explication
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--gray-900)' }}>
                              <MCQRenderer text={x.explanation} />
                            </div>
                          </div>
                        )}
                        <AiExplain subtle state={aiExpl[x.id]} onClick={() => explainWithAi(x)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onExit}
          className="flex items-center justify-center w-full font-bold text-white"
          style={{ marginTop: 24, height: 50, borderRadius: 9999, background: 'var(--grad-primary)', gap: 8 }}
        >
          <RotateCcw size={16} />
          Nouvelle série
        </button>
      </div>
    )
  }

  const opts: { key: OptKey; text: string }[] = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
    ...(q.option_e ? [{ key: 'E' as OptKey, text: q.option_e }] : []),
  ]
  const selected = answers[q.id]

  async function record() {
    if (recorded.current.has(q.id) || !selected) return
    recorded.current.add(q.id)
    const res = await recordAttempt(q.id, selected)
    if ('error' in res) {
      recorded.current.delete(q.id)
      toast.error(res.error)
    }
  }

  async function onPrimary() {
    if (busy.current || !selected) return
    busy.current = true
    if (mode === 'apprentissage' && !revealed) {
      await record()
      const nextCombo = selected === q.correct ? combo + 1 : 0
      setCombo(nextCombo)
      setBestCombo((b) => Math.max(b, nextCombo))
      reveal()
    } else {
      if (mode === 'entrainement') await record()
      // Attribute the time spent on this question to its matière, then advance.
      if (timed && q.module) {
        perMatiereRef.current[q.module] =
          (perMatiereRef.current[q.module] ?? 0) + (Date.now() - segStartRef.current)
      }
      segStartRef.current = Date.now()
      next()
    }
    busy.current = false
  }

  function optionStyle(key: OptKey) {
    const isSel = selected === key
    const isCorrect = q.correct === key
    if (revealed && isCorrect)
      return { border: '1.5px solid var(--success-solid)', background: 'var(--success-bg)' }
    if (revealed && isSel && !isCorrect)
      return { border: '1.5px solid var(--danger-solid)', background: 'var(--danger-bg)' }
    if (isSel) return { border: '1.5px solid var(--primary-500)', background: 'var(--primary-50)' }
    return { border: '0.5px solid var(--gray-200)', background: '#fff' }
  }

  const isBookmarked = marks[q.id] ?? q.bookmarked
  async function onBookmark() {
    const next = !isBookmarked
    setMarks((m) => ({ ...m, [q.id]: next })) // optimistic
    const res = await toggleBookmark(q.id)
    if ('error' in res) {
      setMarks((m) => ({ ...m, [q.id]: !next }))
      toast.error(res.error)
    } else {
      setMarks((m) => ({ ...m, [q.id]: res.bookmarked }))
    }
  }

  const isLast = index === questions.length - 1
  const primaryLabel =
    mode === 'apprentissage' && !revealed ? 'Valider' : isLast ? 'Terminer' : 'Suivant'
  const moduleTheme = q.module ? MODULE_THEME[q.module] ?? null : null
  const showCombo = mode === 'apprentissage' && combo >= 2 // hidden in Entraînement (would leak correctness)

  return (
    <div style={{ padding: '32px 20px 20px' }}>
      {/* Header — quit, progress, combo */}
      <div className="flex items-center" style={{ gap: 12, marginBottom: 12 }}>
        <button
          type="button"
          onClick={onExit}
          aria-label="Quitter la série"
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32, borderRadius: 9999, color: 'var(--gray-400)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>
        <div style={{ flex: 1, height: 10, borderRadius: 9999, background: 'var(--gray-100)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(index / questions.length) * 100}%`,
              borderRadius: 9999,
              background: 'var(--grad-primary)',
              transition: 'width 300ms ease',
            }}
          />
        </div>
        {showCombo && (
          <span className="inline-flex items-center font-bold flex-shrink-0" style={{ gap: 4, fontSize: 14, color: 'var(--reward-600)' }}>
            <Flame size={16} />
            {combo}
          </span>
        )}
        {timed && (
          <span
            className="inline-flex items-center font-bold flex-shrink-0"
            style={{ gap: 4, fontSize: 13, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}
          >
            <Clock size={15} />
            {fmtTime(Date.now() - sessionStartRef.current)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
        <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
          Question {index + 1} / {questions.length}
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          {q.module && moduleTheme && (
            <span
              className="font-medium"
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 9999, background: moduleTheme.bg, color: moduleTheme.color }}
            >
              {q.module}
            </span>
          )}
          <button
            type="button"
            onClick={onBookmark}
            title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="flex"
            style={{ color: isBookmarked ? 'var(--primary-500)' : 'var(--gray-400)', cursor: 'pointer' }}
          >
            <Bookmark size={18} fill={isBookmarked ? 'var(--primary-500)' : 'none'} />
          </button>
          <ReportButton context="mcq" contextId={q.id} label={q.question.slice(0, 160)} size={17} />
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 15, color: 'var(--gray-900)', lineHeight: 1.5, marginBottom: 18 }}>
        <MCQRenderer text={q.question} />
      </div>

      {/* Options */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        {opts.map(({ key, text }) => {
          const isCorrect = q.correct === key
          const isSel = selected === key
          return (
            <button
              key={key}
              type="button"
              disabled={revealed}
              onClick={() => setAnswer(key)}
              className="flex items-center text-left"
              style={{
                gap: 12,
                padding: '13px 14px',
                borderRadius: 16,
                cursor: revealed ? 'default' : 'pointer',
                ...optionStyle(key),
              }}
            >
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    revealed && isCorrect
                      ? 'var(--success-solid)'
                      : revealed && isSel
                      ? 'var(--danger-solid)'
                      : isSel
                      ? 'var(--primary-500)'
                      : 'var(--gray-100)',
                  color: (revealed && (isCorrect || isSel)) || isSel ? '#fff' : 'var(--gray-600)',
                }}
              >
                {revealed && isCorrect ? <Check size={14} /> : revealed && isSel ? <X size={14} /> : key}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--gray-900)' }}>
                <MCQRenderer text={text} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Bottom: feedback bar (after validate) or the validate/next button */}
      {revealed ? (
        <FeedbackBar
          correct={selected === q.correct}
          answer={q.correct}
          explanation={q.explanation}
          combo={combo}
          onContinue={onPrimary}
          onExplain={() => explainWithAi(q)}
          aiState={aiExpl[q.id]}
          label={isLast ? 'Terminer' : 'Continuer'}
        />
      ) : (
        <button
          type="button"
          onClick={onPrimary}
          disabled={!selected}
          className="flex items-center justify-center w-full font-bold text-white"
          style={{
            marginTop: 20,
            height: 50,
            borderRadius: 9999,
            background: selected ? 'var(--grad-primary)' : 'var(--gray-200)',
            gap: 8,
            cursor: selected ? 'pointer' : 'default',
          }}
        >
          {busy.current && <Loader2 size={16} className="mp-spin" />}
          {primaryLabel}
        </button>
      )}
    </div>
  )
}
