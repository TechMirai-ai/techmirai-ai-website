export interface SetupStep {
  name: string
  description: string
  need: string
}

export interface SetupStepsBlockProps {
  heading?: string
  sub?: string
  steps: SetupStep[]
  footnote?: string
}
