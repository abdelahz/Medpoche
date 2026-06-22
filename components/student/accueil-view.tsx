import Link from 'next/link'
import { Flame, Zap, Target, ArrowRight, RotateCcw, Bookmark, MessageSquare, Award, Lock, Trophy, Crown, Video } from 'lucide-react'
import type { Badge } from '@/lib/gamification'
import type { LeaderboardRow, Plan } from '@/types'
import { whatsappUpgradeUrl, whatsappMentorUrl } from '@/lib/upgrade'
import { PLAN_DISPLAY, PLAN_PRICE, PLAN_PRICE_ORIGINAL, isOnPromo } from '@/lib/plans'
import { daysUntilConcours } from '@/lib/exam'
import { MODULE_THEME, StudentAvatar, ScreenHeader, ProgressBar, initialsOf } from './primitives'
import { BookProfessor } from './book-professor'

export interface AccueilViewProps {
  firstName: string
  fullName: string | null
  plan: Plan
  streak: number
  level: number
  xp: number
  xpInLevel: number
  xpToNext: number
  accuracy: number
  todayCount: number
  dailyGoal: number
  recommendModule: string | null
  modules: { name: string; pct: number | null; ready: number }[]
  mistakeCount: number
  bookmarkCount: number
  badges: Badge[]
  leaderboard: { top: LeaderboardRow[]; myRank: number | null; myXp: number }
}

function TintStat({
  icon,
  label,
  value,
  bg,
  color,
  children,
}: {
  icon: React.ReactNode
  label: string
  value: string
  bg: string
  color: string
  children?: React.ReactNode
}) {
  return (
    <div style={{ borderRadius: 16, background: bg, padding: '16px 18px' }}>
      <div className="flex items-center" style={{ gap: 7, color, fontSize: 12, fontWeight: 600 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', marginTop: 6 }}>{value}</div>
      {children}
    </div>
  )
}

function QuickAction({ href, icon, label, count, bg, color, locked }: { href: string; icon: React.ReactNode; label: string; count?: number; bg: string; color: string; locked?: boolean }) {
  return (
    <Link href={href} className="flex flex-col" style={{ position: 'relative', gap: 9, padding: 14, borderRadius: 16, border: '0.5px solid var(--gray-200)', background: '#fff' }}>
      <span className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: bg, color }}>
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>{label}</span>
      {locked ? (
        <span className="inline-flex items-center" style={{ gap: 3, fontSize: 10.5, fontWeight: 600, color: 'var(--primary-600)' }}>
          <Lock size={11} /> Basic
        </span>
      ) : (
        count !== undefined && <span style={{ fontSize: 11, color: 'var(--gray-600)' }}>{count} en attente</span>
      )}
    </Link>
  )
}

/**
 * Per-plan upsell copy for the home banner (premium hides it). Outcome/emotion
 * led — the medical-student mentor is the hook. Free users are pushed to
 * Premium with Basic offered as a cheaper on-ramp.
 */
const UPSELL: Partial<
  Record<Plan, { target: Plan; title: string; sub: string; secondary?: { target: Plan } }>
> = {
  gratuit: {
    target: 'premium',
    title: 'Ne révise pas seul 🎓',
    sub: 'Un étudiant en médecine t’accompagne chaque semaine, avec QCM, IA et examens blancs en illimité.',
    secondary: { target: 'basic' },
  },
  basic: {
    target: 'premium',
    title: 'Passe à Premium 👑',
    sub: 'QCM et IA illimités, photos sans limite, et un appel chaque semaine avec un étudiant en médecine.',
  },
}

/** Mentor-call card copy for paying plans. */
const MENTOR: Partial<Record<Plan, { sub: string }>> = {
  basic: { sub: 'Conseils et réponses à tes questions sur le concours.' },
  premium: { sub: 'Ton rendez-vous hebdomadaire d’accompagnement.' },
}

