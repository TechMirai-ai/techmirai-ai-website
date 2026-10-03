import type { ElementType, ReactNode } from 'react'

type PaddingSize = 'sm' | 'md' | 'lg'

interface SectionProps {
  children: ReactNode
  className?: string
  as?: ElementType
  padding?: PaddingSize
}

const paddingMap: Record<PaddingSize, string> = {
  sm: 'py-8',
  md: 'py-16 md:py-24',
  lg: 'py-24 md:py-32',
}

export function Section({ children, className = '', as: Tag = 'section', padding = 'md' }: SectionProps) {
  return (
    <Tag className={`${paddingMap[padding]} ${className}`}>
      {children}
    </Tag>
  )
}
