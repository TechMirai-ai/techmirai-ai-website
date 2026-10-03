import type { ComplianceGridBlockProps, LicenseCard, ComplianceIcon } from './types'

const VALID_ICONS = new Set<ComplianceIcon>(['shield', 'check', 'certificate', 'badge'])

export function adaptComplianceGridBlock(raw: unknown): ComplianceGridBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')

  const rawLicenses = Array.isArray(data['licenses']) ? data['licenses'] : []
  const licenses: LicenseCard[] = rawLicenses
    .filter((l): l is Record<string, unknown> => typeof l === 'object' && l !== null)
    .map((l) => {
      const title = str(l['title'])
      if (!title) return null
      const icon = VALID_ICONS.has(l['icon'] as ComplianceIcon)
        ? (l['icon'] as ComplianceIcon)
        : undefined
      return {
        title,
        ...(str(l['issuer']) ? { issuer: str(l['issuer']) } : {}),
        ...(str(l['licenseNumber']) ? { licenseNumber: str(l['licenseNumber']) } : {}),
        ...(icon ? { icon } : {}),
      }
    })
    .filter((l): l is LicenseCard => l !== null)

  const rawCommitments = Array.isArray(data['commitments']) ? data['commitments'] : []
  const commitments = rawCommitments
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => str(c['text']))
    .filter(Boolean)

  return {
    licenses,
    commitments,
    ...(str(data['eyebrow']) ? { eyebrow: str(data['eyebrow']) } : {}),
    ...(str(data['heading']) ? { heading: str(data['heading']) } : {}),
    ...(str(data['intro']) ? { intro: str(data['intro']) } : {}),
    ...(str(data['commitmentsHeading']) ? { commitmentsHeading: str(data['commitmentsHeading']) } : {}),
  }
}
