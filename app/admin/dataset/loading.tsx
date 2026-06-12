import { Card } from '@/components/admin/primitives'
import { Skeleton } from '@/components/admin/skeleton'

export default function DatasetLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton width={320} height={14} style={{ marginBottom: 16 }} />
      <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
        <Skeleton width={320} height={38} radius={8} />
        <Skeleton width={170} height={36} radius={8} style={{ marginLeft: 'auto' }} />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 160px 120px 96px',
              gap: 12,
              padding: '13px 20px',
              borderBottom: i < 5 ? '0.5px solid var(--gray-100)' : 'none',
            }}
          >
            <Skeleton width="70%" />
            <Skeleton width={100} />
            <Skeleton width={60} />
            <Skeleton width={60} />
          </div>
        ))}
      </Card>
    </div>
  )
}
