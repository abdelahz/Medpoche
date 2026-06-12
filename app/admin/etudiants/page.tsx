import { createClient } from '@/lib/supabase/server'
import { StudentsManager, type StudentRow } from '@/components/admin/students-manager'

export default async function EtudiantsPage() {
  const supabase = await createClient()

  // Admin RLS ("Admins view all profiles") lets this read every student.
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_premium, plan, created_at')
    .eq('is_admin', false)
    .order('created_at', { ascending: false })

  const students = (data ?? []) as StudentRow[]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        Consultez et gérez les comptes étudiants.
      </p>
      <StudentsManager students={students} />
    </div>
  )
}
