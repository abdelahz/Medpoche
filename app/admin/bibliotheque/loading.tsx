import { Card } from '@/components/admin/primitives'
import { Skeleton } from '@/components/admin/skeleton'

export default function LibraryLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton width={280} height={14} style={{ marginBottom: 16 }} />
      <div className="flex items-center" style={{ gap: 12, marginBottom: 12 }}>
        <Skeleton width={320} height={38} radius={8} />
        <Skeleton width={170} height={36} radius={8} style={{ marginLeft: 'auto' }} />
      </div>
      <div className="flex items-center" style={{ gap: 8, marginBottom: 16 }}>
        {[60, 70, 80, 70, 70, 70].map((w, i) => (
          <Skeleton key={i} width={w} height={28} radius={9999} />
        ))}
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 110px 140px 110px 96px',
              gap: 12,
              padding: '13px 20px',
              borderBottom: i < 5 ? '0.5px solid var(--gray-100)' : 'none',
            }}
          >
            <Skeleton width="70%" />
            <Skeleton width={70} height={20} radius={9999} />
            <Skeleton width={90} />
            <Skeleton width={60} />
            <Skeleton width={60} />
          </div>
        ))}
      </Card>
    </div>
  )
}
