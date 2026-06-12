'use client'

const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT']

/** Toggleable module chips — pick one or several matières. */
export function ModuleMultiSelect({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(m: string) {
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m])
  }
  return (
    <div className="flex items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
      {MODULES.map((m) => {
        const on = value.includes(m)
        return (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            className="font-medium"
            style={{
              padding: '6px 13px',
              borderRadius: 9999,
              fontSize: 12,
              cursor: 'pointer',
              border: on ? '0.5px solid var(--primary-100)' : '0.5px solid var(--gray-200)',
              background: on ? 'var(--primary-50)' : '#fff',
              color: on ? 'var(--primary-600)' : 'var(--gray-600)',
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}
