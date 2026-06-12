import { ScreenHeader } from '@/components/student/primitives'

export default function BibliothequeLoading() {
  return (
    <div>
      <ScreenHeader title="Bibliothèque" />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="mp-skeleton" style={{ height: 40, borderRadius: 8 }} />
        <div className="flex items-center" style={{ gap: 8 }}>
          {[56, 64, 72, 64].map((w, i) => (
            <div key={i} className="mp-skeleton" style={{ width: w, height: 28, borderRadius: 9999 }} />
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="mp-skeleton" style={{ height: 38, borderRadius: 8 }} />
          <div className="mp-skeleton" style={{ height: 38, borderRadius: 8 }} />
        </div>
      </div>
      <div style={{ padding: '14px 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center"
            style={{ gap: 12, padding: 14, borderRadius: 12, border: '0.5px solid var(--gray-200)' }}
          >
            <div className="mp-skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div className="mp-skeleton" style={{ width: '60%', height: 13 }} />
              <div className="mp-skeleton" style={{ width: '40%', height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
