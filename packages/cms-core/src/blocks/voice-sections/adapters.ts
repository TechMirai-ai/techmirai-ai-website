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

const obj = (value: unknown): Raw => (typeof value === 'object' && value !== null ? (value as Raw) : {})
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
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
