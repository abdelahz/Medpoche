import { createClient } from '@/lib/supabase/server'
import { listReports } from '@/app/actions/reports'
import { ReportsManager } from '@/components/admin/reports-manager'
import type { ReportDetail, ReportRow } from '@/types'

function toNum(s: string | null): number | null {
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Deep-link to the reported question in the QCM bank (filters + a text search). */
function mcqHref(m: {
  module: string | null
  year: number | null
  subject: string | null
  question: string | null
}): string {
  const p = new URLSearchParams()
  if (m.module) p.set('module', m.module)
  if (m.year) p.set('year', String(m.year))
  if (m.subject) p.set('subject', m.subject)
  // A short, wildcard-safe snippet narrows the bank to the exact question.
  const snip = String(m.question ?? '')
    .replace(/[\n%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
  if (snip) p.set('q', snip)
  return `/admin/qcms?${p.toString()}`
}

export default async function SignalementsPage() {
  const reports = await listReports()
  const supabase = await createClient()

  // ── Reporter names ──
  const userIds = Array.from(new Set(reports.map((r) => r.user_id).filter((x): x is string => !!x)))
  const reporterById = new Map<string, string>()
  if (userIds.length) {
    const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    for (const p of data ?? []) reporterById.set(p.id, p.full_name || p.email || '')
  }

  // ── Source-item details, by context ──
  const idsFor = (ctx: string) =>
    Array.from(
      new Set(
        reports
          .filter((r) => r.context === ctx)
          .map((r) => toNum(r.context_id))
          .filter((x): x is number => x != null)
      )
    )
  const mcqIds = idsFor('mcq')
  const libIds = idsFor('library')
  const aiIds = idsFor('ai')

  const [mcqRes, libRes, aiRes] = await Promise.all([
    mcqIds.length
      ? supabase.from('mcqs').select('id, module, subject, year, exam_blanc, position, question').in('id', mcqIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    libIds.length
      ? supabase.from('library').select('id, title, type, module, subject').in('id', libIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    aiIds.length
      ? supabase.from('chat_history').select('id, question').in('id', aiIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  const mcqMap = new Map((mcqRes.data ?? []).map((m) => [Number(m.id), m]))
  const libMap = new Map((libRes.data ?? []).map((l) => [Number(l.id), l]))
  const aiMap = new Map((aiRes.data ?? []).map((c) => [Number(c.id), c]))

  const rows: ReportRow[] = reports.map((r) => {
    const id = toNum(r.context_id)
    let detail: ReportDetail = null
    if (r.context === 'mcq' && id != null && mcqMap.has(id)) {
      const m = mcqMap.get(id)!
      const module_ = (m.module as string) ?? null
      const subject = (m.subject as string) ?? null
      const year = (m.year as number) ?? null
      const question = String(m.question ?? '')
      detail = {
        kind: 'mcq',
        module: module_,
        subject,
        year,
        exam_blanc: (m.exam_blanc as string) ?? null,
        position: (m.position as number) ?? null,
        question,
        href: mcqHref({ module: module_, year, subject, question }),
      }
    } else if (r.context === 'library' && id != null && libMap.has(id)) {
      const l = libMap.get(id)!
      detail = {
        kind: 'library',
        title: String(l.title ?? ''),
        type: String(l.type ?? ''),
        module: (l.module as string) ?? null,
        subject: (l.subject as string) ?? null,
      }
    } else if (r.context === 'ai' && id != null && aiMap.has(id)) {
      detail = { kind: 'ai', question: (aiMap.get(id)!.question as string) ?? null }
    }
    return { ...r, reporter: r.user_id ? reporterById.get(r.user_id) ?? null : null, detail }
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        Erreurs signalées par les étudiants (QCM, IA, bibliothèque). Visible uniquement par les
        administrateurs.
      </p>
      <ReportsManager reports={rows} />
    </div>
  )
}
