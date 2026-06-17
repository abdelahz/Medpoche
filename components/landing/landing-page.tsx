import type { ReactNode } from 'react'
import {
  Flame, Zap, Sparkles, Camera, Target, ClipboardList, BookOpen, Trophy,
  TrendingUp, UserPlus, Check, ArrowRight, GraduationCap, Brain, Star, Crown,
} from 'lucide-react'
import { Container, Eyebrow, Cta, Blob, PhoneMockup, BrandMark } from './primitives'
import { AccueilScreen, QcmScreen, IaScreen } from './mockups'
import { Reveal } from './reveal'
import { Counter } from './counter'
import { LandingNav } from './landing-nav'
import { Faq } from './faq'
import { FreeTrialPopup } from './free-trial-popup'

/**
 * Real app screenshots (optional). Drop a PNG into /public/landing and set its
 * path here to override the in-app mockup in that phone frame.
 *   accueil → hero · qcm → entraînement feature · ia → tuteur feature
 */
const SHOTS: { accueil?: string; qcm?: string; ia?: string } = {
  accueil: undefined,
  qcm: undefined,
  ia: undefined,
}

export function LandingPage() {
  return (
    <main style={{ background: '#fff', color: 'var(--gray-900)', overflowX: 'hidden' }}>
      <LandingNav />
      <Hero />
      <StatsStrip />
      <Features />
      <HowItWorks />
      <Gamification />
      <Pricing />
      <FaqSection />
      <FinalCta />
      <Footer />
      <FreeTrialPopup />
    </main>
  )
}

