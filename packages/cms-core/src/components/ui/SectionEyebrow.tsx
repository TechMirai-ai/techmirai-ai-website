import type { ReactNode } from 'react'

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary-dark">
      {children}
    </p>
  )
}