export interface BeforeAfterRow {
  area: string
  before: string
  after: string
}

export interface BeforeAfterBlockProps {
  heading: string
  sub?: string
  beforeLabel: string
  afterLabel: string
  rows: BeforeAfterRow[]
}
