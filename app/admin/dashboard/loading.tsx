import { Card } from '@/components/admin/primitives'
import { Skeleton } from '@/components/admin/skeleton'

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-6">
      {/* Stat cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton width={36} height={36} radius={8} />
            <Skeleton width={60} height={28} />
            <Skeleton width={120} height={12} />
          </Card>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <Card>
          <Skeleton width={140} height={16} style={{ marginBottom: 16 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '11px 0' }}>
              <Skeleton width="90%" />
            </div>
          ))}
        </Card>
        <Card>
          <Skeleton width={160} height={16} style={{ marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <Skeleton width="50%" style={{ marginBottom: 8 }} />
              <Skeleton height={6} radius={9999} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
