export interface ContactInfoCardLink {
  label: string
  url: string
}

export interface ContactInfoCardBlockProps {
  heading?: string
  subheading?: string
  address?: string
  tel?: string
  fax?: string
  phone?: string
  email?: string
  officeHours?: string
  links?: ContactInfoCardLink[]
  note?: string
}