import type { Block } from 'payload'

// Spec §5.11 ("Company and team"). The Partner card (Sadiatec Co., Ltd.) is
// deliberately static content on this block, not a `team`/`affiliates`
// relationship — Pack-3/I2 (About) is specced to treat "team" and "partner"
// as separate subsections and may model its own partner section
// differently; coupling this homepage card to a shared collection now would
// force I2 to inherit that decision. See the G4 plan's rationale.
export const TeamGridBlockConfig: Block = {
  slug: 'team-grid',
  interfaceName: 'TeamGridBlock',
  labels: { singular: 'Team Grid', plural: 'Team Grids' },
  fields: [
    { name: 'sectionHeading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'bullets',
      type: 'array',
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'team',
      hasMany: true,
      admin: { description: 'When empty, renders all members marked as featured' },
    },
    {
      name: 'partner',
      type: 'group',
      label: 'Partner card (static)',
      fields: [
        { name: 'photo', type: 'upload', relationTo: 'media' },
        { name: 'name', type: 'text', localized: true },
        { name: 'role', type: 'text', localized: true },
        { name: 'line', type: 'textarea', localized: true },
        {
          name: 'clarityLine',
          type: 'textarea',
          localized: true,
          admin: {
            description:
              'Optional small disclaimer line below the main line, e.g. "TechMirai is an independent business; X is our partner, not our parent company." (Pack-3/I2, Spec §10.5).',
          },
        },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
    },
    {
      name: 'showBio',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show full bio (recommended for team index page)' },
    },
    { name: 'buttonLabel', type: 'text', localized: true },
    { name: 'buttonHref', type: 'text' },
  ],
}
