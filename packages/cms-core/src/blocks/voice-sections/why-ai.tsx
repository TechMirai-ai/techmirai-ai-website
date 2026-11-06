'use client'

import { Check, User, Zap } from 'lucide-react'
import { INNER, SECTION, SectionHeading } from './components'
import type { WhyAiProps } from './adapters'

// Homepage "Why AI" section from docs HOMEPAGE-UX-DESIGN.pdf (part 2): a
// Human operator vs. AI operator comparison. A real <table> from `md` up; one
// card per row below that so nothing scrolls sideways on a phone.

type WhyAiRow = WhyAiProps['rows'][number]

function AiCell({ row }: { row: WhyAiRow }) {
  return (
    <span className="flex items-start gap-2">
      {!row.noCheck && <Check aria-hidden="true" size={15} className="mt-1 shrink-0 text-brand-primary-dark" />}
      <span>{row.ai}</span>
    </span>
  )
}

function DesktopTable({ humanLabel, aiLabel, aiSub, rows }: Pick<WhyAiProps, 'humanLabel' | 'aiLabel' | 'aiSub' | 'rows'>) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border-default bg-white shadow-[0_16px_40px_rgba(27,42,69,0.08)] md:block">
      <table className="w-full table-fixed border-collapse text-left text-[14px] leading-[1.6] text-text-secondary">
        <colgroup>
          <col className="w-[28%]" />
          <col className="w-[36%]" />
          <col className="w-[36%]" />
        </colgroup>
        <thead>
          <tr>
            <td className="bg-bg-tertiary/60 px-5 py-4" />
            <th scope="col" className="bg-bg-tertiary/60 px-5 py-4 text-[15px] font-bold text-text-primary">
              <span className="flex items-center gap-2">
                <User aria-hidden="true" size={17} />
                {humanLabel}
              </span>
            </th>
            <th scope="col" className="bg-brand-primary-dark px-5 py-4 font-bold text-white">
              <span className="flex items-center gap-2 text-[15px]">
                <Zap aria-hidden="true" size={17} />
                {aiLabel}
              </span>
              {aiSub && <span className="mt-0.5 block text-[12px] font-medium text-white/90">{aiSub}</span>}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border-default">
              <th scope="row" className="px-5 py-3.5 align-top text-[14px] font-bold text-text-primary">{row.label}</th>
              <td className="px-5 py-3.5 align-top">{row.human}</td>
              <td className="bg-brand-primary-light/40 px-5 py-3.5 align-top text-text-primary">
                <AiCell row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileCards({ humanLabel, aiLabel, rows }: Pick<WhyAiProps, 'humanLabel' | 'aiLabel' | 'rows'>) {
  return (
    <ul className="grid gap-3 md:hidden">
      {rows.map((row, i) => (
        <li key={i} className="overflow-hidden rounded-2xl border border-border-default bg-white">
          <p className="px-4 pt-3.5 text-[14px] font-bold text-text-primary">{row.label}</p>
          <div className="px-4 py-2.5 text-[13px] leading-[1.7] text-text-secondary">
            <span className="block text-[12px] font-semibold text-text-muted">{humanLabel}</span>
            {row.human}
          </div>
          <div className="bg-brand-primary-light/40 px-4 py-2.5 text-[13px] leading-[1.7] text-text-primary">
            <span className="block text-[12px] font-semibold text-brand-primary-dark">{aiLabel}</span>
            <AiCell row={row} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function WhyAiBlock({ pill, heading, humanLabel, aiLabel, aiSub, rows, footnote }: WhyAiProps) {
  if (rows.length === 0) return null
  return (
    <section className={`${SECTION} bg-bg-tertiary/30`}>
      <div className={`${INNER} max-w-5xl`}>
        <div className="text-center [&>div]:mb-8">
          <SectionHeading pill={pill} heading={heading} />
        </div>
        <DesktopTable humanLabel={humanLabel} aiLabel={aiLabel} aiSub={aiSub} rows={rows} />
        <MobileCards humanLabel={humanLabel} aiLabel={aiLabel} rows={rows} />
        {footnote && <p className="mt-4 text-center text-[12px] leading-[1.7] text-text-muted">{footnote}</p>}
      </div>
    </section>
  )
}
