import type { Block } from 'payload'
import { ACCESS_COPY_KEYS } from './access-copy'

// Voice-pivot (ECC Master Prompt v2 §9, /demo): consent-gated, scripted
// simulation. No microphone is ever opened by this block; the live AI call is
// shown only as a disabled "integration required" placeholder.
const text = (name: string, required = false) =>
  ({ name, type: 'text', localized: true, ...(required ? { required: true } : {}) }) as const

export const DemoSimulatorBlockConfig: Block = {
  slug: 'demo-simulator',
  interfaceName: 'DemoSimulatorBlock',
  labels: { singular: 'Voice Demo Simulator', plural: 'Voice Demo Simulators' },
  fields: [
    text('heading'),
    { name: 'intro', type: 'textarea', localized: true },
    text('simulationLabel'),
    text('fictionalNotice'),
    text('noticeTitle'),
    { name: 'noticeBody', type: 'textarea', localized: true },
    text('consentLabel'),
    text('privacyLabel'),
    { name: 'privacyHref', type: 'text', defaultValue: '/privacy' },
    text('startLabel'),
    text('liveLabel'),
    text('liveNote'),
    text('scenarioHeading'),
    text('transcriptHeading'),
    text('summaryHeading'),
    text('callerLabel'),
    text('aiLabel'),
    text('demoDataLabel'),
    text('restartLabel'),
    text('audioLabel'),
    text('callLabel'),
    // Entry cards, access-key form and Register form text.
    ...ACCESS_COPY_KEYS.map((key) => text(key)),
    {
      name: 'scenarios',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 3,
      fields: [
        text('title', true),
        { name: 'description', type: 'textarea', localized: true },
        text('businessName'),
        // Optional per-scenario call recording, one file per language (public path, e.g. /audio/x.wav).
        { name: 'audioEn', type: 'text' },
        { name: 'audioJa', type: 'text' },
        // Video shown in the inline player (same file for both languages). A scenario with a
        // video and no transcript turns shows the player instead of the transcript.
        { name: 'videoSrc', type: 'text' },
        // Optional external demo-call page per language; opens in a new tab, https only.
        { name: 'callUrlEn', type: 'text' },
        { name: 'callUrlJa', type: 'text' },
        {
          name: 'turns',
          type: 'array',
          fields: [
            {
              name: 'speaker',
              type: 'select',
              required: true,
              options: [
                { label: 'Caller', value: 'caller' },
                { label: 'AI', value: 'ai' },
              ],
            },
            { name: 'text', type: 'textarea', localized: true, required: true },
          ],
        },
        {
          name: 'summaryRows',
          type: 'array',
          fields: [text('label', true), text('value')],
        },
      ],
    },
  ],
}
