export type ServicesLayout = 'alternating' | 'corporate-banner'

export interface ServiceCta {
  label: string
  href: string
}

export interface ServiceItem {
  title: string
  subheadline?: string
  description?: string
  imageUrl?: string
  imageName?: string
  iconName?: string
  icon?: string
  cta?: ServiceCta
}

export interface ServicesGridBlockProps {
  eyebrow?: string
  heading?: string
  services?: ServiceItem[]
  layout?: ServicesLayout
}