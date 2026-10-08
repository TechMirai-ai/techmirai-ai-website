export type IntegrationStatus = 'available' | 'case-by-case' | 'in-development' | 'not-offered'

export interface IntegrationRow {
  name: string
  status: IntegrationStatus
  description: string
}

export interface IntegrationsStatusTableBlockProps {
  heading?: string
  intro?: string
  rows: IntegrationRow[]
  footnote?: string
}
