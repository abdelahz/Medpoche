'use client'

import { useState, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<
  ButtonVariant,
  { bg: string; color: string; border: string; hoverBg: string }
> = {
  primary: { bg: 'var(--primary-500)', color: '#fff', border: 'none', hoverBg: 'var(--primary-600)' },
  secondary: {
    bg: 'var(--primary-50)',
    color: 'var(--primary-900)',
    border: '0.5px solid var(--primary-100)',
    hoverBg: 'var(--primary-100)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--gray-600)',
    border: '0.5px solid var(--gray-200)',
    hoverBg: 'var(--gray-50)',
  },
  danger: {
    bg: 'var(--danger-bg)',
    color: 'var(--danger-text)',
    border: '0.5px solid var(--danger-border)',
    hoverBg: '#FEE2E2',
  },
}

const sizes: Record<ButtonSize, { padding: string; fontSize: number }> = {
  sm: { padding: '7px 12px', fontSize: 12 },
  md: { padding: '9px 18px', fontSize: 13 },
  lg: { padding: '11px 22px', fontSize: 14 },
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
  type = 'button',
  style,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  style?: React.CSSProperties
}) {
  const [hover, setHover] = useState(false)
  const v = variants[variant]
  const s = sizes[size]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex items-center justify-center font-medium whitespace-nowrap"
      style={{
        gap: 7,
        cursor: disabled ? 'default' : 'pointer',
        borderRadius: 8,
        border: v.border,
        color: v.color,
        background: disabled ? v.bg : hover ? v.hoverBg : v.bg,
        opacity: disabled ? 0.55 : 1,
        padding: s.padding,
        fontSize: s.fontSize,
        transition: 'background 150ms ease, border-color 150ms ease',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
