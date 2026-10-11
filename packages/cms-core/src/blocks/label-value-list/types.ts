export interface LabelValueRow {
  label: string
  detail: string
}

export interface LabelValueListBlockProps {
  heading?: string
  intro?: string
  rows: LabelValueRow[]
  footnote?: string
}
