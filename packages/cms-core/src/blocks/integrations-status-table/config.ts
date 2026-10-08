import type { Block } from 'payload'

// Spec §8.2 ("Integrations"): an honest per-tool status table with 4 fixed
// statuses. `tools-compatibility` is a fixed 3-column free-text summary
// block with no per-row status concept, so this is a new block rather than
// an extension of it.
export const IntegrationsStatusTableBlockConfig: Block = {
  slug: 'integrations-status-table',
  interfaceName: 'IntegrationsStatusTableBlock',
  labels: { singular: 'Integrations Status Table', plural: 'Integrations Status Tables' },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', localized: true, required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'available',
          admin: {
            description:
              'Maps to the Spec\'s fixed 4-value glossary (§8.2) — never store the wording directly here.',
          },
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Case by case', value: 'case-by-case' },
            { label: 'In development', value: 'in-development' },
            { label: 'Not offered', value: 'not-offered' },
          ],
        },
        { name: 'description', type: 'textarea', localized: true, required: true },
      ],
    },
    {
      name: 'footnote',
      type: 'textarea',
      localized: true,
      admin: { description: 'The bottom line, e.g. "Not sure about your tools?..."' },
    },
  ],
}
