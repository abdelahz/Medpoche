import { Card } from '@/components/admin/primitives'
import { Skeleton } from '@/components/admin/skeleton'

export default function QcmsLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Toolbar */}
      <div className="flex flex-col" style={{ gap: 12, marginBottom: 16 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <Skeleton width={320} height={38} radius={8} />
          <div className="flex items-center" style={{ gap: 8, marginLeft: 'auto' }}>
            <Skeleton width={100} height={36} radius={8} />
            <Skeleton width={130} height={36} radius={8} />
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {[64, 110, 70, 80, 60].map((w, i) => (
            <Skeleton key={i} width={w} height={28} radius={9999} />
          ))}
        </div>
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid items-center"
            style={{
              gridTemplateColumns: '130px 1fr 80px 120px 150px',
              gap: 12,
              padding: '14px 20px',
              borderBottom: i < 7 ? '0.5px solid var(--gray-100)' : 'none',
            }}
          >
            <Skeleton width={80} height={20} radius={9999} />
            <Skeleton width="85%" />
            <Skeleton width={36} />
            <Skeleton width={70} height={20} radius={9999} />
            <Skeleton width={50} />
          </div>
        ))}
      </Card>
    </div>
  )
}
