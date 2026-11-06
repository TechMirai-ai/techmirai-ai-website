import type { ReactNode } from 'react'

// Shared layout constants for the /company sections. Proportions follow
// TechMirai_About_Us_Webpage.html: the reference collapses its grids at 850px
// and steps type and padding down again at 640px.

/** Reference `.container`: 1160px wide, 34px side padding (23px under 850px). */
export const COMPANY_INNER = 'mx-auto w-full max-w-[1009px] px-[20px] min-[851px]:px-[30px]'

/** Reference `.section`: 92px vertical padding (62px under 640px). */
export const COMPANY_SECTION_Y = 'py-[54px] min-[641px]:py-[80px]'

/** Tight display tracking from the reference; Japanese keeps normal spacing. */
export const DISPLAY_TRACKING = 'tracking-[-0.04em] [&:lang(ja)]:tracking-normal'

export function Eyebrow({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  const color = tone === 'dark' ? 'text-amber-300 before:bg-amber-300' : 'text-amber-700 before:bg-amber-600'
  return (
    <div className={`mb-5 flex items-center gap-2.5 text-[12px] font-extrabold uppercase tracking-[0.22em] before:h-0.5 before:w-[20px] before:content-[''] ${color}`}>
      {children}
    </div>
  )
}
