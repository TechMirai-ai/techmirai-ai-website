export interface DoctorCardItem {
  id: string
  name: string
  title?: string
  photoUrl?: string
  specialties: string[]
  yearsOfExperience?: number
  bio?: string
  slug?: string
}

export interface DoctorGridBlockProps {
  blockType?: 'doctor-grid'
  eyebrow?: string
  heading?: string
  subheadline?: string
  doctors: DoctorCardItem[]
  columns: '3' | '4'
  showBio: boolean
}
