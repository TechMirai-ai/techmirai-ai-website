'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Globe, Play } from 'lucide-react'
import { withLocale } from './components'
import type { HomeHeroProps } from './adapters'

// Homepage hero from docs HOMEPAGE-UX-DESIGN.pdf: headline + buttons on the
// left, a locale-specific voiceover video on the right.

const INNER = 'mx-auto max-w-6xl'
const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const HERO_VIDEO_EN = '/video/TechMirai-AI-Receptionist-English-Voiceover.mp4'
const HERO_VIDEO: Record<string, string> = {
  en: HERO_VIDEO_EN,
  ja: '/video/TechMirai-AI-Receptionist-Japanese-Voiceover.mp4',
}

function HeroVideo({ src, label }: { src: string; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border-default bg-white p-2 shadow-[0_24px_60px_rgba(27,42,69,0.10)] sm:p-3">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="aspect-video w-full rounded-2xl bg-brand-dark"
      >
        <source src={src} type="video/mp4" />
      </video>
      {!playing && (
        <button
          type="button"
          aria-label={`Play video: ${label}`}
          onClick={() => void videoRef.current?.play()}
          className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary-dark text-white shadow-lg transition-transform hover:scale-105 sm:h-20 sm:w-20 ${FOCUS}`}
        >
          <Play aria-hidden="true" size={30} fill="currentColor" className="ml-1" />
        </button>
      )}
    </div>
  )
}

export function HomeHeroBlock({ pill, heading, headingAccent, body, primaryButton, secondaryButton, note }: HomeHeroProps) {
  const locale = useLocale()
  const videoSrc = HERO_VIDEO[locale] ?? HERO_VIDEO_EN
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

        <div className="relative lg:pl-6">
          <HeroVideo key={locale} src={videoSrc} label={heading} />
        </div>
      </div>
    </section>
  )
}
