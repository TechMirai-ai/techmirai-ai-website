export interface CaseStudyTeaserBlockProps {
  heading: string
  body?: string
  statsStrip?: string
  note?: string
  buttonLabel?: string
  buttonHref?: string
  // Injected by the consuming app's page renderer from SiteConfig.features.caseStudyTeaser —
  // see packages/cms-core/src/blocks/case-study-teaser/adapter.ts.
  visible: boolean
}
