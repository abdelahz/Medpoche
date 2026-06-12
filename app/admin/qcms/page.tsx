import { createClient } from '@/lib/supabase/server'
import type { MCQ } from '@/types'
import { QcmBank } from '@/components/admin/qcm-bank'

const PAGE_SIZE = 20

type SearchParams = {
  q?: string
  module?: string
  status?: string
  year?: string
  subject?: string
  exam_blanc?: string
  page?: string
}

export default async function QcmsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const fromIdx = (page - 1) * PAGE_SIZE
  const toIdx = fromIdx + PAGE_SIZE - 1

  // Filtered, paginated query
  let query = supabase.from('mcqs').select('*', { count: 'exact' })
  if (searchParams.module) query = query.eq('module', searchParams.module)
  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (searchParams.year) query = query.eq('year', Number(searchParams.year))
  if (searchParams.subject) query = query.eq('subject', searchParams.subject)
  if (searchParams.exam_blanc) query = query.eq('exam_blanc', searchParams.exam_blanc)
  if (searchParams.q) query = query.ilike('question', `%${searchParams.q}%`)
  query = query.order('created_at', { ascending: false }).range(fromIdx, toIdx)

  const [listRes, facetsRes] = await Promise.all([
    query,
    // Distinct values for filters + editor datalists.
    supabase.from('mcqs').select('year, subject, exam_blanc'),
  ])

  const mcqs = (listRes.data ?? []) as MCQ[]
  const total = listRes.count ?? 0
  const facets = (facetsRes.data ?? []) as {
    year: number | null
    subject: string | null
    exam_blanc: string | null
  }[]

  const years = Array.from(new Set(facets.map((r) => r.year).filter(Boolean) as number[])).sort(
    (a, b) => b - a
  )
  const subjects = Array.from(
    new Set(facets.map((r) => r.subject).filter(Boolean) as string[])
  ).sort()
  const examBlancs = Array.from(
    new Set(facets.map((r) => r.exam_blanc).filter(Boolean) as string[])
  ).sort()

  return (
    <QcmBank
      mcqs={mcqs}
      years={years}
      subjects={subjects}
      examBlancs={examBlancs}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
    />
  )
}
