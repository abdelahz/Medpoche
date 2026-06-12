import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import { ProfileView } from '@/components/student/profile-view'
import { StudentContainer } from '@/components/student/student-container'

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, prenom, nom, filiere, phone, plan, is_premium, created_at')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <StudentContainer>
      <ProfileView profile={data as Profile | null} email={user?.email ?? data?.email ?? null} />
    </StudentContainer>
  )
}
