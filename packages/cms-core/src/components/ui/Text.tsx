import type { ElementType, ReactNode } from 'react'

type TextVariant = 'body' | 'small' | 'muted' | 'caption'

interface TextProps {
  variant?: TextVariant
  as?: ElementType
  children: ReactNode
  className?: string
}

const variantMap: Record<TextVariant, string> = {
  body: 'text-base leading-relaxed text-[var(--color-text)]',
  small: 'text-sm text-[var(--color-text)]',
  muted: 'text-sm text-[var(--color-muted)]',
  caption: 'text-xs text-[var(--color-muted)] uppercase tracking-wide',
}

export function Text({ variant = 'body', as: Tag = 'p', children, className = '' }: TextProps) {
  return (
    <Tag className={`${variantMap[variant]} ${className}`}>
      {children}
    </Tag>
  )
}
