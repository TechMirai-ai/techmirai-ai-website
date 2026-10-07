import type { Block } from 'payload'

// Spec §5.8 ("Case study: Sadiatec"): a homepage teaser card gated by
// Sadiatec's written permission (docs/PLACEHOLDER-REGISTER.md F1-14).
// `visible` is deliberately NOT a field here — it's injected at render time
// from SiteConfig.features.caseStudyTeaser, same pattern as booking-cta's
// `enabled`/`bookingProviderUrl` (packages/cms-core/src/blocks/booking-cta/config.ts),
// so the homepage card and its button either both exist or neither does, on
// both locales at once, with no stored boolean to drift between them.
export const CaseStudyTeaserBlockConfig: Block = {
  slug: 'case-study-teaser',
  interfaceName: 'CaseStudyTeaserBlock',
  labels: { singular: 'Case Study Teaser', plural: 'Case Study Teasers' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'textarea', localized: true },
    {
      name: 'statsStrip',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line, e.g. "About 20 pages · 3 languages · ..."' },
    },
    { name: 'note', type: 'text', localized: true },
    { name: 'buttonLabel', type: 'text', localized: true },
    { name: 'buttonHref', type: 'text' },
  ],
}
