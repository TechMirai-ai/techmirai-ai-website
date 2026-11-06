'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ExternalLink } from 'lucide-react'
import { VoiceIcon } from './icons'
import { withLocale } from './components'
import { COMPANY_INNER, COMPANY_SECTION_Y, DISPLAY_TRACKING, Eyebrow } from './company-parts'
import type { CardTone, ContactBannerProps, MissionSplitProps, PartnerCardProps, TeamSplitProps } from './adapters'

// /company sections sized to TechMirai_About_Us_Webpage.html: same grids,
// gaps, paddings and breakpoints (850px / 640px), project fonts and colours.

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

// ── Mission: 0.9fr / 1.1fr, 65px gap ───────────────────────────────────────

export function MissionSplitBlock({ pill, heading, body, quote, caption }: MissionSplitProps) {
  return (
    <section className={`${COMPANY_SECTION_Y} w-full bg-white`}>
      <div className={`${COMPANY_INNER} grid items-center gap-6 min-[851px]:grid-cols-[0.9fr_1.1fr] min-[851px]:gap-[57px]`}>
        <div className="relative grid min-h-[196px] place-items-center overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-primary-light to-bg-tertiary min-[851px]:min-h-[270px]">
          <div aria-hidden="true" className="absolute -left-[65px] -top-20 h-[218px] w-[218px] rounded-full border-[38px] border-brand-primary/20" />
          <div aria-hidden="true" className="absolute -bottom-[61px] -right-[39px] h-[165px] w-[165px] rounded-full border-[28px] border-brand-dark/10" />
          <div className="relative z-[1] text-center">
            <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className="mx-auto h-[78px] w-[78px]">
              <circle cx="50" cy="50" r="36" strokeWidth="3" className="stroke-brand-primary" />
              <path d="M30 53L44 67 72 34" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-dark" />
            </svg>
            {caption && <strong className="mt-[9px] block text-[17px] text-brand-primary-dark">{caption}</strong>}
          </div>
        </div>
        <div>
          {pill && <Eyebrow>{pill}</Eyebrow>}
          {heading && <h2 className={`mb-[19px] text-[28px] font-extrabold leading-[1.2] text-text-primary min-[641px]:text-[36px] ${DISPLAY_TRACKING}`}>{heading}</h2>}
          {body && <p className="text-[14px] leading-[1.6] text-text-secondary">{body}</p>}
          {quote && <div className="mt-[22px] border-l-4 border-brand-primary py-3 pl-[18px] text-[17px] font-bold leading-[1.5] text-brand-dark">{quote}</div>}
        </div>
      </div>
    </section>
  )
}

// ── Team: text left, always-2x2 feature cards right, sage band ─────────────

const TONE: Record<CardTone, string> = {
  green: 'bg-brand-primary-light text-brand-primary-dark',
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
}

