'use client'

import { useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { staggerContainer, fadeInUp } from '../../lib/motion'
import type { LiveDemoBlockProps } from './types'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('[')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

export function LiveDemoBlock({
  heading,
  body,
  checklistItems,
  buttonLabel,
  buttonHref,
  qrCaption,
  smallPrint,
  threeStepStrip,
  tiles,
  qrCodeDataUrl,
}: LiveDemoBlockProps) {
  const locale = useLocale()

  if (!tiles || tiles.length === 0) return null

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-secondary">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 items-start mb-10 md:mb-14">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-text-primary leading-[1.2] mb-3">
            {heading}
          </h2>
          {body && <p className="text-[13.5px] md:text-[15px] leading-relaxed text-text-muted mb-5">{body}</p>}

          {checklistItems && checklistItems.length > 0 && (
            <ul className="flex flex-col gap-2 mb-6">
              {checklistItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-text-primary">
                  <Check className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}

          {buttonLabel && buttonHref && (
            // Plain <a>, not next/link: this points at an external demo
            // environment (siteConfig.integrations.demoUrl, same bracketed-
            // placeholder shape as Hero's secondaryButton) — Next's <Link>
            // rejects any href containing "[" / "]".
            <a
              href={buttonHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-primary-dark"
            >
              {buttonLabel}
            </a>
          )}

          {smallPrint && <p className="mt-3 text-[11.5px] text-text-muted italic">{smallPrint}</p>}
        </div>

        {/* QR code: desktop-only per Spec §19's visuals-inventory note */}
        {qrCodeDataUrl && (
          <div className="hidden lg:flex flex-col items-center gap-2 shrink-0">
            <div className="rounded-xl border border-border-default bg-white p-3 shadow-sm">
              <Image src={qrCodeDataUrl} alt="" width={140} height={140} unoptimized />
            </div>
            {qrCaption && <p className="max-w-[160px] text-center text-[11px] text-text-muted">{qrCaption}</p>}
          </div>
        )}
      </div>

      {threeStepStrip && threeStepStrip.length > 0 && (
        <div className="mx-auto max-w-3xl mb-10 md:mb-14 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {threeStepStrip.map((step, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="rounded-full bg-white border border-border-default px-3 py-1.5 text-[12px] md:text-[13px] font-medium text-text-primary whitespace-nowrap">
                {step.text}
              </span>
              {i < threeStepStrip.length - 1 && (
                <span className="text-brand-primary/50" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
      >
        {tiles.map((tile, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            className="rounded-xl border border-border-default bg-white p-5 shadow-sm flex flex-col gap-2"
          >
            <h3 className="text-[14.5px] font-bold text-text-primary">{tile.label}</h3>
            <p className="text-[13px] leading-relaxed text-text-muted flex-1">{tile.description}</p>
            {tile.buttonLabel && (
              <Link
                href={withLocale(locale, tile.href)}
                className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-primary hover:underline"
              >
                <span>{tile.buttonLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
