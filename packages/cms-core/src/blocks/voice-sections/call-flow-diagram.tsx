'use client'

import { ArrowDown, Bot, PhoneCall, UserRound } from 'lucide-react'
import { VoiceIcon } from './icons'
import { SECTION } from './components'
import type { CallFlowProps, FlowTone } from './adapters'

// "How it works" flow, left to right on wide screens:
//   customer -> AI voice agent -> three path cards -> summary and record
// with elbow connectors between the agent and the cards, and from the cards
// into the summary card. Below 1200px everything stacks vertically.
// Desktop geometry is fixed so the connector lines meet the card centres.
// CARD_H and CARD_GAP must match the Tailwind classes
// `min-[1200px]:h-[112px]` (card) and `gap-[12px]` (list) below.

const INNER = 'mx-auto max-w-6xl'
const CARD_H = 112
const CARD_GAP = 12
const ARROW_LEN = 10
const ARROW_HALF = 7
const FAN_W = 72
const FAN_TRUNK_X = 36
const MERGE_W = 48
const MERGE_TRUNK_X = 20

const CARD_TONE: Record<FlowTone, { card: string; icon: string; number: string; divider: string; text: string }> = {
  primary: {
    card: 'bg-brand-primary-dark text-white',
    icon: 'bg-white text-brand-primary-dark',
    number: 'text-white/75',
    divider: 'border-white/40',
    text: 'text-white/90',
  },
  light: {
    card: 'border border-border-default bg-white text-text-primary',
    icon: 'bg-brand-primary-light text-brand-primary-dark',
    number: 'text-brand-primary',
    divider: 'border-border-default',
    text: 'text-text-secondary',
  },
  dark: {
    card: 'bg-brand-dark text-white',
    icon: 'bg-white text-brand-dark',
    number: 'text-white/50',
    divider: 'border-white/40',
    text: 'text-white/90',
  },
}

function DownArrow() {
  return <ArrowDown aria-hidden="true" size={26} strokeWidth={2.5} className="shrink-0 text-brand-dark min-[1200px]:hidden" />
}

function cardCentres(count: number): { total: number; ys: number[] } {
  return {
    total: count * CARD_H + (count - 1) * CARD_GAP,
    ys: Array.from({ length: count }, (_, i) => i * (CARD_H + CARD_GAP) + CARD_H / 2),
  }
}

const STROKE = { stroke: 'var(--color-brand-dark)', strokeWidth: 2.5, fill: 'none', strokeLinecap: 'square' as const }

/** Decorative connector from the agent: a trunk with one arrow to each card centre. */
function FanConnector({ count }: { count: number }) {
  const { total, ys } = cardCentres(count)
  const mid = total / 2
  const lineEnd = FAN_W - ARROW_LEN
  const branched = count > 1
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${FAN_W} ${total}`} width={FAN_W} height={total} className="hidden shrink-0 min-[1200px]:block">
      <g {...STROKE}>
        {branched ? <path d={`M0 ${mid}H${FAN_TRUNK_X}`} /> : null}
        {branched ? <path d={`M${FAN_TRUNK_X} ${ys[0]}V${ys[count - 1]}`} /> : null}
        {ys.map((y) => <path key={y} d={`M${branched ? FAN_TRUNK_X : 0} ${y}H${lineEnd}`} />)}
      </g>
      <g fill="var(--color-brand-dark)">
        {ys.map((y) => (
          <polygon key={y} points={`${lineEnd},${y - ARROW_HALF} ${FAN_W},${y} ${lineEnd},${y + ARROW_HALF}`} />
        ))}
      </g>
    </svg>
  )
}

/** Decorative connector into the summary: every card joins one trunk with a single arrow out. */
function MergeConnector({ count }: { count: number }) {
  const { total, ys } = cardCentres(count)
  const mid = total / 2
  const lineEnd = MERGE_W - ARROW_LEN
  const branched = count > 1
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${MERGE_W} ${total}`} width={MERGE_W} height={total} className="hidden shrink-0 min-[1200px]:block">
      <g {...STROKE}>
        {branched ? ys.map((y) => <path key={y} d={`M0 ${y}H${MERGE_TRUNK_X}`} />) : null}
        {branched ? <path d={`M${MERGE_TRUNK_X} ${ys[0]}V${ys[count - 1]}`} /> : null}
        <path d={`M${branched ? MERGE_TRUNK_X : 0} ${mid}H${lineEnd}`} />
      </g>
      <polygon fill="var(--color-brand-dark)" points={`${lineEnd},${mid - ARROW_HALF} ${MERGE_W},${mid} ${lineEnd},${mid + ARROW_HALF}`} />
    </svg>
  )
}

