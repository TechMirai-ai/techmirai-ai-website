export interface TeamGridCardMember {
  id: string
  name: string
  title: string
  line?: string
  fullBio?: string
  photoUrl?: string
}

export interface TeamGridPartnerCard {
  name: string
  role?: string
  line?: string
  clarityLine?: string
  photoUrl?: string
}

export interface TeamGridBlockProps {
  sectionHeading?: string
  intro?: string
  bullets?: string[]
  members: TeamGridCardMember[]
  partner?: TeamGridPartnerCard
  columns: '3' | '4'
  showBio: boolean
  buttonLabel?: string
  buttonHref?: string
}
