'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Play } from 'lucide-react'
import { VoiceIcon, type VoiceIconName } from './icons'
import type {
  CardTone, DayFlowProps, DayTone, IconCardsProps, PageIntroProps, RoleSplitProps, RoutingDashboardProps, VoiceHeroProps,
} from './adapters'

const FLOW_STEP_MS = 1700
const FEATURED_NODE_INDEX = 2
// Matches Tailwind's `lg`, where the hero switches to two columns and the video becomes its background.
const DESKTOP_QUERY = '(min-width: 1024px)'

function withLocale(locale: string, href: string): string {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('[')) return href
  const path = href.startsWith('/') ? href : `/${href}`
  return path.startsWith(`/${locale}/`) || path === `/${locale}` ? path : `/${locale}${path}`
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-full bg-brand-primary-light px-3 py-1 text-[12px] font-semibold text-brand-primary-dark">{children}</span>
}

function SectionHeading({ pill, heading }: { pill: string; heading: string }) {
  if (!pill && !heading) return null
  return (
    <div className="mb-7 md:mb-9">
      {pill && <Pill>{pill}</Pill>}
      {heading && <h2 className="mt-2 text-2xl font-bold leading-[1.4] tracking-tight text-text-primary md:text-[30px]">{heading}</h2>}
    </div>
  )
}

const SECTION = 'w-full px-4 py-12 sm:px-6 md:py-16 lg:px-8'
const INNER = 'mx-auto max-w-6xl'

// ── 0. Page intro (inner pages) ───────────────────────────────────────────

