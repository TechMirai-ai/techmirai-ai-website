export interface ProcessStep {
  title: string
  line: string
}

export interface ProcessStepsBlockProps {
  heading?: string
  sub?: string
  steps: ProcessStep[]
}
