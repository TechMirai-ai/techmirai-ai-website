import { toIconName, type VoiceIconName } from './icons'

type Raw = Record<string, unknown>

export interface LinkProps {
  label: string
  href: string
}

export interface VoiceHeroProps {
  pill: string
  heading: string
  body: string
  primaryButton: LinkProps | null
  secondaryButton: LinkProps | null
  note: string
  pauseLabel: string
  playLabel: string
  nodes: { icon: VoiceIconName; label: string; sub: string }[]
  /** Same-site path or https URL of the decorative hero video; empty = no video. */
  backgroundVideo: string
}

export interface PageIntroProps {
  pill: string
  heading: string
  body: string
  primaryButton: LinkProps | null
  secondaryButton: LinkProps | null
  note: string
}

export type CardTone = 'green' | 'amber' | 'blue' | 'rose'

export interface IconCardsProps {
  pill: string
  heading: string
  intro: string
  columns: 2 | 3 | 4
  cards: { icon: VoiceIconName; tone: CardTone; title: string; text: string }[]
  cta: { label: string; sub: string; href: string; subLabel: string; subHref: string } | null
  footnote: string
}

export type DayTone = 'day' | 'dusk' | 'night' | 'morning'

export interface DayFlowProps {
  pill: string
  heading: string
  steps: { icon: VoiceIconName; tone: DayTone; title: string; text: string }[]
}

export interface DashboardRow {
  time: string
  caller: string
  topic: string
  status: string
  tone: 'ok' | 'alert'
}

export interface RoutingDashboardProps {
  pill: string
  heading: string
  statusBadge: string
  leftItems: { icon: VoiceIconName; text: string }[]
  rightItems: { icon: VoiceIconName; text: string }[]
  note: string
  dashboard: {
    menuHeading: string
    menu: string[]
    listTitle: string
    filters: string[]
    columns: string[]
    rows: DashboardRow[]
    detailTitle: string
    detailRows: { label: string; value: string }[]
    audioLabel: string
    demoLabel: string
  }
}

export interface RoleSplitProps {
  pill: string
  heading: string
  aiHeading: string
  aiItems: string[]
  humanHeading: string
  humanItems: string[]
  tagline: string
}

export interface WhyAiProps {
  pill: string
  heading: string
  humanLabel: string
  aiLabel: string
  aiSub: string
  /** `noCheck`: the AI cell is a hand-off to staff, so it gets no check mark. */
  rows: { label: string; human: string; ai: string; noCheck: boolean }[]
  footnote: string
}

export interface MissionSplitProps {
  pill: string
  heading: string
  body: string
  quote: string
  caption: string
}

export interface PartnerCardProps {
  pill: string
  heading: string
  intro: string
  brandName: string
  brandNote: string
  name: string
  paragraphs: string[]
  linkLabel: string
  /** https URL only; anything else is dropped. */
  linkHref: string
}

export interface HomeHeroProps {
  pill: string
  heading: string
  /** Highlighted (green) tail of the headline. */
  headingAccent: string
  body: string
  primaryButton: LinkProps | null
  secondaryButton: LinkProps | null
  note: string
  callCard: {
    liveLabel: string
    timer: string
    sampleLabel: string
    callerText: string
    agentLabel: string
    agentText: string
    chips: { icon: VoiceIconName; text: string }[]
    handledLabel: string
    followUpLabel: string
  }
}

export type FlowTone = 'primary' | 'light' | 'dark'

/** The desktop diagram draws a connector per path card, so the number of cards is bounded. */
export const MAX_FLOW_CARDS = 3

export interface CallFlowProps {
  pill: string
  heading: string
  customerLabel: string
  agentLabel: string
  bubble: string
  agentName: string
  agentSub: string
  captionTitle: string
  captionText: string
  cards: { icon: VoiceIconName; tone: FlowTone; badge: string; label: string; title: string; text: string }[]
  /** Separate band under the diagram; null when no title is set. */
  summary: { icon: VoiceIconName; title: string; text: string } | null
}

export interface AboutHeroProps {
  pill: string
  /** Heading parts: lead, highlighted word(s), and a second line. */
  heading: string
  headingAccent: string
  headingTail: string
  lede: string
  tags: string[]
  /** Same-site image path; empty = no artwork. */
  artSrc: string
  primaryButton: LinkProps | null
}

export interface TeamSplitProps {
  pill: string
  heading: string
  paragraphs: string[]
  cards: { icon: VoiceIconName; tone: CardTone; title: string; text: string }[]
}

export interface ContactBannerProps {
  pill: string
  heading: string
  body: string
  primaryButton: LinkProps | null
  columns: { title: string; lines: { text: string; href: string }[]; note: string }[]
}

