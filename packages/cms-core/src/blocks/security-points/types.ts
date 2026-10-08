export interface SecurityPoint {
  text: string
}

export interface SecurityPointsBlockProps {
  heading?: string
  points: SecurityPoint[]
  buttonLabel?: string
  buttonHref?: string
}
