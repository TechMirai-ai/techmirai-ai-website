import type { ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'primary' | 'accent'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-[var(--color-surface-subtle)] text-[var(--color-text)] border border-[var(--color-border-default)]',
  primary: 'bg-[var(--color-primary)] text-on-primary',
  // Accent text on tint background — darkened from the raw accent token so it
  // still clears 4.5:1 at badge text size (raw #47A35A on tint is only ~3:1).
  accent: 'bg-[var(--color-surface-alt)] text-[#2A783D]',
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
