export interface CallFlowStep {
  label: string
}

export interface CallFlowDashboardField {
  label: string
  value: string
}

export interface CallFlowBlockProps {
  heading?: string
  intro?: string
  steps: CallFlowStep[]
  pauseLabel: string
  playLabel: string
  dashboardHeading?: string
  dashboardNote?: string
  dashboardFields: CallFlowDashboardField[]
  aiHeading?: string
  aiItems: string[]
  humanHeading?: string
  humanItems: string[]
}
