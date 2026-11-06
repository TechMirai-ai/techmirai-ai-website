'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import type { AboutHeroProps } from './adapters'
import { withLocale } from './components'
import { COMPANY_INNER, Eyebrow } from './company-parts'

const ORBIT_LOGO_PX = 112

/** Reference hero: 1.3fr text column + 0.7fr orbit artwork; artwork hidden under 850px. */
export function AboutHeroBlock({ pill, heading, headingAccent, headingTail, lede, tags, artSrc, primaryButton }: AboutHeroProps) {
  const locale = useLocale()
  return (
    <section className="relative w-full overflow-hidden border-b border-border-default bg-bg-secondary pb-[65px] pt-[34px] min-[851px]:pb-[89px] min-[851px]:pt-[44px]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-[148px] -top-[226px] h-[513px] w-[513px] rounded-full bg-[radial-gradient(circle,var(--color-brand-primary-light)_0%,transparent_69%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[7%] top-[18%] hidden h-[161px] w-[161px] rounded-full border border-brand-primary/20 min-[851px]:block" />
      <div className={`${COMPANY_INNER} relative grid items-center gap-[48px] min-[851px]:grid-cols-[1.3fr_0.7fr]`}>
        <div>
          {pill && <Eyebrow>{pill}</Eyebrow>}
          <h1 className="mb-[20px] text-[28px] font-extrabold leading-[1.25] tracking-tight text-text-primary sm:text-[35px] lg:text-[42px] [&:lang(ja)]:tracking-normal">
            {heading}
            {headingAccent && (<>{/[A-Za-z0-9]$/.test(heading) ? ' ' : ''}<span className="text-brand-primary-dark">{headingAccent}</span></>)}
            {headingTail && (<><br />{headingTail}</>)}
          </h1>
          {lede && <p className="mb-[27px] max-w-[574px] text-[15px] leading-[1.88] text-text-secondary">{lede}</p>}
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-2.5">
              {tags.map((tag, i) => (
                <li key={i} className="rounded-full border border-border-default bg-white/80 px-3 py-2 text-[12px] font-semibold text-text-secondary">{tag}</li>
              ))}
            </ul>
          )}
          {primaryButton && (
            <Link href={withLocale(locale, primaryButton.href)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-[13px] font-semibold text-on-primary shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              {primaryButton.label}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          )}
        </div>
        <div aria-hidden="true" className="relative hidden h-[278px] items-center justify-center min-[851px]:flex">
          <div className="relative grid h-[248px] w-[248px] place-items-center rounded-full border border-brand-primary/40 bg-[radial-gradient(circle,var(--color-brand-primary-light),#f7faf7_67%,transparent_68%)]">
            <div className="absolute inset-[25px] rounded-full border border-dashed border-brand-primary/40" />
            <div className="absolute -inset-[25px] rounded-full border border-dashed border-brand-primary/25" />
            {artSrc && (
              <Image src={artSrc} alt="" width={ORBIT_LOGO_PX} height={ORBIT_LOGO_PX} priority className="h-[97px] w-[97px] object-contain drop-shadow-[0_15px_15px_rgba(44,107,63,0.13)]" />
            )}
            <span className="absolute left-2.5 top-[30px] h-[11px] w-[11px] rounded-full bg-amber-600 shadow-[0_0_0_8px_#fef3c7]" />
            <span className="absolute bottom-[39px] right-[5px] h-[11px] w-[11px] rounded-full bg-brand-dark shadow-[0_0_0_8px_#e2e8f0]" />
          </div>
        </div>
      </div>
    </section>
  )
}
