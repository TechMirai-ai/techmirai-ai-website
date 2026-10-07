import type { Block } from 'payload'

// Spec §5.9 ("Pricing"): one starter-package card with the bracketed
// "from [¥300,000]" / "from [¥30,000]" / "[Tax wording]" figures — brackets
// kept verbatim per CLAUDE.md rule 5 (docs/PLACEHOLDER-REGISTER.md F1-02, F1-20).
export const PricingTeaserBlockConfig: Block = {
  slug: 'pricing-teaser',
  interfaceName: 'PricingTeaserBlock',
  labels: { singular: 'Pricing Teaser', plural: 'Pricing Teasers' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'packageName', type: 'text', localized: true, required: true },
    { name: 'priceLine1', type: 'text', localized: true, required: true },
    { name: 'priceLine2', type: 'text', localized: true, required: true },
    {
      name: 'includesList',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line, e.g. "Website with AI受付 built in · ..."' },
    },
    { name: 'note', type: 'textarea', localized: true },
    { name: 'buttonLabel', type: 'text', localized: true },
    { name: 'buttonHref', type: 'text' },
  ],
}
