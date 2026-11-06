'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Check, Globe, Mic, Play } from 'lucide-react'
import { VoiceIcon } from './icons'
import { withLocale } from './components'
import type { HomeHeroProps } from './adapters'

// Homepage hero from docs HOMEPAGE-UX-DESIGN.pdf: headline + buttons on the
// left, a static "Live call" card on the right.

const INNER = 'mx-auto max-w-6xl'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const BAR_HEIGHTS = [10, 18, 28, 16, 34, 22, 12, 30, 38, 20, 14, 32, 26, 40, 18, 12, 28, 36, 22, 16, 30, 24, 12, 34, 20, 38, 14, 26, 32, 18, 10, 28, 22, 36, 16, 30, 12, 24, 34, 20]

function Waveform() {
  return (
    <div aria-hidden="true" className="mt-4 flex h-10 items-center gap-[3px]">
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}px`, animationDelay: `${(i % 8) * 120}ms` }}
          className="w-[3px] rounded-full bg-brand-primary motion-safe:animate-pulse"
        />
      ))}
    </div>
  )
}

export function HomeHeroBlock({ pill, heading, headingAccent, body, primaryButton, secondaryButton, note, callCard }: HomeHeroProps) {
  const locale = useLocale()
  const needsSpace = /[,A-Za-z0-9]$/.test(heading)
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-bg-tertiary/80 via-bg-tertiary/30 to-white px-4 pb-16 pt-5 sm:px-6 md:pb-24 md:pt-8 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-6 h-96 w-96 rounded-full bg-brand-primary-light/70 blur-3xl" />
      <div className={`${INNER} relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-10`}>
        <div>
          {pill && <span className="inline-block rounded-full bg-brand-primary-light px-4 py-1.5 text-[13px] font-semibold text-brand-primary-dark">{pill}</span>}
          <h1 className="mt-6 text-[28px] font-extrabold leading-[1.25] tracking-tight text-text-primary sm:text-[35px] lg:text-[42px] [&:lang(ja)]:tracking-normal">
            {heading}
            {headingAccent && (<>{needsSpace ? ' ' : ''}<span className="text-brand-primary-dark">{headingAccent}</span></>)}
          </h1>
          {body && <p className="mt-5 max-w-xl text-[15px] leading-[1.8] text-text-secondary md:text-[16px]">{body}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryButton && (
              <Link href={withLocale(locale, primaryButton.href)} className={`inline-flex min-h-12 items-center gap-2.5 rounded-full bg-brand-primary-dark px-7 py-3 text-[14px] font-bold text-white shadow-sm hover:opacity-90 ${FOCUS}`}>
                <Play aria-hidden="true" size={16} />
                {primaryButton.label}
              </Link>
            )}
            {secondaryButton && (
              <Link href={withLocale(locale, secondaryButton.href)} className={`inline-flex min-h-12 items-center rounded-full border-2 border-brand-primary-dark bg-white/60 px-7 py-3 text-[14px] font-bold text-brand-primary-dark hover:bg-white ${FOCUS}`}>
                {secondaryButton.label}
              </Link>
            )}
          </div>
          {note && (
            <p className="mt-5 flex items-center gap-2 text-[13px] text-text-secondary">
              <Globe aria-hidden="true" size={16} />
              {note}
            </p>
          )}
        </div>

        <div className="relative pb-5 pt-4 lg:pl-6">
          <div className="relative rounded-3xl border border-border-default bg-white p-5 shadow-[0_24px_60px_rgba(27,42,69,0.10)] sm:p-6">
            {callCard.handledLabel && (
              <span className="absolute -top-4 right-4 inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-white px-3.5 py-2 text-[13px] font-bold text-text-primary shadow-md sm:right-6">
                <Check aria-hidden="true" size={15} className="text-brand-primary-dark" />
                {callCard.handledLabel}
              </span>
            )}
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-red-500" />
                {callCard.liveLabel} · {callCard.timer}
              </span>
              <span className="text-[12px] text-text-muted">{callCard.sampleLabel}</span>
            </div>
            <p className="mt-4 max-w-[88%] rounded-2xl bg-slate-100 px-4 py-3 text-[13px] leading-[1.6] text-text-primary">{callCard.callerText}</p>
            <div className="ml-auto mt-3 max-w-[92%] rounded-2xl border border-brand-primary/40 bg-brand-primary-light px-4 py-3">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary-dark">
                <Mic aria-hidden="true" size={13} />
                {callCard.agentLabel}
              </p>
              <p className="mt-1 text-[13px] leading-[1.6] text-text-primary">{callCard.agentText}</p>
            </div>
            <Waveform />
            <ul className="mt-4 flex flex-wrap gap-2">
              {callCard.chips.map((chip, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-3 py-2 text-[12.5px] font-semibold text-white">
                  <VoiceIcon name={chip.icon} size={14} />
                  {chip.text}
                </li>
              ))}
            </ul>
            {callCard.followUpLabel && (
              <span className="absolute -bottom-4 left-4 inline-flex items-center gap-1.5 rounded-xl border border-border-default bg-white px-3.5 py-2 text-[13px] font-bold text-text-primary shadow-md sm:-left-3">
                <VoiceIcon name="user" size={14} />
                {callCard.followUpLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