const obj = (value: unknown): Raw => (typeof value === 'object' && value !== null ? (value as Raw) : {})
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
// A same-site path ("/video/x.mp4") or an https URL; anything else (javascript:, //host, http:) is dropped.
const videoSrc = (value: unknown): string => {
  const src = str(value).trim()
  return (src.startsWith('/') && !src.startsWith('//')) || src.startsWith('https://') ? src : ''
}
const rows = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter((r): r is Raw => typeof r === 'object' && r !== null) : []
const texts = (value: unknown): string[] => rows(value).map((r) => str(r['text'])).filter(Boolean)

function link(value: unknown): LinkProps | null {
  const group = obj(value)
  const label = str(group['label'])
  return label ? { label, href: str(group['href']) || '#' } : null
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function adaptPageIntro(raw: unknown): PageIntroProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    body: str(d['body']),
    primaryButton: link(d['primaryButton']),
    secondaryButton: link(d['secondaryButton']),
    note: str(d['note']),
  }
}

export function adaptVoiceHero(raw: unknown): VoiceHeroProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    body: str(d['body']),
    primaryButton: link(d['primaryButton']),
    secondaryButton: link(d['secondaryButton']),
    note: str(d['note']),
    pauseLabel: str(d['pauseLabel']) || 'Pause animation',
    playLabel: str(d['playLabel']) || 'Play animation',
    nodes: rows(d['nodes'])
      .map((n) => ({ icon: toIconName(n['icon']), label: str(n['label']), sub: str(n['sub']) }))
      .filter((n) => n.label),
    backgroundVideo: videoSrc(d['backgroundVideo']),
  }
}

export function adaptIconCards(raw: unknown): IconCardsProps {
  const d = obj(raw)
  const cta = obj(d['cta'])
  const columns = Number(d['columns'])
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    intro: str(d['intro']),
    columns: columns === 2 || columns === 3 ? columns : 4,
    cards: rows(d['cards'])
      .map((c) => ({
        icon: toIconName(c['icon']),
        tone: pick(c['tone'], ['green', 'amber', 'blue', 'rose'] as const, 'green'),
        title: str(c['title']),
        text: str(c['text']),
      }))
      .filter((c) => c.title),
    cta: str(cta['label'])
      ? {
          label: str(cta['label']),
          sub: str(cta['sub']),
          href: str(cta['href']) || '#',
          subLabel: str(cta['subLabel']),
          subHref: str(cta['subHref']) || '#',
        }
      : null,
    footnote: str(d['footnote']),
  }
}

export function adaptDayFlow(raw: unknown): DayFlowProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    steps: rows(d['steps'])
      .map((s) => ({
        icon: toIconName(s['icon']),
        tone: pick(s['tone'], ['day', 'dusk', 'night', 'morning'] as const, 'day'),
        title: str(s['title']),
        text: str(s['text']),
      }))
      .filter((s) => s.title),
  }
}

const iconRows = (value: unknown) =>
  rows(value)
    .map((r) => ({ icon: toIconName(r['icon']), text: str(r['text']) }))
    .filter((r) => r.text)

export function adaptRoutingDashboard(raw: unknown): RoutingDashboardProps {
  const d = obj(raw)
  const dash = obj(d['dashboard'])
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    statusBadge: str(d['statusBadge']),
    leftItems: iconRows(d['leftItems']),
    rightItems: iconRows(d['rightItems']),
    note: str(d['note']),
    dashboard: {
      menuHeading: str(dash['menuHeading']),
      menu: texts(dash['menu']),
      listTitle: str(dash['listTitle']),
      filters: texts(dash['filters']),
      columns: texts(dash['columns']),
      rows: rows(dash['rows']).map((r) => ({
        time: str(r['time']),
        caller: str(r['caller']),
        topic: str(r['topic']),
        status: str(r['status']),
        tone: r['tone'] === 'alert' ? 'alert' : 'ok',
      })),
      detailTitle: str(dash['detailTitle']),
      detailRows: rows(dash['detailRows']).map((r) => ({ label: str(r['label']), value: str(r['value']) })),
      audioLabel: str(dash['audioLabel']),
      demoLabel: str(dash['demoLabel']),
    },
  }
}

// A same-site path ("/brand/x.png"); anything else (javascript:, //host, remote URLs) is dropped.
const imageSrc = (value: unknown): string => {
  const src = str(value).trim()
  return src.startsWith('/') && !src.startsWith('//') ? src : ''
}

// Only mailto: and https: links are allowed in contact lines.
const contactHref = (value: unknown): string => {
  const href = str(value).trim()
  return href.startsWith('mailto:') || href.startsWith('https://') ? href : ''
}

