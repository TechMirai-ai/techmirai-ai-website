export type ComplianceIcon = 'shield' | 'check' | 'certificate' | 'badge'

export interface LicenseCard {
  title: string
  issuer?: string
  licenseNumber?: string
  icon?: ComplianceIcon
}

export interface ComplianceGridBlockProps {
  blockType?: 'compliance-grid'
  eyebrow?: string
  heading?: string
  intro?: string
  licenses: LicenseCard[]
  commitmentsHeading?: string
  commitments: string[]
}
