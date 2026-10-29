import type { AccessCopy } from './access-copy'

export interface DemoTurn {
  speaker: 'caller' | 'ai'
  text: string
}

export interface DemoSummaryRow {
  label: string
  value: string
}

export interface DemoScenario {
  title: string
  description: string
  businessName: string
  audioEn: string
  audioJa: string
  videoSrc: string
  callUrlEn: string
  callUrlJa: string
  turns: DemoTurn[]
  summaryRows: DemoSummaryRow[]
}

export interface DemoSimulatorBlockProps {
  heading?: string
  intro?: string
  simulationLabel: string
  fictionalNotice: string
  noticeTitle: string
  noticeBody: string
  consentLabel: string
  privacyLabel: string
  privacyHref: string
  startLabel: string
  liveLabel: string
  liveNote: string
  scenarioHeading: string
  transcriptHeading: string
  summaryHeading: string
  callerLabel: string
  aiLabel: string
  demoDataLabel: string
  restartLabel: string
  audioLabel: string
  callLabel: string
  copy: AccessCopy
  scenarios: DemoScenario[]
}
