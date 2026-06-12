import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { McqUpload } from '@/components/admin/mcq-upload'

export default function ImportPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link
        href="/admin/qcms"
        className="inline-flex items-center"
        style={{ gap: 6, fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}
      >
        <ArrowLeft size={15} />
        Retour à la banque
      </Link>
      <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
        Importez un fichier — l&apos;IA extrait les QCMs que vous validez avant publication.
      </p>
      <McqUpload />
    </div>
  )
}
