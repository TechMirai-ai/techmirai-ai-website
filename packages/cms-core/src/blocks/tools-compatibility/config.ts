import type { Block } from 'payload'

// Spec §5.6 ("Keep your existing tools"): three columns describing what
// connects out of the box, what's case-by-case, and the fallback when a
// tool can't connect. col1List/col2List are single "·"-joined lines (same
// convention as capability-cards.badgeRow), matching how the Spec itself
// writes these two lists.
export const ToolsCompatibilityBlockConfig: Block = {
  slug: 'tools-compatibility',
  interfaceName: 'ToolsCompatibilityBlock',
  labels: { singular: 'Tools Compatibility', plural: 'Tools Compatibility' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'textarea', localized: true },
    { name: 'col1Title', type: 'text', localized: true, required: true },
    {
      name: 'col1List',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line, e.g. "LINE Official Account · Your own domain · ..."' },
    },
    { name: 'col2Title', type: 'text', localized: true, required: true },
    {
      name: 'col2List',
      type: 'text',
      localized: true,
      admin: { description: 'One "·"-joined line.' },
    },
    { name: 'col3Title', type: 'text', localized: true, required: true },
    { name: 'col3Body', type: 'textarea', localized: true },
    { name: 'linkLabel', type: 'text', localized: true },
    { name: 'linkHref', type: 'text' },
  ],
}
