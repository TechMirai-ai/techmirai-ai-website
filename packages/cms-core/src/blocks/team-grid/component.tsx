'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { TeamGridBlockProps, TeamGridCardMember } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function Card({
  name,
  title,
  line,
  photoUrl,
}: {
  name: string
  title?: string | undefined
  line?: string | undefined
  photoUrl?: string | undefined
}) {
  return (
    <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm flex flex-col gap-3">
      <div className="h-20 w-20 rounded-full overflow-hidden bg-bg-tertiary shrink-0">
        {photoUrl && <Image src={photoUrl} alt={name} width={80} height={80} className="h-full w-full object-cover" />}
      </div>
      <div>
        <h3 className="text-[14.5px] font-bold text-text-primary leading-snug">{name}</h3>
        {title && <p className="text-[12.5px] font-semibold text-brand-primary">{title}</p>}
      </div>
      {line && <p className="text-[13px] leading-relaxed text-text-muted">{line}</p>}
    </div>
  )
}

export function TeamGridBlock({
  sectionHeading,
  intro,
  bullets,
  members,
  partner,
  columns,
  buttonLabel,
  buttonHref,
}: TeamGridBlockProps) {
  const locale = useLocale()

  if ((!members || members.length === 0) && !partner) return null

  const gridColsClass = columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-5xl text-center mb-8 md:mb-10">
        {sectionHeading && (
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2]">
            {sectionHeading}
          </h2>
        )}
        {intro && (
          <p className="mx-auto mt-3 max-w-2xl text-[13.5px] md:text-[15px] leading-relaxed text-text-muted font-normal">
            {intro}
          </p>
        )}
        {bullets && bullets.length > 0 && (
          <ul className="mx-auto mt-4 max-w-2xl flex flex-col gap-1.5 text-left sm:text-center">
            {bullets.map((text, i) => (
              <li key={i} className="text-[13px] text-text-secondary font-medium">
                {text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className={`mx-auto max-w-6xl grid grid-cols-1 ${gridColsClass} gap-4 md:gap-5`}
      >
        {members.map((m: TeamGridCardMember) => (
          <motion.div key={m.id} variants={fadeInUp}>
            <Card name={m.name} title={m.title} line={m.line} photoUrl={m.photoUrl} />
          </motion.div>
        ))}
        {partner && (
          <motion.div variants={fadeInUp}>
            <Card name={partner.name} title={partner.role} line={partner.line} photoUrl={partner.photoUrl} />
          </motion.div>
        )}
      </motion.div>

      {buttonLabel && buttonHref && (
        <div className="mx-auto max-w-6xl mt-8 text-center">
          <Link
            href={withLocale(locale, buttonHref)}
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            {buttonLabel}
          </Link>
        </div>
      )}
    </section>
  )
}
