import { Card } from '@/components/admin/primitives'
import { Skeleton } from '@/components/admin/skeleton'

export default function StudentsLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton width={280} height={14} style={{ marginBottom: 16 }} />
      <div className="flex items-center" style={{ marginBottom: 16 }}>
        <Skeleton width={320} height={38} radius={8} />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: '1fr 150px 130px 110px',
              gap: 12,
              padding: '12px 20px',
              borderBottom: i < 6 ? '0.5px solid var(--gray-100)' : 'none',
            }}
          >
            <span className="flex items-center" style={{ gap: 10 }}>
              <Skeleton width={36} height={36} radius={9999} />
              <span style={{ flex: 1 }}>
                <Skeleton width="50%" style={{ marginBottom: 6 }} />
                <Skeleton width="70%" height={10} />
              </span>
            </span>
            <Skeleton width={90} height={22} radius={9999} />
            <Skeleton width={60} />
            <Skeleton width={60} />
          </div>
        ))}
      </Card>
    </div>
  )
}