export function AccueilView(p: AccueilViewProps) {
  const goalPct = Math.min(100, Math.round((p.todayCount / p.dailyGoal) * 100))
  const continueHref = p.recommendModule
    ? `/student/entrainement?module=${encodeURIComponent(p.recommendModule)}`
    : '/student/entrainement'
  const upsell = UPSELL[p.plan]
  const mentor = MENTOR[p.plan]

  return (
    <div className="w-full lg:mx-auto lg:max-w-[1040px]">
      <ScreenHeader
        eyebrow={`Bonjour ${p.firstName} 👋`}
        title="Accueil"
        right={
          <Link href="/student/profil" aria-label="Mon profil">
            <StudentAvatar initials={initialsOf(p.fullName)} size={40} />
          </Link>
        }
      />

      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero — gradient, daily goal + streak + the one big CTA */}
        <div style={{ borderRadius: 22, padding: '20px 22px', background: 'var(--grad-primary)', color: '#fff' }}>
          {daysUntilConcours() > 0 && (
            <div
              className="inline-flex items-center"
              style={{ gap: 6, marginBottom: 14, padding: '5px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.18)', fontSize: 12, fontWeight: 600 }}
            >
              🎯 J-{daysUntilConcours()} avant le concours
            </div>
          )}
          <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Objectif du jour</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 2, lineHeight: 1 }}>
                {p.todayCount}<span style={{ opacity: 0.7, fontSize: 18 }}> / {p.dailyGoal}</span>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 6, background: '#fff', borderRadius: 9999, padding: '6px 13px', fontSize: 15, fontWeight: 700, color: 'var(--reward-600)' }}>
              <Flame size={17} />
              {p.streak}
            </div>
          </div>
          <div style={{ height: 9, borderRadius: 9999, background: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${goalPct}%`, borderRadius: 9999, background: '#fff', transition: 'width 400ms ease' }} />
          </div>
          <Link
            href={continueHref}
            className="flex items-center justify-center font-bold"
            style={{ gap: 8, marginTop: 18, padding: '14px 18px', borderRadius: 9999, background: '#fff', color: 'var(--primary-600)', fontSize: 15 }}
          >
            {p.todayCount > 0 ? 'Continuer' : 'Commencer à réviser'}
            {p.recommendModule ? ` · ${p.recommendModule}` : ''}
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Upsell — non-premium only, opens WhatsApp to upgrade */}
        {upsell && (
          <div style={{ borderRadius: 18, background: 'var(--accent-50)', border: '0.5px solid var(--accent-50)', overflow: 'hidden' }}>
            <a
              href={whatsappUpgradeUrl(PLAN_DISPLAY[upsell.target].label)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
              style={{ gap: 13, padding: '15px 17px', textDecoration: 'none' }}
            >
              <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--grad-accent)', color: '#fff' }}>
                <Crown size={21} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="block" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{upsell.title}</span>
                <span className="block" style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{upsell.sub}</span>
                <span className="inline-flex items-center" style={{ marginTop: 8, gap: 5, padding: '3px 9px', borderRadius: 9999, background: 'var(--grad-accent)', color: '#fff', fontSize: 11.5, fontWeight: 700 }}>
                  {PLAN_DISPLAY[upsell.target].label} ·{' '}
                  {isOnPromo(upsell.target) && (
                    <span style={{ textDecoration: 'line-through', opacity: 0.7, fontWeight: 600 }}>{PLAN_PRICE_ORIGINAL[upsell.target]}</span>
                  )}{' '}
                  {PLAN_PRICE[upsell.target]} DH/mois
                </span>
                {daysUntilConcours() > 0 && (
                  <span className="block" style={{ fontSize: 11, color: 'var(--accent-600)', fontWeight: 600, marginTop: 6 }}>
                    Plus que {daysUntilConcours()} jours avant le concours — chaque jour compte.
                  </span>
                )}
              </span>
              <ArrowRight size={18} color="var(--accent-600)" style={{ flexShrink: 0 }} />
            </a>
            {upsell.secondary && (
              <a
                href={whatsappUpgradeUrl(PLAN_DISPLAY[upsell.secondary.target].label)}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center"
                style={{ padding: '9px 12px', borderTop: '0.5px solid rgba(124,92,255,0.15)', fontSize: 12, fontWeight: 600, color: 'var(--accent-600)', textDecoration: 'none' }}
              >
                ou commence avec {PLAN_DISPLAY[upsell.secondary.target].label} à {PLAN_PRICE[upsell.secondary.target]} DH/mois
              </a>
            )}
          </div>
        )}

        {/* Mentor call — paying plans book their call with a medical student */}
        {mentor && (
          <a
            href={whatsappMentorUrl(p.plan === 'premium' ? 'Premium' : 'Basic')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
            style={{ gap: 13, padding: '15px 17px', borderRadius: 18, background: '#fff', border: '0.5px solid var(--gray-200)', textDecoration: 'none' }}
          >
            <span className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
              <Video size={20} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="block" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>
                Réserve ton appel avec un étudiant en médecine 🎓
              </span>
              <span className="block" style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{mentor.sub}</span>
            </span>
            <ArrowRight size={18} color="var(--primary-500)" style={{ flexShrink: 0 }} />
          </a>
        )}

        {/* Private professor session (à la carte, all students) */}
        <BookProfessor />

        {/* Level + accuracy — colorful tinted cards */}
        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          <TintStat icon={<Zap size={14} />} label="Niveau" value={`Niveau ${p.level}`} bg="var(--accent-50)" color="var(--accent-600)">
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={Math.round((p.xpInLevel / p.xpToNext) * 100)} color="var(--accent-500)" track="rgba(124,92,255,0.18)" />
              <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 6 }}>
                {p.xp} XP · plus que {p.xpToNext - p.xpInLevel} XP
              </div>
            </div>
          </TintStat>
          <TintStat icon={<Target size={14} />} label="Précision" value={`${p.accuracy}%`} bg="var(--success-bg)" color="var(--success-text)" />
        </div>

        {/* Classement de la semaine */}
        <Link href="/student/classement" style={{ borderRadius: 16, border: '0.5px solid var(--gray-200)', background: '#fff', padding: '16px 18px', display: 'block' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <span className="inline-flex items-center" style={{ gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--gray-900)' }}>
              <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--reward-50)', color: 'var(--reward-600)' }}>
                <Trophy size={16} />
              </span>
              Classement de la semaine
            </span>
            <span className="inline-flex items-center" style={{ gap: 4, fontSize: 12, color: 'var(--primary-600)' }}>
              Voir tout <ArrowRight size={14} />
            </span>
          </div>
          {p.leaderboard.top.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>Sois le premier à marquer des points cette semaine 🏆</div>
          ) : (
            <div className="flex flex-col" style={{ gap: 8 }}>
              {p.leaderboard.top.map((r, i) => (
                <div key={r.user_id} className="flex items-center" style={{ gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{['🥇', '🥈', '🥉'][i] ?? r.rank}</span>
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, color: 'var(--gray-900)', minWidth: 0 }}>
                    {r.display}
                  </span>
                  <span className="inline-flex items-center font-semibold" style={{ gap: 4, fontSize: 12, color: 'var(--accent-600)' }}>
                    <Zap size={13} />
                    {r.xp}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 4, paddingTop: 10, borderTop: '0.5px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-600)' }}>
                {p.leaderboard.myRank
                  ? `Ta place : #${p.leaderboard.myRank} · ${p.leaderboard.myXp} XP cette semaine`
                  : 'Réponds à des QCM pour entrer au classement.'}
              </div>
            </div>
          )}
        </Link>

        {/* Matières — playful per-module tinted cards */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 12px' }}>Tes matières</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
            {p.modules.map((m) => {
              const theme = MODULE_THEME[m.name] ?? MODULE_THEME.Mathématiques
              const Icon = theme.icon
              return (
                <Link
                  key={m.name}
                  href={`/student/entrainement?module=${encodeURIComponent(m.name)}`}
                  style={{ borderRadius: 18, background: theme.bg, padding: 16 }}
                >
                  <span className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 13, background: theme.color, color: '#fff' }}>
                    <Icon size={22} />
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', marginTop: 12 }}>{m.name}</div>
                  {m.pct !== null ? (
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar value={m.pct} color={theme.color} track="rgba(255,255,255,0.7)" />
                      <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 6 }}>{m.pct}% de maîtrise</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--gray-600)', marginTop: 6 }}>
                      {m.ready} QCM{m.ready > 1 ? 's' : ''} · à découvrir
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick actions — colorful */}
        <div className="grid grid-cols-3" style={{ gap: 12 }}>
          <QuickAction href="/student/entrainement?erreurs=1" icon={<RotateCcw size={18} />} label="Mes erreurs" count={p.mistakeCount} bg="var(--danger-bg)" color="var(--danger-text)" />
          <QuickAction href="/student/entrainement?favoris=1" icon={<Bookmark size={18} />} label="Favoris" count={p.bookmarkCount} bg="var(--reward-50)" color="var(--reward-600)" />
          <QuickAction href="/student/ia" icon={<MessageSquare size={18} />} label="Assistant IA" bg="var(--accent-50)" color="var(--accent-600)" locked={p.plan === 'gratuit'} />
        </div>

        {/* Badges */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 12px' }}>Récompenses</h2>
          <div className="flex" style={{ gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {p.badges.map((b) => (
              <div
                key={b.key}
                className={`flex flex-col items-center text-center flex-shrink-0 ${b.earned ? 'mp-pop' : ''}`}
                style={{ width: 96, gap: 8, padding: '15px 8px', borderRadius: 16, border: b.earned ? 'none' : '0.5px solid var(--gray-200)', background: b.earned ? 'var(--grad-reward)' : '#fff' }}
              >
                <span className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 9999, background: b.earned ? 'rgba(255,255,255,0.3)' : 'var(--gray-100)', color: b.earned ? '#fff' : 'var(--gray-400)' }}>
                  {b.earned ? <Award size={20} /> : <Lock size={16} />}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: b.earned ? '#fff' : 'var(--gray-600)', lineHeight: 1.25 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
