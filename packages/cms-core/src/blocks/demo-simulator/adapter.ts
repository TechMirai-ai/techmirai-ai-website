import type { DemoScenario, DemoSimulatorBlockProps } from './types'

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    : []
}

function adaptScenario(raw: Record<string, unknown>): DemoScenario {
  return {
    title: str(raw['title']),
    description: str(raw['description']),
    businessName: str(raw['businessName']),
    turns: rows(raw['turns']).map((t) => ({
      speaker: t['speaker'] === 'ai' ? 'ai' : 'caller',
      text: str(t['text']),
    })),
    summaryRows: rows(raw['summaryRows']).map((r) => ({ label: str(r['label']), value: str(r['value']) })),
  }
}

export function adaptDemoSimulatorBlock(raw: unknown): DemoSimulatorBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  return {
    heading: str(data['heading']),
    intro: str(data['intro']),
    simulationLabel: str(data['simulationLabel']),
    fictionalNotice: str(data['fictionalNotice']),
    noticeTitle: str(data['noticeTitle']),
    noticeBody: str(data['noticeBody']),
    consentLabel: str(data['consentLabel']),
    privacyLabel: str(data['privacyLabel']),
    privacyHref: str(data['privacyHref']) || '/privacy',
    startLabel: str(data['startLabel']),
    liveLabel: str(data['liveLabel']),
    liveNote: str(data['liveNote']),
    scenarioHeading: str(data['scenarioHeading']),
    transcriptHeading: str(data['transcriptHeading']),
    summaryHeading: str(data['summaryHeading']),
    callerLabel: str(data['callerLabel']),
    aiLabel: str(data['aiLabel']),
    demoDataLabel: str(data['demoDataLabel']),
    restartLabel: str(data['restartLabel']),
    scenarios: rows(data['scenarios']).map(adaptScenario).filter((s) => s.title && s.turns.length > 0),
  }
}
