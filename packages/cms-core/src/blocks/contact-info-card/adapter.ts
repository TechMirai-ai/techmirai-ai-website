import type { ContactInfoCardBlockProps, ContactInfoCardLink } from './types'

export function adaptContactInfoCardBlock(raw: unknown): ContactInfoCardBlockProps {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>

  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined

  const result: ContactInfoCardBlockProps = {}

  const heading = str(data['heading'])
  if (heading) result.heading = heading

  const subheading = str(data['subheading'])
  if (subheading) result.subheading = subheading

  const address = str(data['address'])
  if (address) result.address = address

  const tel = str(data['tel'])
  if (tel) result.tel = tel

  const fax = str(data['fax'])
  if (fax) result.fax = fax

  const phone = str(data['phone'])
  if (phone) result.phone = phone

  const email = str(data['email'])
  if (email) result.email = email

  const officeHours = str(data['officeHours'])
  if (officeHours) result.officeHours = officeHours

  const rawLinks = data['links']
  if (Array.isArray(rawLinks)) {
    const links: ContactInfoCardLink[] = rawLinks
      .map((item) => {
       const linkData = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>
        const label = str(linkData['label'])
        const url = str(linkData['url'])
        if (!label || !url) return null
        return { label, url }
      })
      .filter((l): l is ContactInfoCardLink => l !== null)

    if (links.length > 0) result.links = links
  }

  const note = str(data['note'])
  if (note) result.note = note

  return result
}