export function adaptHomeHero(raw: unknown): HomeHeroProps {
  const d = obj(raw)
  const call = obj(d['callCard'])
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    headingAccent: str(d['headingAccent']),
    body: str(d['body']),
    primaryButton: link(d['primaryButton']),
    secondaryButton: link(d['secondaryButton']),
    note: str(d['note']),
    callCard: {
      liveLabel: str(call['liveLabel']),
      timer: str(call['timer']),
      sampleLabel: str(call['sampleLabel']),
      callerText: str(call['callerText']),
      agentLabel: str(call['agentLabel']),
      agentText: str(call['agentText']),
      chips: iconRows(call['chips']),
      handledLabel: str(call['handledLabel']),
      followUpLabel: str(call['followUpLabel']),
    },
  }
}

export function adaptCallFlow(raw: unknown): CallFlowProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    customerLabel: str(d['customerLabel']),
    agentLabel: str(d['agentLabel']),
    bubble: str(d['bubble']),
    agentName: str(d['agentName']),
    agentSub: str(d['agentSub']),
    captionTitle: str(d['captionTitle']),
    captionText: str(d['captionText']),
    cards: rows(d['cards'])
      .map((c) => ({
        icon: toIconName(c['icon']),
        tone: pick(c['tone'], ['primary', 'light', 'dark'] as const, 'light'),
        badge: str(c['badge']),
        label: str(c['label']),
        title: str(c['title']),
        text: str(c['text']),
      }))
      .filter((c) => c.title)
      .slice(0, MAX_FLOW_CARDS),
    summary: str(d['summaryTitle']).trim()
      ? { icon: toIconName(d['summaryIcon']), title: str(d['summaryTitle']).trim(), text: str(d['summaryText']) }
      : null,
  }
}

export function adaptAboutHero(raw: unknown): AboutHeroProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    headingAccent: str(d['headingAccent']),
    headingTail: str(d['headingTail']),
    lede: str(d['lede']),
    tags: texts(d['tags']),
    artSrc: imageSrc(d['artSrc']),
    primaryButton: link(d['primaryButton']),
  }
}

export function adaptTeamSplit(raw: unknown): TeamSplitProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    paragraphs: texts(d['paragraphs']),
    cards: rows(d['cards'])
      .map((c) => ({
        icon: toIconName(c['icon']),
        tone: pick(c['tone'], ['green', 'amber', 'blue', 'rose'] as const, 'green'),
        title: str(c['title']),
        text: str(c['text']),
      }))
      .filter((c) => c.title),
  }
}

export function adaptContactBanner(raw: unknown): ContactBannerProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    body: str(d['body']),
    primaryButton: link(d['primaryButton']),
    columns: rows(d['columns'])
      .map((c) => ({
        title: str(c['title']),
        lines: rows(c['lines'])
          .map((l) => ({ text: str(l['text']), href: contactHref(l['href']) }))
          .filter((l) => l.text),
        note: str(c['note']),
      }))
      .filter((c) => c.title),
  }
}

export function adaptMissionSplit(raw: unknown): MissionSplitProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    body: str(d['body']),
    quote: str(d['quote']),
    caption: str(d['caption']),
  }
}

export function adaptPartnerCard(raw: unknown): PartnerCardProps {
  const d = obj(raw)
  const href = str(d['linkHref']).trim()
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    intro: str(d['intro']),
    brandName: str(d['brandName']),
    brandNote: str(d['brandNote']),
    name: str(d['name']),
    paragraphs: texts(d['paragraphs']),
    linkLabel: str(d['linkLabel']),
    linkHref: href.startsWith('https://') ? href : '',
  }
}

export function adaptWhyAi(raw: unknown): WhyAiProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    humanLabel: str(d['humanLabel']),
    aiLabel: str(d['aiLabel']),
    aiSub: str(d['aiSub']),
    rows: rows(d['rows'])
      .map((r) => ({ label: str(r['label']), human: str(r['human']), ai: str(r['ai']), noCheck: r['noCheck'] === true }))
      .filter((r) => r.label && r.ai),
    footnote: str(d['footnote']),
  }
}

export function adaptRoleSplit(raw: unknown): RoleSplitProps {
  const d = obj(raw)
  return {
    pill: str(d['pill']),
    heading: str(d['heading']),
    aiHeading: str(d['aiHeading']),
    aiItems: texts(d['aiItems']),
    humanHeading: str(d['humanHeading']),
    humanItems: texts(d['humanItems']),
    tagline: str(d['tagline']),
  }
}
