import type { Block, Field } from 'payload'
import { VOICE_ICON_NAMES } from './icons'

// Voice-pivot home sections (ECC Master Prompt v2 §6-§7), modelled on the
// owner's reference screenshot. Five additive blocks sharing one icon list.

const text = (name: string, required = false): Field => ({ name, type: 'text', localized: true, ...(required ? { required: true } : {}) })
const area = (name: string): Field => ({ name, type: 'textarea', localized: true })
const icon = (name = 'icon'): Field => ({
  name,
  type: 'select',
  defaultValue: 'phone',
  options: VOICE_ICON_NAMES.map((value) => ({ label: value, value })),
})
const textRows = (name: string): Field => ({ name, type: 'array', fields: [text('text', true)] })
const button = (name: string): Field => ({ name, type: 'group', fields: [text('label'), { name: 'href', type: 'text' }] })

export const VoiceHeroBlockConfig: Block = {
  slug: 'voice-hero',
  interfaceName: 'VoiceHeroBlock',
  labels: { singular: 'Voice Hero (call flow)', plural: 'Voice Heroes' },
  fields: [
    text('pill'),
    area('heading'),
    area('body'),
    button('primaryButton'),
    button('secondaryButton'),
    text('note'),
    text('pauseLabel'),
    text('playLabel'),
    // Decorative looping video: hero background on desktop, a banner above the call flow on mobile.
    { name: 'backgroundVideo', type: 'text' },
    {
      name: 'nodes',
      type: 'array',
      minRows: 2,
      fields: [icon(), text('label', true), text('sub')],
    },
  ],
}

export const IconCardsBlockConfig: Block = {
  slug: 'icon-cards',
  interfaceName: 'IconCardsBlock',
  labels: { singular: 'Icon Cards', plural: 'Icon Card Sections' },
  fields: [
    text('pill'),
    text('heading'),
    area('intro'),
    {
      name: 'columns',
      type: 'select',
      defaultValue: '4',
      options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }],
    },
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        icon(),
        { name: 'tone', type: 'select', defaultValue: 'green', options: ['green', 'amber', 'blue', 'rose'] },
        text('title', true),
        area('text'),
      ],
    },
    {
      name: 'cta',
      type: 'group',
      admin: { description: 'Optional extra card with a button (e.g. "Start the demo").' },
      fields: [text('label'), text('sub'), { name: 'href', type: 'text' }, text('subLabel'), { name: 'subHref', type: 'text' }],
    },
    text('footnote'),
  ],
}

export const DayFlowBlockConfig: Block = {
  slug: 'day-flow',
  interfaceName: 'DayFlowBlock',
  labels: { singular: 'Day Timeline', plural: 'Day Timelines' },
  fields: [
    text('pill'),
    text('heading'),
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      fields: [
        icon(),
        { name: 'tone', type: 'select', defaultValue: 'day', options: ['day', 'dusk', 'night', 'morning'] },
        text('title', true),
        text('text'),
      ],
    },
  ],
}

export const RoutingDashboardBlockConfig: Block = {
  slug: 'routing-dashboard',
  interfaceName: 'RoutingDashboardBlock',
  labels: { singular: 'Routing + Dashboard Mock', plural: 'Routing + Dashboard Mocks' },
  fields: [
    text('pill'),
    text('heading'),
    text('statusBadge'),
    { name: 'leftItems', type: 'array', fields: [icon(), text('text', true)] },
    { name: 'rightItems', type: 'array', fields: [icon(), text('text', true)] },
    text('note'),
    {
      name: 'dashboard',
      type: 'group',
      fields: [
        text('menuHeading'),
        textRows('menu'),
        text('listTitle'),
        textRows('filters'),
        textRows('columns'),
        {
          name: 'rows',
          type: 'array',
          fields: [
            { name: 'time', type: 'text' },
            { name: 'caller', type: 'text' },
            text('topic'),
            text('status'),
            { name: 'tone', type: 'select', defaultValue: 'ok', options: ['ok', 'alert'] },
          ],
        },
        text('detailTitle'),
        { name: 'detailRows', type: 'array', fields: [text('label', true), text('value')] },
        text('audioLabel'),
        text('demoLabel'),
      ],
    },
  ],
}

export const RoleSplitBlockConfig: Block = {
  slug: 'role-split',
  interfaceName: 'RoleSplitBlock',
  labels: { singular: 'AI vs People Split', plural: 'AI vs People Splits' },
  fields: [
    text('pill'),
    text('heading'),
    text('aiHeading'),
    textRows('aiItems'),
    text('humanHeading'),
    textRows('humanItems'),
    area('tagline'),
  ],
}

export const PageIntroBlockConfig: Block = {
  slug: 'page-intro',
  interfaceName: 'PageIntroBlock',
  labels: { singular: 'Page Intro (voice style)', plural: 'Page Intros' },
  fields: [
    text('pill'),
    text('heading', true),
    area('body'),
    button('primaryButton'),
    button('secondaryButton'),
    text('note'),
  ],
}

export const VoiceSectionBlockConfigs: Block[] = [
  PageIntroBlockConfig,
  VoiceHeroBlockConfig,
  IconCardsBlockConfig,
  DayFlowBlockConfig,
  RoutingDashboardBlockConfig,
  RoleSplitBlockConfig,
]
