import { Flame, ArrowRight, Check, Send, Camera, BookText, Sparkles, Zap, Target } from 'lucide-react'

/**
 * Faithful in-app screen mockups for the phone frames — rebuilt from the live
 * app (real layout, real sample data) so they look like the product without
 * depending on screenshot files. Pass a real PNG via PhoneMockup `src` to override.
 */

const screen: React.CSSProperties = { height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }

/* Accueil — the gamified home (hero). */
export function AccueilScreen() {
  return (
    <div style={screen}>
      <div style={{ padding: '20px 15px 10px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--gray-600)' }}>Bonjour abdel 👋</div>
        <div className="flex items-center justify-between" style={{ marginTop: 3 }}>
          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--gray-900)' }}>Accueil</div>
          <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 9999, background: 'var(--primary-50)', color: 'var(--primary-600)', fontSize: 12, fontWeight: 700 }}>A</div>
        </div>
      </div>
      <div style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ borderRadius: 16, background: 'var(--grad-primary)', color: '#fff', padding: 15 }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontSize: 10.5, opacity: 0.9 }}>Objectif du jour</div>
              <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1, marginTop: 2 }}>
                4<span style={{ opacity: 0.7, fontSize: 15 }}> / 20</span>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 4, background: '#fff', borderRadius: 9999, padding: '4px 9px', color: 'var(--reward-600)', fontWeight: 800, fontSize: 12 }}>
              <Flame size={12} /> 1
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.3)', margin: '11px 0 13px' }}>
            <div style={{ width: '20%', height: '100%', borderRadius: 9999, background: '#fff' }} />
          </div>
          <div className="flex items-center justify-center" style={{ gap: 6, height: 38, borderRadius: 9999, background: '#fff', color: 'var(--primary-600)', fontSize: 12, fontWeight: 700 }}>
            Continuer · Mathématiques <ArrowRight size={13} />
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ borderRadius: 14, background: 'var(--accent-50)', padding: '13px 14px' }}>
            <div className="flex items-center" style={{ gap: 5, color: 'var(--accent-600)', fontSize: 10.5, fontWeight: 700 }}>
              <Zap size={12} /> Niveau
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', marginTop: 5 }}>Niveau 3</div>
            <div style={{ height: 5, borderRadius: 9999, background: 'rgba(124,92,255,0.18)', marginTop: 8 }}>
              <div style={{ width: '92%', height: '100%', borderRadius: 9999, background: 'var(--accent-500)' }} />
            </div>
          </div>
          <div style={{ borderRadius: 14, background: 'var(--success-bg)', padding: '13px 14px' }}>
            <div className="flex items-center" style={{ gap: 5, color: 'var(--success-text)', fontSize: 10.5, fontWeight: 700 }}>
              <Target size={12} /> Précision
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginTop: 5 }}>16%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* QCM runner — apprentissage mode with the correction revealed. */
export function QcmScreen() {
  const opts = [
    { k: 'A', t: '+∞', state: 'wrong' as const },
    { k: 'B', t: '−∞', state: 'correct' as const },
    { k: 'C', t: '0', state: 'idle' as const },
    { k: 'D', t: '1', state: 'idle' as const },
  ]
  return (
    <div style={screen}>
      <div style={{ padding: '18px 15px 12px' }}>
        <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'var(--gray-600)', fontWeight: 600 }}>
          <span>Question 4 / 10</span>
          <span>02:18</span>
        </div>
        <div style={{ height: 5, borderRadius: 9999, background: 'var(--gray-100)', marginTop: 8 }}>
          <div style={{ width: '40%', height: '100%', borderRadius: 9999, background: 'var(--primary-500)' }} />
        </div>
      </div>
      <div style={{ padding: '0 15px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        <span className="inline-flex items-center self-start" style={{ padding: '3px 9px', borderRadius: 9999, background: 'var(--primary-50)', color: 'var(--module-maths)', fontSize: 10, fontWeight: 700 }}>
          Mathématiques
        </span>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gray-900)', lineHeight: 1.4 }}>
          Quelle est la limite de ln(x) lorsque x tend vers 0⁺ ?
        </div>
        <div className="flex flex-col" style={{ gap: 7, marginTop: 2 }}>
          {opts.map((o) => {
            const bg = o.state === 'correct' ? 'var(--success-bg)' : o.state === 'wrong' ? 'var(--danger-bg)' : '#fff'
            const bd = o.state === 'correct' ? 'var(--success-border)' : o.state === 'wrong' ? 'var(--danger-border)' : 'var(--gray-200)'
            const col = o.state === 'correct' ? 'var(--success-text)' : o.state === 'wrong' ? 'var(--danger-text)' : 'var(--gray-900)'
            return (
              <div key={o.k} className="flex items-center" style={{ gap: 9, padding: '10px 12px', borderRadius: 11, background: bg, border: `1px solid ${bd}` }}>
                <span className="flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: 9999, background: o.state === 'idle' ? 'var(--gray-100)' : 'transparent', color: col, fontSize: 11, fontWeight: 700 }}>
                  {o.state === 'correct' ? <Check size={13} /> : o.k}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: col }}>{o.t}</span>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 'auto', marginBottom: 14, padding: 11, borderRadius: 12, background: 'var(--primary-50)' }}>
          <div className="flex items-center" style={{ gap: 6, color: 'var(--primary-600)', fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>
            <Sparkles size={12} /> Explication
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-700, #4b5468)', lineHeight: 1.45 }}>
            Quand x → 0⁺, ln(x) décroît sans borne : la limite est −∞.
          </div>
        </div>
      </div>
    </div>
  )
}

/* IA tuteur — chat with a photo question. */
export function IaScreen() {
  return (
    <div style={screen}>
      <div style={{ padding: '18px 15px 10px', fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>Assistant IA</div>
      <div style={{ padding: '0 13px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        <div className="self-end" style={{ maxWidth: '82%', padding: '9px 12px', borderRadius: 13, borderTopRightRadius: 4, background: 'var(--primary-500)', color: '#fff', fontSize: 11.5, lineHeight: 1.4 }}>
          Pourquoi ln(x) tend vers −∞ en 0 ?
        </div>
        <div className="self-start flex flex-col" style={{ gap: 6, maxWidth: '88%' }}>
          <div style={{ padding: '10px 12px', borderRadius: 13, borderTopLeftRadius: 4, background: 'var(--gray-50)', border: '0.5px solid var(--gray-200)', fontSize: 11.5, color: 'var(--gray-900)', lineHeight: 1.45 }}>
            Parce que la fonction ln est strictement croissante mais non minorée : plus x s&apos;approche de 0⁺, plus ln(x) descend bas, sans jamais s&apos;arrêter. 📉
          </div>
          <span className="inline-flex items-center self-start" style={{ gap: 4, padding: '3px 8px', borderRadius: 9999, background: 'var(--gray-100)', color: 'var(--gray-600)', fontSize: 9.5 }}>
            <BookText size={10} /> Cours d&apos;analyse · p.12
          </span>
        </div>
      </div>
      <div style={{ padding: 11, borderTop: '0.5px solid var(--gray-200)' }}>
        <div className="flex items-center" style={{ gap: 7 }}>
          <span className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 11, border: '0.5px solid var(--gray-200)', color: 'var(--gray-600)' }}>
            <Camera size={15} />
          </span>
          <div className="flex items-center" style={{ flex: 1, height: 32, borderRadius: 11, border: '0.5px solid var(--gray-200)', padding: '0 11px', fontSize: 11, color: 'var(--gray-400)' }}>
            Pose ta question…
          </div>
          <span className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, borderRadius: 11, background: 'var(--primary-500)', color: '#fff' }}>
            <Send size={14} />
          </span>
        </div>
      </div>
    </div>
  )
}
