export interface ProductEditionWayToStart {
  text: string
}

export interface ProductEditionBlockProps {
  heading: string
  badge?: string
  body?: string
  itemsList?: string
  waysToStart?: ProductEditionWayToStart[]
  closingLine?: string
  buttonLabel?: string
  buttonHref?: string
}