export function PageIntroBlock({ pill, heading, body, primaryButton, secondaryButton, note }: PageIntroProps) {
  const locale = useLocale()
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-white via-bg-tertiary/60 to-white px-4 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-6 h-80 w-80 rounded-full bg-brand-primary-light/60 blur-3xl" />
      <div className={`${INNER} relative max-w-4xl`}>
        {pill && <span className="inline-block rounded-full border border-brand-primary/40 bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-brand-primary-dark">{pill}</span>}
        <h1 className="mt-4 text-[28px] font-bold leading-[1.35] tracking-tight text-text-primary sm:text-4xl lg:text-[40px]">{heading}</h1>
        {body && <p className="mt-5 max-w-2xl text-[14px] leading-[1.9] text-text-secondary">{body}</p>}
        {(primaryButton || secondaryButton) && (
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryButton && (
              <Link href={withLocale(locale, primaryButton.href)} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-[14px] font-semibold text-on-primary shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {primaryButton.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
            {secondaryButton && (
              <Link href={withLocale(locale, secondaryButton.href)} className="inline-flex items-center rounded-full border-2 border-brand-primary bg-white/70 px-6 py-3 text-[14px] font-semibold text-brand-primary-dark hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {secondaryButton.label}
              </Link>
            )}
          </div>
        )}
        {note && <p className="mt-4 text-[11.5px] text-text-muted">{note}</p>}
      </div>
    </section>
  )
}

// ── 1. Hero with the animated call flow ───────────────────────────────────

export function VoiceHeroBlock({ pill, heading, body, primaryButton, secondaryButton, note, pauseLabel, playLabel, nodes, backgroundVideo }: VoiceHeroProps) {
  const locale = useLocale()
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const animated = playing && !reduceMotion
  // null until the browser reports the width, so only one of the two video placements ever loads.
  const [wideScreen, setWideScreen] = useState<boolean | null>(null)
  const showVideo = Boolean(backgroundVideo) && !reduceMotion && wideScreen !== null

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    const update = () => setWideScreen(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!animated || nodes.length === 0) return
    const timer = setInterval(() => setActive((i) => (i + 1) % nodes.length), FLOW_STEP_MS)
    return () => clearInterval(timer)
  }, [animated, nodes.length])

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-white via-bg-tertiary/60 to-white px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:px-8">
      {showVideo && wideScreen && (
        <>
          <video src={backgroundVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/30" />
        </>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-brand-primary-light/60 blur-3xl" />
      <div className={`${INNER} relative grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]`}>
        {/* Below lg the video is the background of this text block, bleeding to the screen edges and up to the header. */}
        <div className="relative -mx-4 -mt-10 overflow-hidden px-4 pb-8 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14 lg:mx-0 lg:mt-0 lg:overflow-visible lg:p-0">
          {showVideo && !wideScreen && (
            <>
              <video src={backgroundVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/30" />
            </>
          )}
          <div className="relative">
          {pill && <span className="inline-block rounded-full border border-brand-primary/40 bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-brand-primary-dark">{pill}</span>}
          <h1 className="mt-5 whitespace-pre-line text-[28px] font-bold leading-[1.35] tracking-tight text-text-primary sm:text-4xl lg:text-[42px]">{heading}</h1>
          <p className="mt-5 max-w-xl text-[14px] leading-[1.9] text-text-primary">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryButton && (
              <Link href={withLocale(locale, primaryButton.href)} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-[14px] font-semibold text-on-primary shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {primaryButton.label}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
            {secondaryButton && (
              <Link href={withLocale(locale, secondaryButton.href)} className="inline-flex items-center rounded-full border-2 border-brand-primary bg-white/70 px-6 py-3 text-[14px] font-semibold text-brand-primary-dark hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {secondaryButton.label}
              </Link>
            )}
          </div>
          {note && <p className="mt-4 text-[11.5px] text-text-muted">{note}</p>}
          </div>
        </div>

        <div>
          <ol className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3" aria-label={heading.replace(/\n/g, ' ')}>
            {nodes.map((node, i) => {
              const isActive = !reduceMotion && i === active
              const featured = i === FEATURED_NODE_INDEX
              const lastInRow = (i + 1) % 3 === 0
              return (
                <li
                  key={i}
                  aria-current={isActive ? 'step' : undefined}
                  className={`relative flex flex-col items-center rounded-2xl border bg-white p-4 text-center shadow-sm transition-[transform,box-shadow] duration-300 ${
                    isActive ? '-translate-y-1 border-brand-primary shadow-md ring-2 ring-brand-primary/25' : 'border-border-default'
                  }`}
                >
                  <span className={`flex items-center justify-center rounded-full ${featured ? 'h-16 w-16 bg-brand-primary text-on-primary' : 'h-12 w-12 bg-bg-tertiary text-brand-primary-dark'}`}>
                    <VoiceIcon name={node.icon} size={featured ? 28 : 22} />
                  </span>
                  <span className="mt-2 text-[13px] font-bold leading-snug text-text-primary">{node.label}</span>
                  {node.sub && <span className="mt-0.5 text-[11.5px] leading-snug text-text-secondary">{node.sub}</span>}
                  {!lastInRow && i < nodes.length - 1 && (
                    <ArrowRight aria-hidden="true" size={18} className="absolute -right-5 top-1/2 hidden -translate-y-1/2 text-brand-primary-dark sm:block" />
                  )}
                </li>
              )
            })}
          </ol>
          {!reduceMotion && (
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setPlaying((p) => !p)} className="rounded-full border border-border-default bg-white/80 px-4 py-1.5 text-[12px] font-medium text-text-secondary hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                {playing ? pauseLabel : playLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── 2. Icon cards (problems, demo scenarios) ──────────────────────────────

const TONE_BG: Record<CardTone, string> = {
  green: 'bg-brand-primary-light text-brand-primary-dark',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700',
  rose: 'bg-rose-50 text-rose-700',
}

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function IconCardsBlock({ pill, heading, intro, columns, cards, cta, footnote }: IconCardsProps) {
  const locale = useLocale()
  if (cards.length === 0) return null
  return (
    <section className={`${SECTION} bg-bg-tertiary/40`}>
      <div className={INNER}>
        <SectionHeading pill={pill} heading={heading} />
        {intro && <p className="-mt-5 mb-7 max-w-2xl text-[14px] leading-[1.8] text-text-secondary">{intro}</p>}
        <ul className={`grid gap-4 ${GRID_COLS[columns]}`}>
          {cards.map((card, i) => (
            <li key={i} className="rounded-2xl border border-border-default bg-white p-5 shadow-sm">
              <div className={`flex h-24 items-center justify-center rounded-xl ${TONE_BG[card.tone]}`}>
                <VoiceIcon name={card.icon} size={40} />
              </div>
              <h3 className="mt-4 text-[15px] font-bold leading-snug text-text-primary">{card.title}</h3>
              {card.text && <p className="mt-1.5 text-[12.5px] leading-[1.8] text-text-secondary">{card.text}</p>}
            </li>
          ))}
          {cta && (
            <li className="flex flex-col items-center justify-center rounded-2xl border-2 border-brand-primary bg-white p-5 text-center shadow-sm">
              <Link href={withLocale(locale, cta.href)} className="inline-flex items-center gap-2 text-[15px] font-bold text-brand-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-on-primary"><Play aria-hidden="true" size={16} /></span>
                {cta.label}
              </Link>
              {cta.subLabel && (
                <Link href={withLocale(locale, cta.subHref)} className="mt-3 text-[12px] text-text-secondary underline">{cta.subLabel}</Link>
              )}
            </li>
          )}
        </ul>
        {footnote && <p className="mt-4 text-[12px] text-text-muted">{footnote}</p>}
      </div>
    </section>
  )
}

// ── 3. Day timeline ───────────────────────────────────────────────────────

const DAY_STYLES: Record<DayTone, { bg: string; icon: string }> = {
  day: { bg: 'bg-gradient-to-br from-sky-100 via-white to-amber-100', icon: 'text-amber-500' },
  dusk: { bg: 'bg-gradient-to-br from-indigo-100 via-slate-100 to-brand-primary-light', icon: 'text-indigo-500' },
  night: { bg: 'bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900', icon: 'text-amber-300' },
  morning: { bg: 'bg-gradient-to-br from-sky-100 via-white to-brand-primary-light', icon: 'text-brand-primary-dark' },
}

export function DayFlowBlock({ pill, heading, steps }: DayFlowProps) {
  if (steps.length === 0) return null
  return (
    <section className={`${SECTION} bg-white`}>
      <div className={INNER}>
        <SectionHeading pill={pill} heading={heading} />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const style = DAY_STYLES[step.tone]
            return (
              <li key={i} className="relative overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm">
                <div className={`flex h-28 items-center justify-center ${style.bg}`}>
                  <VoiceIcon name={step.icon} size={48} className={style.icon} />
                </div>
                <div className="p-4">
                  <h3 className="text-[14px] font-bold text-text-primary">{step.title}</h3>
                  {step.text && <p className="mt-1 text-[12.5px] leading-[1.7] text-text-secondary">{step.text}</p>}
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight aria-hidden="true" size={18} className="absolute -right-0.5 top-12 hidden text-brand-primary-dark lg:block" />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

// ── 4. Routing list + dashboard mock ──────────────────────────────────────

function IconList({ items }: { items: { icon: VoiceIconName; text: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 text-[13.5px] text-text-primary">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-brand-primary-dark">
            <VoiceIcon name={item.icon} size={16} />
          </span>
          {item.text}
        </li>
      ))}
    </ul>
  )
}

export function RoutingDashboardBlock({ pill, heading, statusBadge, leftItems, rightItems, note, dashboard }: RoutingDashboardProps) {
  return (
    <section className={`${SECTION} bg-bg-tertiary/40`}>
      <div className={`${INNER} grid items-start gap-10 lg:grid-cols-[1fr_1.25fr]`}>
        <div>
          <SectionHeading pill={pill} heading={heading} />
          {statusBadge && <p className="-mt-4 mb-5"><span className="rounded-full bg-amber-100 px-3 py-1 text-[11.5px] font-semibold text-amber-800">{statusBadge}</span></p>}
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <IconList items={leftItems} />
            <IconList items={rightItems} />
          </div>
          {note && <p className="mt-6 text-[12px] leading-[1.8] text-text-muted">{note}</p>}
        </div>

        <figure className="overflow-x-auto rounded-2xl border border-border-default bg-white shadow-lg">
          <div className="min-w-[620px]">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-2 text-[11px] font-bold text-brand-primary-dark">
              <span>TechMirai</span>
              {dashboard.demoLabel && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{dashboard.demoLabel}</span>}
            </div>
            <div className="grid grid-cols-[120px_1fr_190px] text-[10.5px]">
              <nav aria-label={dashboard.menuHeading || undefined} className="border-r border-border-default p-3">
                <ul className="space-y-1.5">
                  {dashboard.menu.map((item, i) => (
                    <li key={i} className={`rounded-md px-2 py-1.5 ${i === 0 ? 'bg-bg-tertiary font-semibold text-brand-primary-dark' : 'text-text-secondary'}`}>{item}</li>
                  ))}
                </ul>
              </nav>
              <div className="border-r border-border-default p-3">
                <p className="mb-2 text-[11px] font-bold text-text-primary">{dashboard.listTitle}</p>
                <ul className="mb-2 flex flex-wrap gap-1.5">
                  {dashboard.filters.map((f, i) => (
                    <li key={i} className={`rounded px-2 py-0.5 ${i === 0 ? 'bg-brand-primary text-on-primary' : 'bg-bg-tertiary text-text-secondary'}`}>{f}</li>
                  ))}
                </ul>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-text-muted">
                      {dashboard.columns.map((c, i) => <th key={i} scope="col" className="py-1 pr-1 font-semibold">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.rows.map((r, i) => (
                      <tr key={i} className="border-t border-border-default text-text-primary">
                        <td className="py-1.5 pr-1">{r.time}</td>
                        <td className="pr-1">{r.caller}</td>
                        <td className="pr-1">{r.topic}</td>
                        <td>
                          <span className={`rounded px-1.5 py-0.5 ${r.tone === 'alert' ? 'bg-rose-100 text-rose-700' : 'bg-brand-primary-light text-brand-primary-dark'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3">
                <p className="mb-2 text-[11px] font-bold text-text-primary">{dashboard.detailTitle}</p>
                <dl className="space-y-1.5">
                  {dashboard.detailRows.map((r, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <dt className="text-text-muted">{r.label}</dt>
                      <dd className="text-right text-text-primary">{r.value}</dd>
                    </div>
                  ))}
                </dl>
                {dashboard.audioLabel && (
                  <div className="mt-3 rounded-md border border-border-default p-2">
                    <p className="mb-1 text-text-muted">{dashboard.audioLabel}</p>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-on-primary"><Play aria-hidden="true" size={10} /></span>
                      <span className="h-1 flex-1 rounded bg-bg-tertiary"><span className="block h-1 w-1/4 rounded bg-brand-primary" /></span>
                      <span className="text-text-muted">00:00 / 02:34</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  )
}

// ── 5. AI / people split ──────────────────────────────────────────────────

function RoleCard({ tone, icon, heading, items }: { tone: 'ai' | 'human'; icon: 'user' | 'headset'; heading: string; items: string[] }) {
  const ai = tone === 'ai'
  return (
    <div className={`rounded-2xl border p-6 ${ai ? 'border-brand-primary/40 bg-brand-primary-light' : 'border-rose-100 bg-rose-50'}`}>
      <h3 className={`flex items-center gap-2 text-[16px] font-bold ${ai ? 'text-brand-primary-dark' : 'text-rose-700'}`}>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${ai ? 'bg-brand-primary-dark' : 'bg-rose-500'} text-white`}><VoiceIcon name={icon} size={18} /></span>
        {heading}
      </h3>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.7] text-text-primary">
            <Check aria-hidden="true" size={15} className={`mt-1 shrink-0 ${ai ? 'text-brand-primary-dark' : 'text-rose-500'}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RoleSplitBlock({ pill, heading, aiHeading, aiItems, humanHeading, humanItems, tagline }: RoleSplitProps) {
  return (
    <section className={`${SECTION} bg-white`}>
      <div className={INNER}>
        <SectionHeading pill={pill} heading={heading} />
        <div className="grid items-center gap-5 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <RoleCard tone="ai" icon="user" heading={aiHeading} items={aiItems} />
          <RoleCard tone="human" icon="headset" heading={humanHeading} items={humanItems} />
          {tagline && (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-bg-tertiary p-6 text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-primary-dark shadow-sm"><VoiceIcon name="headset" size={40} /></span>
              <p className="whitespace-pre-line text-[14px] font-semibold leading-[1.9] text-text-primary">{tagline}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
