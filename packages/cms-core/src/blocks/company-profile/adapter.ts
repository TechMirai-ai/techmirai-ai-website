import type { CompanyProfileBlockProps, CompanyProfileRow } from './types'

export function adaptCompanyProfileBlock(raw: unknown): CompanyProfileBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const profile = (data['inlineProfile'] ?? {}) as Record<string, unknown>

  const str = (v: unknown) => (typeof v === 'string' && v ? v : '')

  const rowDefs: { label: string; key: string }[] = [
    { label: 'Company Name', key: 'companyName' },
    { label: 'Founded',      key: 'founded' },
    { label: 'CEO',          key: 'ceo' },
    { label: 'Address',      key: 'address' },
    { label: 'Capital',      key: 'capital' },
    { label: 'License',      key: 'licenseNumber' },
    { label: 'Headcount',    key: 'headcount' },
    { label: 'Business',     key: 'businessDescription' },
  ]

  const rows: CompanyProfileRow[] = rowDefs
  .map(({ label, key }) => ({ 
    label, 
    value: str(profile[key]), 
    key // <--- Pass the key here so the component can use it
  }))
  .filter((r) => r.value)
  const photo = data['photo'] as Record<string, unknown> | null | undefined
  const photoUrl = photo && typeof photo['url'] === 'string' ? photo['url'] : undefined
  const photoAlt = photo && typeof photo['alt'] === 'string' ? photo['alt'] : undefined

  const badgeRaw = (data['yearsBadge'] ?? {}) as Record<string, unknown>
  const badgeYears = typeof badgeRaw['years'] === 'number' ? badgeRaw['years'] : 0
  const badgeLabel = str(badgeRaw['label'])
  const resolvedLabel = badgeLabel.replace('{years}', String(badgeYears))

  const ctaRaw = (data['viewFullPageCta'] ?? {}) as Record<string, unknown>
  const ctaLabel = str(ctaRaw['label'])
  const ctaHref = str(ctaRaw['href']) || '/company'

  return {
    rows,
    ...(str(data['eyebrow']) ? { eyebrow: str(data['eyebrow']) } : {}),
    ...(str(data['heading']) ? { heading: str(data['heading']) } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(photoAlt ? { photoAlt } : {}),
    ...(str(data['photoFallbackText']) ? { photoFallbackText: str(data['photoFallbackText']) } : {}),
    ...(badgeYears && badgeLabel ? { yearsBadge: { years: badgeYears, label: resolvedLabel } } : {}),
    ...(ctaLabel ? { viewFullPageCta: { label: ctaLabel, href: ctaHref } } : {}),
  }
}
