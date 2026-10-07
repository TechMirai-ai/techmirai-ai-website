export interface LiveDemoChecklistItem {
  text: string
}

export interface LiveDemoStep {
  text: string
}

export interface LiveDemoTile {
  label: string
  description: string
  href: string
  buttonLabel?: string
}

export interface LiveDemoBlockProps {
  heading: string
  body?: string
  checklistItems?: LiveDemoChecklistItem[]
  buttonLabel?: string
  buttonHref?: string
  qrCaption?: string
  smallPrint?: string
  threeStepStrip?: LiveDemoStep[]
  tiles: LiveDemoTile[]
  /** Injected by the homepage route from siteConfig.integrations.demoUrl — see page.tsx. */
  qrCodeDataUrl?: string
}
