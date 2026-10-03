import type { ElementType, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: ElementType
  hover?: boolean
}

export function Card({ children, className = '', as: Tag = 'div', hover = false }: CardProps) {
  return (
    <Tag
      className={`bg-[var(--color-surface)] rounded-lg border border-[var(--color-border-default)] overflow-hidden ${
        hover ? 'transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  )
}
