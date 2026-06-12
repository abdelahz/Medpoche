import { createClient } from '@/lib/supabase/server'
import { FileText, Flag, Users, Star } from 'lucide-react'
import { Card, Badge, StatCard, SectionTitle } from '@/components/admin/primitives'

type RecentMcq = {
  id: number
  question: string
  module: string | null
  status: string
  created_at: string
}

type ModuleRow = { module: string | null }

const MODULE_META: Record<string, { label: string; color: string; variant: 'maths' | 'chimie' | 'physique' | 'svt' }> = {
  Mathématiques: { label: 'Mathématiques', color: 'var(--module-maths)', variant: 'maths' },
  Chimie: { label: 'Chimie', color: 'var(--module-chimie)', variant: 'chimie' },
  Physique: { label: 'Physique', color: 'var(--module-physique)', variant: 'physique' },
  SVT: { label: 'SVT', color: 'var(--module-svt)', variant: 'svt' },
}

const FIXED_MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT'] as const

function moduleVariant(mod: string | null): 'maths' | 'chimie' | 'physique' | 'svt' | 'default' {
  if (!mod) return 'default'
  return MODULE_META[mod]?.variant ?? 'default'
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [readyRes, flaggedRes, studentRes, premiumRes, recentRes, moduleRes] = await Promise.all([
    supabase.from('mcqs').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
    supabase.from('mcqs').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
    supabase
      .from('mcqs')
      .select('id, question, module, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('mcqs').select('module').eq('status', 'ready'),
  ])

  const readyCount = readyRes.count ?? 0
  const flaggedCount = flaggedRes.count ?? 0
  const studentCount = studentRes.count ?? 0
  const premiumCount = premiumRes.count ?? 0
  const recentMcqs = (recentRes.data ?? []) as RecentMcq[]
  const allModules = (moduleRes.data ?? []) as ModuleRow[]

  // Module coverage — fixed 4 modules, counts relative to the busiest
  const moduleCounts = allModules.reduce<Record<string, number>>((acc, row) => {
    if (row.module) acc[row.module] = (acc[row.module] ?? 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...FIXED_MODULES.map((m) => moduleCounts[m] ?? 0))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<FileText size={18} />} tone="info" value={readyCount} label="QCMs publiés" />
        <StatCard icon={<Flag size={18} />} tone="warning" value={flaggedCount} label="En attente de révision" />
        <StatCard icon={<Users size={18} />} tone="success" value={studentCount} label="Étudiants inscrits" />
        <StatCard icon={<Star size={18} />} tone="info" value={premiumCount} label="Comptes premium" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        {/* Recent QCMs */}
        <Card>
          <SectionTitle
            right={
              <span style={{ fontSize: 12, color: 'var(--primary-500)', fontWeight: 500, cursor: 'pointer' }}>
                Voir tout
              </span>
            }
          >
            QCMs récents
          </SectionTitle>

          {recentMcqs.length === 0 ? (
            <div className="flex items-center justify-center" style={{ padding: '40px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>Aucun QCM pour le moment.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentMcqs.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: '11px 0',
                    borderBottom: i < recentMcqs.length - 1 ? '0.5px solid var(--gray-100)' : 'none',
                  }}
                >
                  <Badge variant={moduleVariant(r.module)}>{r.module ?? '—'}</Badge>
                  <span
                    className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ fontSize: 13, color: 'var(--gray-900)' }}
                  >
                    {truncate(r.question, 60)}
                  </span>
                  <Badge variant={r.status === 'ready' ? 'published' : 'flagged'} dot>
                    {r.status === 'ready' ? 'Publié' : 'Signalé'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Module coverage */}
        <Card>
          <SectionTitle>Couverture par module</SectionTitle>
          <div className="flex flex-col" style={{ gap: 16 }}>
            {FIXED_MODULES.map((mod) => {
              const count = moduleCounts[mod] ?? 0
              const meta = MODULE_META[mod]
              return (
                <div key={mod}>
                  <div className="flex justify-between" style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 13, color: 'var(--gray-900)' }}>{meta.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--gray-600)', fontVariantNumeric: 'tabular-nums' }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 9999, background: 'var(--gray-100)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(count / maxCount) * 100}%`,
                        borderRadius: 9999,
                        background: meta.color,
                        transition: 'width 400ms ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
