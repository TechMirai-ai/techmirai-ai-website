import type { Block, Field } from 'payload'
import { VOICE_ICON_NAMES } from './icons'
import { MAX_FLOW_CARDS } from './adapters'

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

export const WhyAiBlockConfig: Block = {
  slug: 'why-ai',
  interfaceName: 'WhyAiBlock',
  labels: { singular: 'Why AI (human vs AI table)', plural: 'Why AI tables' },
  fields: [
    text('pill'),
    text('heading'),
    text('humanLabel'),
    text('aiLabel'),
    text('aiSub'),
    {
      name: 'rows',
      type: 'array',
      fields: [
        text('label', true),
        text('human'),
        text('ai', true),
        { name: 'noCheck', type: 'checkbox', defaultValue: false },
      ],
    },
    area('footnote'),
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

export const MissionSplitBlockConfig: Block = {
  slug: 'mission-split',
  interfaceName: 'MissionSplitBlock',
  labels: { singular: 'Mission Split', plural: 'Mission Splits' },
  fields: [text('pill'), text('heading'), area('body'), area('quote'), text('caption')],
}

export const PartnerCardBlockConfig: Block = {
  slug: 'partner-card',
  interfaceName: 'PartnerCardBlock',
  labels: { singular: 'Partner Card', plural: 'Partner Cards' },
  fields: [
    text('pill'),
    text('heading'),
    text('intro'),
    text('brandName'),
    text('brandNote'),
    text('name'),
    textRows('paragraphs'),
    // Unused since the layout pass: contact details now live in the contact-banner block.
    // Kept so existing database rows keep their shape.
    { name: 'details', type: 'array', admin: { hidden: true }, fields: [text('label', true), text('value')] },
    text('linkLabel'),
    { name: 'linkHref', type: 'text' },
  ],
}

export const AboutHeroBlockConfig: Block = {
  slug: 'about-hero',
  interfaceName: 'AboutHeroBlock',
  labels: { singular: 'About Hero (text + orbit art)', plural: 'About Heroes' },
  fields: [
    text('pill'),
    text('heading'),
    text('headingAccent'),
    text('headingTail'),
    area('lede'),
    textRows('tags'),
    { name: 'artSrc', type: 'text', admin: { description: 'Same-site image path, e.g. /brand/about-orbit-logo.png. Empty = no artwork.' } },
    button('primaryButton'),
  ],
}

export const TeamSplitBlockConfig: Block = {
  slug: 'team-split',
  interfaceName: 'TeamSplitBlock',
  labels: { singular: 'Team Split (text + 2x2 cards)', plural: 'Team Splits' },
  fields: [
    text('pill'),
    text('heading'),
    textRows('paragraphs'),
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
  ],
}

export const ContactBannerBlockConfig: Block = {
  slug: 'contact-banner',
  interfaceName: 'ContactBannerBlock',
  labels: { singular: 'Contact Banner', plural: 'Contact Banners' },
  fields: [
    text('pill'),
    text('heading'),
    area('body'),
    button('primaryButton'),
    {
      name: 'columns',
      type: 'array',
      fields: [
        text('title', true),
        { name: 'lines', type: 'array', fields: [text('text', true), { name: 'href', type: 'text' }] },
        text('note'),
      ],
    },
  ],
}

export const HomeHeroBlockConfig: Block = {
  slug: 'home-hero',
  interfaceName: 'HomeHeroBlock',
  labels: { singular: 'Home Hero (text + live-call card)', plural: 'Home Heroes' },
  fields: [
    text('pill'),
    text('heading'),
    text('headingAccent'),
    area('body'),
    button('primaryButton'),
    button('secondaryButton'),
    text('note'),
    {
      name: 'callCard',
      type: 'group',
      fields: [
        text('liveLabel'),
        text('timer'),
        text('sampleLabel'),
        area('callerText'),
        text('agentLabel'),
        area('agentText'),
        { name: 'chips', type: 'array', fields: [icon(), text('text', true)] },
        text('handledLabel'),
        text('followUpLabel'),
      ],
    },
  ],
}

export const CallFlowDiagramBlockConfig: Block = {
  slug: 'call-flow-diagram',
  interfaceName: 'CallFlowDiagramBlock',
  labels: { singular: 'Call Flow Diagram (customer, agent, 3 paths, summary band)', plural: 'Call Flow Diagrams' },
  fields: [
    text('pill'),
    text('heading'),
    text('customerLabel'),
    text('agentLabel'),
    text('bubble'),
    text('agentName'),
    text('agentSub'),
    text('captionTitle'),
    text('captionText'),
    {
      name: 'cards',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: MAX_FLOW_CARDS,
      fields: [
        icon(),
        { name: 'tone', type: 'select', defaultValue: 'light', options: ['primary', 'light', 'dark'] },
        text('badge'),
        text('label'),
        text('title', true),
        area('text'),
      ],
    },
    // Optional band shown under the diagram, outside the connector layout.
    icon('summaryIcon'),
    text('summaryTitle'),
    area('summaryText'),
  ],
}

export const VoiceSectionBlockConfigs: Block[] = [
  HomeHeroBlockConfig,
  CallFlowDiagramBlockConfig,
  AboutHeroBlockConfig,
  TeamSplitBlockConfig,
  ContactBannerBlockConfig,
  MissionSplitBlockConfig,
  PartnerCardBlockConfig,
  PageIntroBlockConfig,
  VoiceHeroBlockConfig,
  IconCardsBlockConfig,
  DayFlowBlockConfig,
  RoutingDashboardBlockConfig,
  RoleSplitBlockConfig,
  WhyAiBlockConfig,
]
