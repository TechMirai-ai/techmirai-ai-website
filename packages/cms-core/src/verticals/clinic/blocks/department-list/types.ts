export interface DepartmentCardItem {
  id: string
  title: string
  excerpt?: string
  imageUrl?: string
  icon?: string
  slug?: string
}

export interface DepartmentListBlockProps {
  blockType?: 'department-list'
  eyebrow?: string
  heading?: string
  subheadline?: string
  departments: DepartmentCardItem[]
  columns: '2' | '3'
}