function PhoneArrow() {
  return (
    <>
      <div className="flex items-center gap-2 min-[1200px]:hidden">
        <PhoneCall aria-hidden="true" size={26} className="text-brand-dark" />
        <DownArrow />
      </div>
      <div aria-hidden="true" className="relative hidden h-[3px] w-[56px] shrink-0 bg-brand-dark min-[1200px]:block">
        <PhoneCall size={28} className="absolute -top-[32px] left-2 text-brand-dark" />
        <span className="absolute -right-0.5 -top-[6.5px] h-0 w-0 border-y-[8px] border-l-[10px] border-y-transparent border-l-brand-dark" />
      </div>
    </>
  )
}

export function CallFlowDiagramBlock({
  pill, heading, customerLabel, agentLabel, bubble, agentName, agentSub, captionTitle, captionText, cards, summary,
}: CallFlowProps) {
  const summaryTone = CARD_TONE.light
  return (
    <section id="how-it-works" className={`${SECTION} scroll-mt-20 bg-white`}>
      <div className={INNER}>
        {(pill || heading) && (
          <div className="mb-4 md:mb-5">
            {pill && <span className="inline-block rounded-full bg-brand-primary-light px-3 py-1 text-[12px] font-semibold text-brand-primary-dark">{pill}</span>}
            {heading && <h2 className="mt-2 text-xl font-bold leading-[1.4] tracking-tight text-text-primary md:text-[24px]">{heading}</h2>}
          </div>
        )}
        <div className="rounded-2xl bg-bg-tertiary/70 p-4 sm:p-5 min-[1200px]:p-6">
          <div className="flex flex-col items-center gap-3 min-[1200px]:h-[376px] min-[1200px]:flex-row min-[1200px]:gap-0">
            {/* 1. Customer */}
            <div className="relative flex flex-col items-center min-[1200px]:block">
              <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-white shadow-sm">
                <UserRound aria-hidden="true" size={36} strokeWidth={1.8} className="text-brand-primary-dark" />
              </div>
              <p className="mt-2 text-center text-[13px] font-bold text-text-primary min-[1200px]:absolute min-[1200px]:left-1/2 min-[1200px]:top-full min-[1200px]:-translate-x-1/2 min-[1200px]:whitespace-nowrap">{customerLabel}</p>
            </div>

            <PhoneArrow />

            {/* 2. Voice agent: ring, speech bubble and a short caption centred under the ring */}
            <div className="relative flex flex-col items-center min-[1200px]:block">
              <div className="relative grid h-[140px] w-[140px] place-items-center rounded-full bg-brand-primary-light">
                <div className="grid h-[105px] w-[105px] place-items-center rounded-full bg-white text-center shadow-sm">
                  <div className="flex flex-col items-center">
                    <Bot aria-hidden="true" size={42} strokeWidth={1.6} className="text-brand-primary-dark" />
                    <span className="mt-1 text-[12px] font-bold tracking-wide text-text-primary">{agentLabel}</span>
                  </div>
                </div>
                {bubble && (
                  <div className="absolute -right-6 -top-6 grid h-[68px] w-[68px] place-items-center rounded-full bg-white px-1.5 text-center text-[12px] font-bold leading-tight text-brand-primary-dark shadow-sm">
                    <span aria-hidden="true" className="absolute bottom-1 left-1.5 h-3 w-3 rotate-45 bg-white" />
                    <span className="relative">{bubble}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 w-[220px] max-w-full text-center min-[1200px]:absolute min-[1200px]:left-1/2 min-[1200px]:top-full min-[1200px]:w-[200px] min-[1200px]:max-w-none min-[1200px]:-translate-x-1/2">
                <div className="flex items-center justify-center gap-2">
                  <span aria-hidden="true" className="text-[22px] font-bold leading-none text-brand-primary-dark/85">01</span>
                  <div className="text-left leading-tight">
                    <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-dark">{agentName}</p>
                    <p className="text-[11px] font-semibold text-text-secondary">{agentSub}</p>
                  </div>
                </div>
                <p className="mt-1.5 text-balance text-[12.5px] font-bold leading-snug text-brand-dark">{captionTitle}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">{captionText}</p>
              </div>
            </div>

            <DownArrow />
            <FanConnector count={cards.length} />

            {/* 3. Path cards */}
            <ul className="flex w-full min-w-0 flex-col gap-[12px] min-[1200px]:flex-1">
              {cards.map((card, i) => {
                const tone = CARD_TONE[card.tone]
                return (
                  <li key={i} className={`relative flex flex-col rounded-xl p-4 min-[1200px]:h-[112px] min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:p-3.5 ${tone.card}`}>
                    <span aria-hidden="true" className={`absolute right-3 top-1.5 text-[26px] font-bold leading-none ${tone.number}`}>{String(i + 2).padStart(2, '0')}</span>
                    {card.badge && (
                      <span className="absolute -left-2.5 -top-2.5 grid h-[36px] w-[36px] place-items-center rounded-full bg-brand-primary-dark text-[12px] font-bold text-white shadow-sm">{card.badge}</span>
                    )}
                    <div className={`flex items-center gap-3 ${card.badge ? 'max-[1199px]:pl-5 max-[1199px]:pt-2' : ''} min-[1200px]:w-[120px] min-[1200px]:shrink-0 min-[1200px]:flex-col min-[1200px]:justify-center min-[1200px]:gap-1.5 min-[1200px]:text-center`}>
                      <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full ${tone.icon}`}>
                        <VoiceIcon name={card.icon} size={22} />
                      </span>
                      <span className="pr-12 text-[12px] font-bold leading-tight min-[1200px]:pr-0">{card.label}</span>
                    </div>
                    <div className={`mt-3 border-t pt-3 ${tone.divider} min-[1200px]:mt-0 min-[1200px]:min-w-0 min-[1200px]:flex-1 min-[1200px]:border-l-2 min-[1200px]:border-t-0 min-[1200px]:pl-4 min-[1200px]:pt-0`}>
                      <h3 className="text-[15px] font-bold leading-snug min-[1200px]:pr-9 min-[1200px]:text-[16px]">{card.title}</h3>
                      <p className={`mt-1 text-[12px] leading-[1.6] min-[1200px]:pr-3 ${tone.text}`}>{card.text}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* 4. Summary and record, right-most part of the flow */}
            {summary && (
              <>
                <DownArrow />
                <MergeConnector count={cards.length} />
                <div className={`relative flex w-full flex-row items-center gap-3 rounded-xl p-4 min-[1200px]:w-[170px] min-[1200px]:shrink-0 min-[1200px]:flex-col min-[1200px]:gap-2 min-[1200px]:p-3.5 min-[1200px]:text-center ${summaryTone.card}`}>
                  <span aria-hidden="true" className={`absolute right-3 top-1.5 text-[26px] font-bold leading-none ${summaryTone.number}`}>{String(cards.length + 2).padStart(2, '0')}</span>
                  <span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full ${summaryTone.icon}`}>
                    <VoiceIcon name={summary.icon} size={22} />
                  </span>
                  <div className="min-w-0 pr-10 min-[1200px]:pr-0">
                    <h3 className="text-[15px] font-bold leading-snug min-[1200px]:text-[16px]">{summary.title}</h3>
                    {summary.text && <p className={`mt-1 text-[12px] leading-[1.6] ${summaryTone.text}`}>{summary.text}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
