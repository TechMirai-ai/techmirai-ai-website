export interface ProblemSectionJourneyStep {
  text: string
}

export interface ProblemSectionCard {
  text: string
}

export interface ProblemSectionBlockProps {
  heading: string
  intro?: string
  journeySteps?: ProblemSectionJourneyStep[]
  journeyCaption?: string
  cards: ProblemSectionCard[]
  navyBandText?: string
  closingLine?: string
}
