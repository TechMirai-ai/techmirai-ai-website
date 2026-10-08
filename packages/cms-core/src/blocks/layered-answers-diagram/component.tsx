'use client'

import { useLocale } from 'next-intl'
import type { LayeredAnswersDiagramBlockProps } from './types'

// Structural chrome, not Spec "fact" content — same precedent as
// `setup-steps`' NEED_LABEL / `example-chat`'s EXAMPLE_LABEL.
const ALT_LIST_LABEL: Record<string, string> = {
  en: 'Answer layers, in order:',
  ja: '回答の段階（順番）：',
}

// "Talk to a person" / "スタッフと話す" is the Spec's own already-approved
// bilingual pair for this exact affordance elsewhere (the always-visible
// header link, and chatbot button B6) — reused verbatim as the diagram's
// caption/legend for the dashed route, not invented new copy.
const TALK_TO_PERSON_LABEL: Record<string, string> = {
  en: 'Talk to a person',
  ja: 'スタッフと話す',
}

export function LayeredAnswersDiagramBlock({ steps }: LayeredAnswersDiagramBlockProps) {
  const locale = useLocale()
  const altListLabel = ALT_LIST_LABEL[locale] ?? ALT_LIST_LABEL['en']
  const talkToPersonLabel = TALK_TO_PERSON_LABEL[locale] ?? TALK_TO_PERSON_LABEL['en']

  if (!steps || steps.length !== 4) return null

  const [s0, s1, s2, s3] = steps as [
    (typeof steps)[number],
    (typeof steps)[number],
    (typeof steps)[number],
    (typeof steps)[number],
  ]
  const boxY = 20
  const boxH = 70
  const boxW = 180
  const gap = 40
  const xs: [number, number, number, number] = [20, 20 + boxW + gap, 20 + 2 * (boxW + gap), 20 + 3 * (boxW + gap)]
  const mids: [number, number, number, number] = [
    xs[0] + boxW / 2,
    xs[1] + boxW / 2,
    xs[2] + boxW / 2,
    xs[3] + boxW / 2,
  ]
  const busY = 170

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-bg-tertiary">
      <div className="mx-auto max-w-4xl">
        <svg
          viewBox="0 0 880 220"
          className="w-full h-auto"
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="lad-arrow-main" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-brand-primary" />
            </marker>
            <marker id="lad-arrow-dashed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-brand-accent" />
            </marker>
          </defs>

          {/* Main flow connectors */}
          <line x1={xs[0] + boxW} y1={boxY + boxH / 2} x2={xs[1]} y2={boxY + boxH / 2} className="stroke-brand-primary" strokeWidth={2} markerEnd="url(#lad-arrow-main)" />
          <line x1={xs[1] + boxW} y1={boxY + boxH / 2} x2={xs[2]} y2={boxY + boxH / 2} className="stroke-brand-primary" strokeWidth={2} markerEnd="url(#lad-arrow-main)" />
          <line x1={xs[2] + boxW} y1={boxY + boxH / 2} x2={xs[3]} y2={boxY + boxH / 2} className="stroke-brand-primary" strokeWidth={2} markerEnd="url(#lad-arrow-main)" />

          {/* Dashed "open from every step" route into node 4 */}
          <line x1={mids[0]} y1={boxY + boxH} x2={mids[0]} y2={busY} className="stroke-brand-accent" strokeWidth={1.5} strokeDasharray="4 4" />
          <line x1={mids[1]} y1={boxY + boxH} x2={mids[1]} y2={busY} className="stroke-brand-accent" strokeWidth={1.5} strokeDasharray="4 4" />
          <line x1={mids[2]} y1={boxY + boxH} x2={mids[2]} y2={busY} className="stroke-brand-accent" strokeWidth={1.5} strokeDasharray="4 4" />
          <line x1={mids[0]} y1={busY} x2={mids[3]} y2={busY} className="stroke-brand-accent" strokeWidth={1.5} strokeDasharray="4 4" />
          <line x1={mids[3]} y1={busY} x2={mids[3]} y2={boxY + boxH} className="stroke-brand-accent" strokeWidth={1.5} strokeDasharray="4 4" markerEnd="url(#lad-arrow-dashed)" />

          {/* Nodes 1-3 */}
          {[s0, s1, s2].map((step, i) => (
            <g key={i}>
              <rect x={xs[i]} y={boxY} width={boxW} height={boxH} rx={12} className="fill-brand-primary-light stroke-brand-primary" strokeWidth={1.5} />
              <text x={mids[i]} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="middle" className="fill-text-primary text-[15px] font-semibold">
                {step.label}
              </text>
            </g>
          ))}

          {/* Node 4 — always-reachable target */}
          <rect x={xs[3]} y={boxY} width={boxW} height={boxH} rx={12} className="fill-brand-accent/10 stroke-brand-accent" strokeWidth={1.5} />
          <text x={mids[3]} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="middle" className="fill-text-primary text-[15px] font-semibold">
            {s3.label}
          </text>
        </svg>

        <p className="mt-4 text-center text-[12px] italic text-text-muted">{talkToPersonLabel}</p>

        <div className="sr-only">
          <p>{altListLabel}</p>
          <ol>
            {steps.map((step, i) => (
              <li key={i}>{step.label}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