export function TeamSplitBlock({ pill, heading, paragraphs, cards }: TeamSplitProps) {
  return (
    <section className={`${COMPANY_SECTION_Y} w-full border-y border-border-default bg-bg-tertiary/40`}>
      <div className={`${COMPANY_INNER} grid items-center gap-[26px] min-[851px]:grid-cols-2 min-[851px]:gap-16`}>
        <div>
          {pill && <Eyebrow>{pill}</Eyebrow>}
          {heading && <h2 className={`mb-5 text-[28px] font-extrabold leading-[1.17] text-text-primary min-[641px]:text-[37px] ${DISPLAY_TRACKING}`}>{heading}</h2>}
          {paragraphs.map((text, i) => (
            <p key={i} className="mb-4 text-[14px] leading-[1.6] text-text-secondary">{text}</p>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-[9px] min-[641px]:gap-[12px]">
          {cards.map((card, i) => (
            <li key={i} className="min-h-[138px] rounded-[15px] border border-border-default bg-white px-[13px] py-[16px] shadow-sm min-[641px]:min-h-[144px] min-[641px]:px-[20px] min-[641px]:py-[22px]">
              <div className={`mb-[13px] grid h-10 w-10 place-items-center rounded-[11px] ${TONE[card.tone]}`}>
                <VoiceIcon name={card.icon} size={21} />
              </div>
              <h3 className="text-[13px] font-bold leading-snug text-text-primary min-[641px]:text-[14px]">{card.title}</h3>
              {card.text && <p className="mt-[5px] text-[12px] leading-[1.6] text-text-secondary min-[641px]:text-[13px]">{card.text}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── Partner: section head + 330px / 1fr card ───────────────────────────────

export function PartnerCardBlock({ pill, heading, intro, brandName, brandNote, name, paragraphs, linkLabel, linkHref }: PartnerCardProps) {
  return (
    <section className={`${COMPANY_SECTION_Y} w-full`}>
      <div className={COMPANY_INNER}>
        <div className="mb-[34px] max-w-[618px]">
          {pill && <Eyebrow>{pill}</Eyebrow>}
          {heading && <h2 className={`mb-[15px] text-[clamp(25px,3.5vw,38px)] font-extrabold leading-[1.2] text-text-primary ${DISPLAY_TRACKING}`}>{heading}</h2>}
          {intro && <p className="text-[14px] leading-[1.6] text-text-secondary">{intro}</p>}
        </div>
        <div className="grid items-center gap-[19px] rounded-[22px] border border-border-default bg-white p-[26px] shadow-[0_20px_60px_rgba(37,55,43,0.08)] min-[851px]:grid-cols-[330px_1fr] min-[851px]:gap-[47px] min-[851px]:p-[45px]">
          <div className="flex min-h-[131px] flex-col items-center justify-center rounded-[17px] border border-border-default bg-gradient-to-br from-brand-primary-light to-bg-tertiary min-[851px]:min-h-[187px]">
            <div className="text-[19px] font-extrabold tracking-[0.075em] text-brand-dark min-[641px]:text-[25px]">{brandName}</div>
            {brandNote && <small className="mt-[9px] text-[12px] uppercase tracking-[0.08em] text-text-muted">{brandNote}</small>}
          </div>
          <div>
            {name && <h3 className="mb-3 text-[23px] font-bold tracking-[-0.02em] text-text-primary">{name}</h3>}
            {paragraphs.map((text, i) => (
              <p key={i} className="mb-[11px] text-[14px] leading-[1.6] text-text-secondary">{text}</p>
            ))}
            {linkLabel && linkHref && (
              <a href={linkHref} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex min-h-11 items-center gap-2 border-b border-brand-primary/50 pb-1 font-bold text-brand-primary-dark ${FOCUS}`}>
                {linkLabel}
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Contact: dark banner (text + button) and 1.2fr / 1fr contact grid ──────

export function ContactBannerBlock({ pill, heading, body, primaryButton, columns }: ContactBannerProps) {
  const locale = useLocale()
  return (
    <section className={`${COMPANY_SECTION_Y} w-full bg-white`}>
      <div className={COMPANY_INNER}>
        <div className="grid items-center gap-[26px] rounded-[22px] bg-gradient-to-br from-brand-dark to-brand-primary-dark px-[22px] py-8 text-white min-[641px]:px-[44px] min-[641px]:py-12 min-[851px]:grid-cols-[1fr_auto]">
          <div>
            {pill && <Eyebrow tone="dark">{pill}</Eyebrow>}
            {heading && <h2 className={`mb-2.5 text-[25px] font-extrabold leading-[1.2] min-[641px]:text-[32px] ${DISPLAY_TRACKING}`}>{heading}</h2>}
            {body && <p className="max-w-[539px] text-[14px] leading-[1.6] text-white/85">{body}</p>}
          </div>
          {primaryButton && (
            <Link href={withLocale(locale, primaryButton.href)} className={`inline-flex min-h-11 items-center justify-center rounded-full bg-brand-primary px-7 py-3.5 text-center text-[13px] font-bold text-on-primary hover:opacity-90 ${FOCUS}`}>
              {primaryButton.label}
            </Link>
          )}
        </div>
        {columns.length > 0 && (
          <div className="mt-[33px] grid gap-10 min-[641px]:grid-cols-[1.2fr_1fr]">
            {columns.map((col, i) => (
              <div key={i}>
                <h4 className="mb-2.5 text-[14px] font-bold text-text-primary">{col.title}</h4>
                <p className="text-[13px] leading-[1.9] text-text-secondary">
                  {col.lines.map((line, j) => (
                    <span key={j} className="block">
                      {line.href ? <a href={line.href} className={`text-brand-primary-dark underline-offset-4 hover:underline ${FOCUS}`}>{line.text}</a> : line.text}
                    </span>
                  ))}
                  {col.note && <span className="block text-[12px]">{col.note}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
