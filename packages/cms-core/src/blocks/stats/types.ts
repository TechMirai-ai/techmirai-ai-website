export interface StatItem {
  value: number
  suffix?: string
  label: string
  icon?: string
}

export interface StatsBlockProps {
  eyebrow?: string
  sectionHeading?: string
  items: StatItem[]
}