/* ----------------------------------------------------------------- Hero --- */
function Hero() {
  return (
    <section style={{ position: 'relative', paddingTop: 120, paddingBottom: 80 }}>
      <Blob color="var(--primary-100)" size={460} style={{ top: -80, right: -120 }} />
      <Blob color="var(--accent-50)" size={420} style={{ top: 120, left: -140 }} className="lp-float-slow" />
      <Container>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr', gap: 48 }}>
          <div className="lp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }}>
            {/* Copy */}
            <div>
              <Reveal>
                <Eyebrow>
                  <GraduationCap size={14} /> Concours de médecine · Maroc
                </Eyebrow>
              </Reveal>
              <Reveal delay={80}>
                <h1
                  style={{
                    fontSize: 'clamp(34px, 6vw, 56px)',
                    lineHeight: 1.05,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    margin: '18px 0 0',
                  }}
                >
                  Le concours de médecine,{' '}
                  <span
                    style={{
                      background: 'var(--grad-primary)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    dans ta poche.
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p style={{ fontSize: 'clamp(15px, 2.2vw, 18px)', lineHeight: 1.6, color: 'var(--gray-600)', margin: '20px 0 0', maxWidth: 520 }}>
                  QCM par matière, examens blancs et un tuteur IA qui t&apos;explique tout — même en
                  photo. Entraîne-toi gratuitement, progresse chaque jour, décroche ta place.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="flex items-center" style={{ gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
                  <Cta href="/auth/register" size="lg">
                    Commencer gratuitement <ArrowRight size={18} />
                  </Cta>
                  <Cta href="#comment" variant="ghost" size="lg">
                    Voir comment ça marche
                  </Cta>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="flex items-center" style={{ gap: 8, marginTop: 18, fontSize: 13, color: 'var(--gray-600)' }}>
                  <Check size={15} color="var(--success-text)" />
                  Gratuit · sans carte bancaire · 20 QCM offerts chaque jour
                </div>
              </Reveal>
            </div>

            {/* Mockup */}
            <Reveal delay={200} className="flex justify-center lg:justify-end" style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <FloatingChip style={{ top: 24, left: -28 }} bg="var(--grad-reward)" icon={<Flame size={16} />} label="Série · 12 j" />
                <FloatingChip style={{ bottom: 70, right: -34 }} bg="var(--grad-accent)" icon={<Zap size={16} />} label="+120 XP" delay="1.5s" />
                <div className="lp-float">
                  <PhoneMockup src={SHOTS.accueil} alt="L'accueil de l'application MedenPoche" priority width={290}>
                    <AccueilScreen />
                  </PhoneMockup>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
      {/* widen hero to 2 columns on large screens */}
      <style>{`@media (min-width: 980px){ .lp-hero-grid{ grid-template-columns: 1.05fr 0.95fr !important; } }`}</style>
    </section>
  )
}

function FloatingChip({
  style, bg, icon, label, delay = '0s',
}: { style: React.CSSProperties; bg: string; icon: ReactNode; label: string; delay?: string }) {
  return (
    <div
      className="lp-float hidden sm:flex items-center"
      style={{
        position: 'absolute', zIndex: 3, gap: 8, padding: '9px 14px', borderRadius: 9999,
        background: bg, color: '#fff', fontWeight: 700, fontSize: 13,
        boxShadow: '0 12px 28px rgba(16,24,40,0.18)', animationDelay: delay, ...style,
      }}
    >
      {icon} {label}
    </div>
  )
}

/* ---------------------------------------------------------------- Stats --- */
function StatsStrip() {
  const items = [
    { value: 4, label: 'matières couvertes', suffix: '' },
    { value: 20, label: 'QCM offerts / jour', suffix: '' },
    { value: 2, label: "modes d'entraînement", suffix: '' },
    { value: 24, label: 'tuteur IA disponible', suffix: '/7' },
  ]
  return (
    <section style={{ padding: '8px 0 56px' }}>
      <Container>
        <Reveal>
          <div
            className="grid lp-stats"
            style={{
              gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
              borderRadius: 22, overflow: 'hidden', background: 'var(--gray-200)',
              border: '0.5px solid var(--gray-200)',
            }}
          >
            {items.map((it) => (
              <div key={it.label} className="flex flex-col items-center text-center" style={{ background: '#fff', padding: '26px 14px' }}>
                <div style={{ fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, color: 'var(--primary-600)', lineHeight: 1 }}>
                  <Counter value={it.value} suffix={it.suffix} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--gray-600)', marginTop: 8 }}>{it.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <style>{`@media (min-width: 760px){ .lp-stats{ grid-template-columns: repeat(4, 1fr) !important; } }`}</style>
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------- Features --- */
function Features() {
  return (
    <section id="fonctionnalites" style={{ padding: '64px 0' }}>
      <Container>
        <SectionHead
          eyebrow={<><Sparkles size={14} /> Tout pour réussir</>}
          title="Une méthode complète, pensée pour le concours"
          subtitle="Pas une appli de plus. Un vrai plan d'entraînement : t'exercer, comprendre, et progresser jusqu'au jour J."
        />

        <FeatureRow
          accent="var(--primary-500)"
          tint="var(--primary-50)"
          icon={<Target size={22} />}
          eyebrow="Entraînement"
          title="Entraîne-toi exactement comme au concours"
          points={[
            'QCM par chapitre, par année et examens blancs chronométrés',
            'Deux modes : correction immédiate ou à la fin de la série',
            'Chaque réponse expliquée pour vraiment comprendre',
          ]}
          mockup={SHOTS.qcm}
          mockupAlt="Entraînement QCM dans MedenPoche"
          screen={<QcmScreen />}
        />

        <FeatureRow
          reverse
          accent="var(--accent-500)"
          tint="var(--accent-50)"
          icon={<Brain size={22} />}
          eyebrow="Tuteur IA"
          badge={<><Camera size={13} /> Nouveau · pose ta question en photo</>}
          title="Un tuteur IA rien que pour toi, 24h/24"
          points={[
            "Bloqué·e sur une question ? Prends-la en photo, il te l'explique",
            'Des explications claires, des astuces, des corrections — à ton rythme',
            'Toujours appuyé sur le programme officiel du concours',
          ]}
          mockup={SHOTS.ia}
          mockupAlt="Le tuteur IA de MedenPoche"
          screen={<IaScreen />}
        />

        {/* Secondary feature cards */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: 16, marginTop: 24 }}>
          <div className="lp-feature-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }}>
            <FeatureCard
              icon={<BookOpen size={22} />} accent="#0EA5E9" tint="#E6F6FE"
              title="Bibliothèque complète"
              text="Cours, résumés, fiches et annales corrigées — tout le programme réuni au même endroit."
            />
            <FeatureCard
              icon={<ClipboardList size={22} />} accent="var(--reward-600)" tint="var(--reward-50)"
              title="Examens blancs"
              text="Mets-toi en conditions réelles : chronomètre, 4 matières, et un débrief de tes erreurs."
            />
            <FeatureCard
              icon={<Trophy size={22} />} accent="var(--module-svt)" tint="#E7F8F1"
              title="Progresse en jouant"
              text="Séries quotidiennes, XP, niveaux et classement hebdomadaire. Réviser devient addictif."
            />
          </div>
        </div>
        <style>{`@media (min-width: 860px){ .lp-feature-cards{ grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
      </Container>
    </section>
  )
}

function FeatureRow({
  reverse, accent, tint, icon, eyebrow, title, points, mockup, mockupAlt, badge, screen,
}: {
  reverse?: boolean
  accent: string
  tint: string
  icon: ReactNode
  eyebrow: string
  title: string
  points: string[]
  mockup?: string
  mockupAlt: string
  badge?: ReactNode
  screen?: ReactNode
}) {
  return (
    <Reveal>
      <div
        className="lp-feature-row"
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 36, alignItems: 'center', padding: '36px 0' }}
      >
        <div style={{ order: reverse ? 2 : 1 }}>
          <div className="flex items-center" style={{ gap: 10, marginBottom: 16 }}>
            <span className="flex items-center justify-center" style={{ width: 46, height: 46, borderRadius: 14, background: tint, color: accent }}>
              {icon}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: accent }}>
              {eyebrow}
            </span>
          </div>
          {badge && (
            <div
              className="inline-flex items-center"
              style={{ gap: 6, padding: '5px 11px', borderRadius: 9999, background: tint, color: accent, fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}
            >
              {badge}
            </div>
          )}
          <h3 style={{ fontSize: 'clamp(23px, 3.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.15 }}>
            {title}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {points.map((p) => (
              <li key={p} className="flex items-start" style={{ gap: 11, fontSize: 14.5, color: 'var(--gray-700, #4b5468)', lineHeight: 1.5 }}>
                <span className="flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22, borderRadius: 9999, background: tint, color: accent, marginTop: 1 }}>
                  <Check size={13} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center" style={{ order: reverse ? 1 : 2, position: 'relative' }}>
          <Blob color={tint} size={300} style={{ inset: 0, margin: 'auto', opacity: 0.8 }} />
          <div className="lp-float" style={{ position: 'relative' }}>
            <PhoneMockup src={mockup} alt={mockupAlt} width={260}>
              {screen}
            </PhoneMockup>
          </div>
        </div>
      </div>
      <style>{`@media (min-width: 880px){ .lp-feature-row{ grid-template-columns: 1fr 1fr !important; } }`}</style>
    </Reveal>
  )
}

function FeatureCard({ icon, accent, tint, title, text }: { icon: ReactNode; accent: string; tint: string; title: string; text: string }) {
  return (
    <Reveal>
      <div style={{ height: '100%', padding: 24, borderRadius: 20, border: '0.5px solid var(--gray-200)', background: '#fff' }}>
        <span className="flex items-center justify-center" style={{ width: 50, height: 50, borderRadius: 15, background: tint, color: accent }}>
          {icon}
        </span>
        <h4 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px' }}>{title}</h4>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--gray-600)', margin: 0 }}>{text}</p>
      </div>
    </Reveal>
  )
}

/* --------------------------------------------------------- How it works --- */
function HowItWorks() {
  const steps = [
    { icon: <UserPlus size={22} />, title: 'Crée ton compte gratuit', text: 'En 30 secondes, sans carte bancaire. Tu es prêt·e à réviser tout de suite.' },
    { icon: <Zap size={22} />, title: 'Entraîne-toi chaque jour', text: 'QCM, examens blancs et tuteur IA — sur ton téléphone, où tu veux.' },
    { icon: <TrendingUp size={22} />, title: 'Progresse et décroche ta place', text: 'Suis tes stats, cible tes points faibles et garde ta série.' },
  ]
  return (
    <section id="comment" style={{ padding: '64px 0', background: 'var(--gray-50)' }}>
      <Container>
        <SectionHead
          eyebrow={<><Zap size={14} /> Simple et rapide</>}
          title="Commence en 3 étapes"
          subtitle="Le minimum de clics entre toi et ta première série de QCM."
        />
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
          <div className="lp-steps" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div style={{ position: 'relative', height: '100%', padding: 26, borderRadius: 20, background: '#fff', border: '0.5px solid var(--gray-200)' }}>
                  <span
                    className="flex items-center justify-center"
                    style={{ position: 'absolute', top: -16, left: 26, width: 34, height: 34, borderRadius: 11, background: 'var(--grad-primary)', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 18px rgba(76,123,255,0.35)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex items-center justify-center" style={{ width: 50, height: 50, borderRadius: 15, background: 'var(--primary-50)', color: 'var(--primary-600)', marginTop: 8 }}>
                    {s.icon}
                  </span>
                  <h4 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 8px' }}>{s.title}</h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--gray-600)', margin: 0 }}>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="flex justify-center" style={{ marginTop: 36 }}>
          <Cta href="/auth/register" size="lg">
            Créer mon compte gratuit <ArrowRight size={18} />
          </Cta>
        </div>
        <style>{`@media (min-width: 820px){ .lp-steps{ grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------- Gamification --- */
function Gamification() {
  return (
    <section style={{ padding: '64px 0', position: 'relative', overflow: 'hidden' }}>
      <Blob color="var(--reward-50)" size={420} style={{ top: -60, right: -120 }} />
      <Container>
        <div className="lp-game" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'center' }}>
          <Reveal>
            <Eyebrow color="var(--reward-600)"><Flame size={14} /> Motivation</Eyebrow>
            <h3 style={{ fontSize: 'clamp(24px, 3.6vw, 34px)', fontWeight: 800, letterSpacing: '-0.01em', margin: '16px 0 0', lineHeight: 1.12 }}>
              Réviser n&apos;a jamais été aussi addictif
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--gray-600)', margin: '16px 0 24px', maxWidth: 460 }}>
              Garde ta série jour après jour, gagne de l&apos;XP, monte de niveau et grimpe au
              classement hebdomadaire. La même énergie que tes apps préférées, au service de ton
              concours.
            </p>
            <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
              <MiniBadge icon={<Flame size={15} />} label="Séries quotidiennes" bg="var(--grad-reward)" />
              <MiniBadge icon={<Star size={15} />} label="XP & niveaux" bg="var(--grad-accent)" />
              <MiniBadge icon={<Trophy size={15} />} label="Classement" bg="var(--grad-primary)" />
            </div>
          </Reveal>

          <Reveal delay={120} className="flex justify-center">
            <LeaderboardCard />
          </Reveal>
        </div>
        <style>{`@media (min-width: 860px){ .lp-game{ grid-template-columns: 1fr 1fr !important; } }`}</style>
      </Container>
    </section>
  )
}

function MiniBadge({ icon, label, bg }: { icon: ReactNode; label: string; bg: string }) {
  return (
    <span className="inline-flex items-center" style={{ gap: 7, padding: '8px 14px', borderRadius: 9999, background: bg, color: '#fff', fontSize: 13, fontWeight: 700 }}>
      {icon} {label}
    </span>
  )
}

function LeaderboardCard() {
  const rows = [
    { name: 'Sara L.', xp: 980, you: false },
    { name: 'Toi', xp: 870, you: true },
    { name: 'Yassine B.', xp: 845, you: false },
    { name: 'Imane K.', xp: 790, you: false },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 380, borderRadius: 22, background: '#fff', border: '0.5px solid var(--gray-200)', boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
      <div className="lp-gradient-animated" style={{ background: 'var(--grad-primary)', color: '#fff', padding: '18px 20px' }}>
        <div className="flex items-center justify-between">
          <span style={{ fontWeight: 700, fontSize: 15 }}>Classement de la semaine</span>
          <Trophy size={18} />
        </div>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center"
            style={{
              gap: 12, padding: '11px 12px', borderRadius: 12,
              background: r.you ? 'var(--primary-50)' : 'transparent',
              border: r.you ? '1.5px solid var(--primary-100)' : '1.5px solid transparent',
            }}
          >
            <span className="flex items-center justify-center" style={{ width: 26, height: 26, borderRadius: 9999, background: i === 0 ? 'var(--reward-500)' : 'var(--gray-100)', color: i === 0 ? '#fff' : 'var(--gray-600)', fontSize: 12, fontWeight: 700 }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: r.you ? 700 : 600, color: r.you ? 'var(--primary-600)' : 'var(--gray-900)' }}>{r.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-600)' }}>{r.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Pricing --- */
function Pricing() {
  return (
    <section id="tarifs" style={{ padding: '64px 0', background: 'var(--gray-50)' }}>
      <Container>
        <SectionHead
          eyebrow={<><Star size={14} /> Tarifs</>}
          title="Commence gratuitement, passe à la vitesse supérieure quand tu veux"
          subtitle="Le plan Gratuit est vraiment gratuit. Débloque plus quand tu es prêt·e."
        />
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
          <div className="lp-plans" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, alignItems: 'stretch' }}>
            <PlanCard
              name="Gratuit"
              tagline="Pour démarrer dès aujourd'hui"
              features={['20 QCM par jour', 'Corrections expliquées', 'Suivi de progression', 'Classement & séries']}
              cta={<Cta href="/auth/register" variant="primary">Commencer gratuitement</Cta>}
            />
            <PlanCard
              name="Basic"
              feature="popular"
              tagline="Le plus choisi"
              features={[
                '40 QCM par jour',
                'Examens blancs inclus',
                'Bibliothèque complète',
                'Tuteur IA : 10 questions/jour (1 photo)',
                '1 appel vidéo avec un étudiant en médecine 🎓',
              ]}
              cta={<Cta whatsapp variant="whatsapp">Choisir Basic</Cta>}
            />
            <PlanCard
              name="Premium"
              feature="best"
              tagline="Le maximum de valeur"
              features={[
                'QCM illimités',
                'Tuteur IA illimité',
                'Questions par photo illimitées',
                'Bibliothèque + examens blancs',
                'Appel hebdomadaire avec un étudiant en médecine 🎓',
              ]}
              cta={<Cta whatsapp variant="accent">Choisir Premium</Cta>}
            />
          </div>
        </div>
        <p className="text-center" style={{ fontSize: 12.5, color: 'var(--gray-600)', marginTop: 22 }}>
          Activation des plans payants par WhatsApp — simple et rapide.
        </p>
        <style>{`@media (min-width: 880px){ .lp-plans{ grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
      </Container>
    </section>
  )
}

function PlanCard({
  name, tagline, features, cta, feature,
}: { name: string; tagline: string; features: string[]; cta: ReactNode; feature?: 'popular' | 'best' }) {
  const best = feature === 'best'
  const popular = feature === 'popular'
  const border = best
    ? '1.5px solid var(--accent-500)'
    : popular
    ? '1.5px solid var(--primary-500)'
    : '0.5px solid var(--gray-200)'
  const shadow = best
    ? '0 26px 64px rgba(124,92,255,0.24)'
    : popular
    ? '0 20px 50px rgba(59,107,232,0.16)'
    : 'none'
  const checkColor = best ? 'var(--accent-600)' : 'var(--success-text)'
  return (
    <Reveal>
      <div
        style={{
          position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
          padding: 26, borderRadius: 22, border, boxShadow: shadow,
          // Best-value card gets a faint accent wash + a lift to dominate the row.
          background: best ? 'linear-gradient(180deg, var(--accent-50) 0%, #fff 38%)' : '#fff',
          transform: best ? 'translateY(-8px)' : 'none',
        }}
      >
        {(best || popular) && (
          <span
            className="inline-flex items-center"
            style={{
              position: 'absolute', top: -12, left: 26, gap: 5, padding: '4px 12px', borderRadius: 9999,
              background: best ? 'var(--grad-accent)' : 'var(--grad-primary)', color: '#fff',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.03em',
              boxShadow: best ? '0 8px 18px rgba(124,92,255,0.4)' : 'none',
            }}
          >
            {best ? <><Crown size={12} /> MEILLEURE VALEUR</> : <><Star size={12} /> POPULAIRE</>}
          </span>
        )}
        <div className="flex items-center" style={{ gap: 7 }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{name}</div>
          {best && <Crown size={18} color="var(--accent-600)" />}
        </div>
        <div style={{ fontSize: 13, color: best ? 'var(--accent-600)' : 'var(--gray-600)', marginTop: 4, fontWeight: best ? 700 : 400 }}>
          {tagline}
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0 24px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {features.map((f) => (
            <li key={f} className="flex items-start" style={{ gap: 10, fontSize: 13.5, color: 'var(--gray-700, #4b5468)' }}>
              <Check size={16} color={checkColor} style={{ flexShrink: 0, marginTop: 1 }} />
              {f}
            </li>
          ))}
        </ul>
        <div style={{ display: 'grid' }}>{cta}</div>
      </div>
    </Reveal>
  )
}

/* -------------------------------------------------------------------- FAQ --- */
function FaqSection() {
  return (
    <section id="faq" style={{ padding: '64px 0' }}>
      <Container style={{ maxWidth: 820 }}>
        <SectionHead
          eyebrow={<>FAQ</>}
          title="Les questions qu'on nous pose le plus"
          subtitle="Tout ce qu'il faut savoir avant de te lancer."
        />
        <Reveal>
          <Faq />
        </Reveal>
      </Container>
    </section>
  )
}

/* -------------------------------------------------------------- Final CTA --- */
function FinalCta() {
  return (
    <section style={{ padding: '0 0 80px' }}>
      <Container>
        <Reveal>
          <div
            className="lp-gradient-animated"
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 30, background: 'var(--grad-primary)', padding: 'clamp(40px, 7vw, 72px) 28px', textAlign: 'center', color: '#fff' }}
          >
            <Blob color="rgba(255,255,255,0.25)" size={320} style={{ top: -80, left: -60 }} />
            <Blob color="rgba(124,92,255,0.45)" size={300} style={{ bottom: -90, right: -50 }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
                Ta place en médecine commence ici.
              </h2>
              <p style={{ fontSize: 'clamp(15px, 2.2vw, 18px)', opacity: 0.92, margin: '16px auto 0', maxWidth: 520 }}>
                Rejoins les bacheliers qui révisent malin. Gratuit, sans carte bancaire.
              </p>
              <div className="flex justify-center" style={{ marginTop: 30 }}>
                <Cta href="/auth/register" variant="white" size="lg">
                  Commencer gratuitement <ArrowRight size={18} />
                </Cta>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ----------------------------------------------------------------- Footer --- */
function Footer() {
  return (
    <footer style={{ borderTop: '0.5px solid var(--gray-200)', padding: '44px 0 36px' }}>
      <Container>
        <div className="lp-footer" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28 }}>
          <div>
            <BrandMark height={32} />
            <p style={{ fontSize: 13, color: 'var(--gray-600)', margin: '14px 0 0', maxWidth: 280, lineHeight: 1.6 }}>
              La prépa au concours de médecine, dans ta poche. Conçue pour les bacheliers marocains.
            </p>
          </div>
          <FooterCol title="Produit" links={[
            { label: 'Fonctionnalités', href: '#fonctionnalites' },
            { label: 'Comment ça marche', href: '#comment' },
            { label: 'Tarifs', href: '#tarifs' },
            { label: 'FAQ', href: '#faq' },
          ]} />
          <FooterCol title="Compte" links={[
            { label: 'Se connecter', href: '/auth/login' },
            { label: 'Créer un compte', href: '/auth/register' },
          ]} />
          <FooterCol title="Légal" links={[
            { label: 'Mentions légales', href: '/mentions-legales' },
            { label: 'Confidentialité', href: '/confidentialite' },
            { label: 'CGU', href: '/conditions' },
          ]} />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 36, paddingTop: 20, borderTop: '0.5px solid var(--gray-200)', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>
            © {new Date().getFullYear()} MedenPoche. Tous droits réservés.
          </span>
          <span style={{ fontSize: 12.5, color: 'var(--gray-600)' }}>Fait avec ❤️ pour les futurs médecins.</span>
        </div>
        <style>{`@media (min-width: 760px){ .lp-footer{ grid-template-columns: 2fr 1fr 1fr 1fr !important; } }`}</style>
      </Container>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-900)', marginBottom: 14 }}>
        {title}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} style={{ fontSize: 13.5, color: 'var(--gray-600)', textDecoration: 'none' }}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ----------------------------------------------------------- Shared head --- */
function SectionHead({ eyebrow, title, subtitle }: { eyebrow: ReactNode; title: string; subtitle: string }) {
  return (
    <Reveal className="flex flex-col items-center text-center" style={{ marginBottom: 44 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '16px 0 0', lineHeight: 1.12, maxWidth: 640 }}>
        {title}
      </h2>
      <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--gray-600)', margin: '14px 0 0', maxWidth: 540, lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </Reveal>
  )
}
