import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/admin-shell'
import { getOpenReportCount } from '@/app/actions/reports'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/auth/login')

  const reportCount = await getOpenReportCount()

  return (
    <AdminShell profile={{ full_name: profile.full_name, email: profile.email }} reportCount={reportCount}>
      {children}
    </AdminShell>
  )
}
