import { createClient } from '@/lib/supabase/server'
import type { LibraryItem } from '@/types'
import { LibraryManager } from '@/components/admin/library-manager'

export default async function AdminBibliothequePage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('library')
    .select('*')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as LibraryItem[]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        Gérez les cours et fiches accessibles aux étudiants.
      </p>
      <LibraryManager items={items} />
    </div>
  )
}
