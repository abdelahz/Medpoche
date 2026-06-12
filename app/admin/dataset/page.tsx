import { createClient } from '@/lib/supabase/server'
import type { DatasetItem } from '@/types'
import { DatasetManager } from '@/components/admin/dataset-manager'

export default async function DatasetPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('dataset')
    .select('*')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as DatasetItem[]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        Base de connaissances privée du chatbot IA — non visible par les étudiants.
      </p>
      <DatasetManager items={items} />
    </div>
  )
}
