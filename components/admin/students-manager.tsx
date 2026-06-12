'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye, Trash2, Loader2, X, Download } from 'lucide-react'
import { toast } from 'sonner'
import { setStudentPlan, deleteStudent, exportStudentsCsv } from '@/app/actions/students'
import { PLANS, type Plan } from '@/types'
import { Card, Avatar } from './primitives'
import { Button } from './button'
import { StudentDetailModal } from './student-detail-modal'

export type StudentRow = {
  id: string
  full_name: string | null
  email: string | null
  is_premium: boolean
  plan: Plan | null
  created_at: string
}

const GRID = '1fr 150px 130px 110px'

const PLAN_LABELS: Record<Plan, string> = { gratuit: 'Gratuit', basic: 'Basic', premium: 'Premium' }

function initials(name: string | null) {
  if (!name?.trim()) return 'É'
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function PlanSelect({
  value,
  busy,
  onChange,
}: {
  value: Plan
  busy: boolean
  onChange: (plan: Plan) => void
}) {
  const paid = value !== 'gratuit'
  return (
    <div className="relative flex items-center" style={{ flexShrink: 0 }}>
      <select
        value={value}
        disabled={busy}
        onChange={(e) => onChange(e.target.value as Plan)}
        style={{
          appearance: 'none',
          height: 30,
          padding: '0 26px 0 10px',
          borderRadius: 8,
          border: '0.5px solid var(--gray-200)',
          background: paid ? 'var(--primary-50)' : '#fff',
          color: paid ? 'var(--primary-600)' : 'var(--gray-700)',
          fontSize: 12,
          fontWeight: 600,
          cursor: busy ? 'default' : 'pointer',
          outline: 'none',
        }}
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {PLAN_LABELS[p]}
          </option>
        ))}
      </select>
      {busy && (
        <Loader2 size={13} className="mp-spin" style={{ position: 'absolute', right: 8, color: 'var(--gray-400)' }} />
      )}
    </div>
  )
}

function DeleteModal({
  student,
  onClose,
  onDeleted,
}: {
  student: StudentRow
  onClose: () => void
  onDeleted: () => void
}) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const matches = typed.trim().toLowerCase() === (student.email ?? '').trim().toLowerCase()

  async function confirm() {
    setBusy(true)
    const res = await deleteStudent(student.id, typed)
    setBusy(false)
    if (res.success) {
      toast.success('Compte supprimé.')
      onDeleted()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(26,29,46,0.35)', zIndex: 60, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-modal)', width: 460, maxWidth: '100%' }}
      >
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--gray-200)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger-text)', margin: 0 }}>
            Supprimer le compte
          </h2>
          <button onClick={onClose} className="flex" style={{ color: 'var(--gray-400)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--gray-900)', margin: '0 0 6px', lineHeight: 1.5 }}>
            Cette action supprime définitivement <strong>{student.full_name ?? 'cet étudiant'}</strong> et
            toutes ses données (tentatives, favoris, conversations, fichiers). <strong>Irréversible.</strong>
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '12px 0 6px' }}>
            Tapez <strong>{student.email}</strong> pour confirmer :
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={student.email ?? ''}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '0.5px solid var(--gray-200)',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div className="flex items-center justify-end" style={{ gap: 10, padding: '14px 20px', borderTop: '0.5px solid var(--gray-200)' }}>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirm} disabled={!matches || busy}>
            {busy && <Loader2 size={14} className="mp-spin" />}
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StudentsManager({ students }: { students: StudentRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [planBusyId, setPlanBusyId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudentRow | null>(null)
  const [exporting, setExporting] = useState(false)

  async function exportCsv() {
    setExporting(true)
    const res = await exportStudentsCsv()
    setExporting(false)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medenpoche-inscrits-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Liste des inscrits exportée.')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => `${s.full_name ?? ''} ${s.email ?? ''}`.toLowerCase().includes(q))
  }, [students, query])

  async function changePlan(s: StudentRow, plan: Plan) {
    setPlanBusyId(s.id)
    const res = await setStudentPlan(s.id, plan)
    setPlanBusyId(null)
    if (res.success) {
      toast.success(`Plan mis à jour : ${PLAN_LABELS[plan]}.`)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Toolbar */}
      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
        <div className="relative flex items-center" style={{ flex: '0 0 320px' }}>
          <span className="absolute flex" style={{ left: 11, color: 'var(--gray-400)' }}>
            <Search size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un étudiant…"
            style={{
              width: '100%',
              height: 38,
              boxSizing: 'border-box',
              padding: '9px 12px 9px 34px',
              border: '0.5px solid var(--gray-200)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--gray-900)',
              background: '#fff',
              outline: 'none',
            }}
          />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gray-600)' }}>
          {students.length} étudiant{students.length > 1 ? 's' : ''}
        </span>
        <Button variant="ghost" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 size={14} className="mp-spin" /> : <Download size={14} />}
          Exporter (CSV)
        </Button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 620 }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: GRID,
                gap: 12,
                padding: '11px 20px',
                borderBottom: '0.5px solid var(--gray-200)',
                background: 'var(--gray-50)',
              }}
            >
              {['Étudiant', 'Plan', 'Inscrit le', ''].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--gray-600)',
                    textAlign: i === 3 ? 'right' : 'left',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--gray-600)', fontSize: 13 }}>
                {students.length === 0 ? 'Aucun étudiant inscrit.' : 'Aucun étudiant ne correspond.'}
              </div>
            ) : (
              filtered.map((s, i) => (
                <div
                  key={s.id}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: GRID,
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--gray-100)' : 'none',
                  }}
                >
                  <span className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
                    <Avatar initials={initials(s.full_name)} size={36} />
                    <span style={{ minWidth: 0 }}>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)' }}>
                        {s.full_name ?? 'Sans nom'}
                      </span>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 11, color: 'var(--gray-600)' }}>
                        {s.email}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center">
                    <PlanSelect
                      value={s.plan ?? 'gratuit'}
                      busy={planBusyId === s.id}
                      onChange={(plan) => changePlan(s, plan)}
                    />
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                    {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="flex items-center justify-end" style={{ gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      title="Détails"
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--gray-600)', cursor: 'pointer' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      title="Supprimer le compte"
                      className="flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--danger-text)', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {detailId && <StudentDetailModal studentId={detailId} onClose={() => setDetailId(null)} />}
      {deleteTarget && (
        <DeleteModal
          student={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
