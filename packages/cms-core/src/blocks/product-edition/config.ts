import type { Block } from 'payload'

// Spec §6.3/§6.4 ("AI受付 Web — available now" / "AI受付 Voice — in
// development"): one flexible block for both editions, since their shapes
// differ — Web has two "ways to start" (the second explicitly a hideable
// CONFIRM item), Voice has a closing line + a single button. `badge` is
// plain free-form text, not a fixed enum — Voice's "In development · Demo
// available" doesn't match the two-value status dict `capability-cards`
// uses elsewhere, and no shared badge-wording constant exists in this repo
// for that phrase (checked during the H1 plan).
export const ProductEditionBlockConfig: Block = {
  slug: 'product-edition',
  interfaceName: 'ProductEditionBlock',
  labels: { singular: 'Product Edition', plural: 'Product Editions' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'badge', type: 'text', localized: true },
    { name: 'body', type: 'textarea', localized: true },
    {
      name: 'itemsList',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line, e.g. "Website engine · Online reservation · ..."' },
    },
    {
      name: 'waysToStart',
      type: 'array',
      admin: { description: 'Web edition only. Omit the 2nd row to hide a CONFIRM-pending option.' },
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    { name: 'closingLine', type: 'textarea', localized: true, admin: { description: 'Voice edition only.' } },
    { name: 'buttonLabel', type: 'text', localized: true, admin: { description: 'Voice edition only.' } },
    { name: 'buttonHref', type: 'text' },
  ],
}
