'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { FAQ_ITEMS } from './seo'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: '0.5px solid var(--gray-200)',
              background: isOpen ? 'var(--gray-50)' : '#fff',
              overflow: 'hidden',
              transition: 'background 200ms ease',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex items-center justify-between w-full text-left"
              style={{ gap: 14, padding: '17px 20px', cursor: 'pointer', background: 'transparent' }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--gray-900)' }}>{item.q}</span>
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9999,
                  background: isOpen ? 'var(--primary-500)' : 'var(--primary-50)',
                  color: isOpen ? '#fff' : 'var(--primary-600)',
                  transition: 'transform 200ms ease, background 200ms ease',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                }}
              >
                <Plus size={16} />
              </span>
            </button>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transition: 'grid-template-rows 250ms ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, padding: '0 20px 18px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--gray-600)' }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
