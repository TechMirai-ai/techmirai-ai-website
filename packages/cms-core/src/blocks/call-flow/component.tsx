'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { CallFlowBlockProps } from './types'

const STEP_INTERVAL_MS = 1600

export function CallFlowBlock({
  heading,
  intro,
  steps,
  pauseLabel,
  playLabel,
  dashboardHeading,
  dashboardNote,
  dashboardFields,
  aiHeading,
  aiItems,
  humanHeading,
  humanItems,
}: CallFlowBlockProps) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const animated = playing && !reduceMotion

  useEffect(() => {
    if (!animated || steps.length === 0) return
    const timer = setInterval(() => setActive((current) => (current + 1) % steps.length), STEP_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [animated, steps.length])

  if (steps.length === 0) return null

  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {heading && (
          <h2 className="text-center text-2xl font-bold leading-[1.3] tracking-tight text-text-primary md:text-[32px]">
            {heading}
          </h2>
        )}
        {intro && (
          <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-[1.8] text-text-muted md:text-[15px]">
            {intro}
          </p>
        )}

        <ol className="mt-8 grid gap-3 md:grid-cols-5" aria-label={heading}>
          {steps.map((step, i) => {
            const isActive = !reduceMotion && i === active
            return (
              <li
                key={i}
                aria-current={isActive ? 'step' : undefined}
                className={`rounded-xl border p-4 text-[13px] leading-[1.7] transition-[opacity,transform] duration-300 ${
                  isActive
                    ? 'border-brand-primary bg-bg-tertiary font-semibold text-text-primary md:-translate-y-1'
                    : 'border-border-default bg-white text-text-primary'
                }`}
              >
                <span className="mb-1 block text-[11px] font-bold text-brand-primary-dark">{i + 1}</span>
                {step.label}
              </li>
            )
          })}
        </ol>

        {!reduceMotion && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded-full border border-border-default px-4 py-2 text-[12px] font-medium text-text-secondary hover:bg-bg-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {playing ? pauseLabel : playLabel}
            </button>
          </div>
        )}

        {dashboardFields.length > 0 && (
          <div className="mt-10 rounded-2xl border border-border-default bg-bg-tertiary p-5 md:p-6">
            {dashboardHeading && <h3 className="text-[16px] font-bold text-text-primary">{dashboardHeading}</h3>}
            {dashboardNote && <p className="mt-1 text-[12px] font-medium text-text-muted">{dashboardNote}</p>}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardFields.map((field, i) => (
                <div key={i} className="rounded-lg bg-white p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{field.label}</dt>
                  <dd className="mt-1 text-[13px] leading-[1.7] text-text-primary">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {(aiItems.length > 0 || humanItems.length > 0) && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border-default p-5">
              {aiHeading && <h3 className="text-[15px] font-bold text-text-primary">{aiHeading}</h3>}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-[1.8] text-text-muted">
                {aiItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border-default p-5">
              {humanHeading && <h3 className="text-[15px] font-bold text-text-primary">{humanHeading}</h3>}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-[1.8] text-text-muted">
                {humanItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
