import type { ReactNode } from 'react'

interface HeadingProps {
  level: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
}

const sizeMap: Record<1 | 2 | 3 | 4, string> = {
  1: 'text-4xl md:text-5xl leading-tight',
  2: 'text-3xl md:text-4xl leading-tight',
  3: 'text-2xl md:text-3xl leading-snug',
  4: 'text-xl md:text-2xl leading-snug',
}

export function Heading({ level, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
  return (
    <Tag
      className={`font-[var(--font-weight-heading,700)] text-[var(--color-text)] ${sizeMap[level]} ${className}`}
    >
      {children}
    </Tag>
  )
}
