import type { ReactNode } from 'react'
import {
  adaptDayFlow, adaptIconCards, adaptPageIntro, adaptRoleSplit, adaptRoutingDashboard, adaptVoiceHero,
} from './adapters'
import {
  DayFlowBlock, IconCardsBlock, PageIntroBlock, RoleSplitBlock, RoutingDashboardBlock, VoiceHeroBlock,
} from './components'

export { VoiceSectionBlockConfigs } from './config'

type Renderer = (raw: unknown) => ReactNode

/** Slug → renderer for the voice-pivot home sections; spread into the block registry. */
export const voiceSectionRenderers: Record<string, Renderer> = {
  'page-intro': (raw) => <PageIntroBlock {...adaptPageIntro(raw)} />,
  'voice-hero': (raw) => <VoiceHeroBlock {...adaptVoiceHero(raw)} />,
  'icon-cards': (raw) => <IconCardsBlock {...adaptIconCards(raw)} />,
  'day-flow': (raw) => <DayFlowBlock {...adaptDayFlow(raw)} />,
  'routing-dashboard': (raw) => <RoutingDashboardBlock {...adaptRoutingDashboard(raw)} />,
  'role-split': (raw) => <RoleSplitBlock {...adaptRoleSplit(raw)} />,
}
