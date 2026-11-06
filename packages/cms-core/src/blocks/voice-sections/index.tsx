import type { ReactNode } from 'react'
import { CallFlowDiagramBlock } from './call-flow-diagram'
import { HomeHeroBlock } from './home-hero'
import {
  adaptAboutHero, adaptCallFlow, adaptContactBanner, adaptDayFlow, adaptHomeHero, adaptIconCards, adaptMissionSplit, adaptPageIntro,
  adaptPartnerCard, adaptRoleSplit, adaptRoutingDashboard, adaptTeamSplit, adaptVoiceHero, adaptWhyAi,
} from './adapters'
import { ContactBannerBlock, MissionSplitBlock, PartnerCardBlock, TeamSplitBlock } from './company-components'
import { AboutHeroBlock } from './company-hero'
import { WhyAiBlock } from './why-ai'
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
  'why-ai': (raw) => <WhyAiBlock {...adaptWhyAi(raw)} />,
  'home-hero': (raw) => <HomeHeroBlock {...adaptHomeHero(raw)} />,
  'call-flow-diagram': (raw) => <CallFlowDiagramBlock {...adaptCallFlow(raw)} />,
  'about-hero': (raw) => <AboutHeroBlock {...adaptAboutHero(raw)} />,
  'team-split': (raw) => <TeamSplitBlock {...adaptTeamSplit(raw)} />,
  'contact-banner': (raw) => <ContactBannerBlock {...adaptContactBanner(raw)} />,
  'mission-split': (raw) => <MissionSplitBlock {...adaptMissionSplit(raw)} />,
  'partner-card': (raw) => <PartnerCardBlock {...adaptPartnerCard(raw)} />,
}
