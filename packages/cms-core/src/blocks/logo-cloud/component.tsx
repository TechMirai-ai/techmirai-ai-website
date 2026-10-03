// Server Component — scrolling handled by .logo-track CSS (globals.css)

import type { LogoCloudBlockProps, ScrollSpeed } from './types'

const speedDuration: Record<ScrollSpeed, string> = {
  slow: '80s',      // much slower
  medium: '55s',
  fast: '35s',
}

export function LogoCloudBlock({
  eyebrow,
  heading,
  logos = [],
  scrollSpeed = 'slow',   // default to slow
}: LogoCloudBlockProps) {
  // Double the array for seamless infinite loop
  const doubledLogos = [...logos, ...logos]

  // Geometric shapes inspired by the reference
  const shapes = [
    'polygon(0% 6%, 100% 0%, 100% 94%, 0% 100%)',
    'polygon(6% 0%, 100% 10%, 94% 100%, 0% 90%)',
    'polygon(0% 12%, 100% 0%, 100% 88%, 0% 100%)',
    'polygon(0% 0%, 100% 8%, 100% 100%, 0% 92%)',
    'polygon(0% 4%, 100% 0%, 100% 96%, 0% 100%)',
  ]

  return (
    <section className="overflow-hidden bg-brand-surface py-14 md:py-20" aria-label={eyebrow}>
      
      {/* Scrolling track */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]">
        <div
          className="logo-track flex items-center gap-6 md:gap-8 lg:gap-10"
          style={{ animationDuration: speedDuration[scrollSpeed] }}
        >
          {doubledLogos.map((logo, i) => {
            const shapeIndex = i % shapes.length

            return (
              <div
                key={i}
                className="relative shrink-0 overflow-hidden shadow-xl transition-transform duration-500 hover:scale-105"
                style={{
                  width: '450px',
                  height: '330px',
                  clipPath: shapes[shapeIndex],
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.logoUrl}
                  className="h-full w-full object-cover"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}