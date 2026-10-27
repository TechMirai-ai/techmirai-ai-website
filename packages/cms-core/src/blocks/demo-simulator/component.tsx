'use client'

import { useCallback, useState } from 'react'
import { useLocale } from 'next-intl'
import { AudioPopup } from './audio-popup'
import type { DemoScenario, DemoSimulatorBlockProps } from './types'

type Phase = 'notice' | 'choose' | 'result'

export function DemoSimulatorBlock(props: DemoSimulatorBlockProps) {
  const {
    heading,
    intro,
    simulationLabel,
    fictionalNotice,
    noticeTitle,
    noticeBody,
    consentLabel,
    privacyLabel,
    privacyHref,
    startLabel,
    liveLabel,
    liveNote,
    scenarioHeading,
    transcriptHeading,
    summaryHeading,
    callerLabel,
    aiLabel,
    demoDataLabel,
    restartLabel,
    audioLabel,
    callLabel,
    scenarios,
  } = props

  const locale = useLocale()
  const [phase, setPhase] = useState<Phase>('notice')
  const [consent, setConsent] = useState(false)
  const [scenario, setScenario] = useState<DemoScenario | null>(null)
  const [audioOpen, setAudioOpen] = useState(false)
  const closeAudio = useCallback(() => setAudioOpen(false), [])

  if (scenarios.length === 0) return null

  const restart = () => {
    setScenario(null)
    setAudioOpen(false)
    setPhase('choose')
  }

  const isJa = locale === 'ja'
  const audioSrc = scenario ? (isJa ? scenario.audioJa : scenario.audioEn) : ''
  const callUrl = scenario ? (isJa ? scenario.callUrlJa : scenario.callUrlEn) : ''
  const closeLabel = isJa ? '閉じる' : 'Close'

  return (
    <section className="w-full bg-bg-tertiary/40 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {heading && <h2 className="text-center text-2xl font-bold tracking-tight text-text-primary md:text-[32px]">{heading}</h2>}
        {intro && <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-[1.8] text-text-muted">{intro}</p>}

        <p className="mt-4 text-center text-[12px] font-semibold text-text-secondary">
          <span className="rounded-full bg-bg-tertiary px-3 py-1">{simulationLabel}</span>
          <span className="ml-2">{fictionalNotice}</span>
        </p>

        {phase === 'notice' && (
          <div className="mt-8 rounded-2xl border border-border-default bg-white p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-text-primary">{noticeTitle}</h3>
            <p className="mt-2 whitespace-pre-line text-[13px] leading-[1.8] text-text-muted">{noticeBody}</p>
            <label className="mt-4 flex items-start gap-3 text-[13px] leading-[1.7] text-text-primary">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                {consentLabel}{' '}
                <a href={privacyHref} className="underline">
                  {privacyLabel}
                </a>
              </span>
            </label>
            <button
              type="button"
              disabled={!consent}
              onClick={() => setPhase('choose')}
              className="mt-5 rounded-full bg-brand-primary px-7 py-3 text-[14px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {startLabel}
            </button>
          </div>
        )}

        {phase === 'choose' && (
          <div className="mt-8">
            <h3 className="text-[16px] font-bold text-text-primary">{scenarioHeading}</h3>
            <ul className="mt-3 grid gap-3">
              {scenarios.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setScenario(s)
                      setPhase('result')
                    }}
                    className="w-full rounded-2xl border border-border-default bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span className="block text-[14px] font-bold text-text-primary">{s.title}</span>
                    <span className="mt-1 block text-[12.5px] leading-[1.7] text-text-muted">{s.description}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-dashed border-border-default bg-white/70 p-4">
              <button type="button" disabled className="rounded-full border border-border-default px-4 py-2 text-[13px] font-semibold text-text-muted opacity-60">
                {liveLabel}
              </button>
              <p className="mt-2 text-[12px] leading-[1.7] text-text-muted">{liveNote}</p>
            </div>
          </div>
        )}

        {phase === 'result' && scenario && (
          <div className="mt-8 grid gap-6">
            <div>
              <h3 className="text-[16px] font-bold text-text-primary">
                {transcriptHeading}
                {scenario.businessName && <span className="ml-2 text-[12px] font-medium text-text-muted">{scenario.businessName}</span>}
              </h3>
              <ul className="mt-3 grid gap-2" aria-live="polite">
                {scenario.turns.map((turn, i) => (
                  <li
                    key={i}
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-[13px] leading-[1.8] ${
                      turn.speaker === 'ai' ? 'bg-bg-tertiary text-text-primary' : 'ml-auto border border-border-default text-text-primary'
                    }`}
                  >
                    <span className="mb-0.5 block text-[11px] font-bold text-text-muted">
                      {turn.speaker === 'ai' ? aiLabel : callerLabel}
                    </span>
                    {turn.text}
                  </li>
                ))}
              </ul>
            </div>

            {scenario.summaryRows.length > 0 && (
              <div className="rounded-2xl border border-border-default bg-white p-5 shadow-sm">
                <h3 className="text-[16px] font-bold text-text-primary">{summaryHeading}</h3>
                <p className="mt-1 text-[12px] font-medium text-text-muted">{demoDataLabel}</p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {scenario.summaryRows.map((row, i) => (
                    <div key={i} className="rounded-lg bg-white p-3">
                      <dt className="text-[11px] font-bold text-text-muted">{row.label}</dt>
                      <dd className="mt-1 text-[13px] leading-[1.7] text-text-primary">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {((audioSrc && audioLabel) || (callUrl && callLabel)) && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                {audioSrc && audioLabel ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setAudioOpen(true)}
                    className="rounded-full bg-brand-primary px-6 py-2.5 text-[13px] font-semibold text-on-primary"
                  >
                    {audioLabel}
                  </button>
                ) : (
                  <span />
                )}
                {callUrl && callLabel && (
                  <a
                    href={callUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-brand-primary px-6 py-2.5 text-[13px] font-semibold text-on-primary"
                  >
                    {callLabel}
                  </a>
                )}
              </div>
            )}

            {audioOpen && audioSrc && (
              <AudioPopup
                audioSrc={audioSrc}
                videoSrc={scenario.videoSrc}
                title={audioLabel}
                closeLabel={closeLabel}
                onClose={closeAudio}
              />
            )}

            <button
              type="button"
              onClick={restart}
              className="justify-self-start rounded-full border-2 border-brand-primary bg-white px-5 py-2 text-[13px] font-semibold text-text-secondary hover:bg-bg-tertiary"
            >
              {restartLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
