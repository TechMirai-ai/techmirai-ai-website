import type { Block } from 'payload'

// Pack-3/H2 (Spec §7, "an example chat"): no existing block renders a
// conversation transcript. The mandatory "Example conversation. Details
// are illustrative." label is hardcoded in component.tsx (keyed off
// locale), not a field here — it must appear on every instance of this
// block, structurally, not depend on every seed call remembering it.
export const ExampleChatBlockConfig: Block = {
  slug: 'example-chat',
  interfaceName: 'ExampleChatBlock',
  labels: { singular: 'Example Chat', plural: 'Example Chats' },
  fields: [
    {
      name: 'customerLabel',
      type: 'text',
      localized: true,
      required: true,
      admin: { description: 'The non-AI speaker label, e.g. "Patient" / "Customer" / "Guest".' },
    },
    {
      name: 'turns',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'speaker',
          type: 'select',
          required: true,
          options: [
            { label: 'Customer', value: 'customer' },
            { label: 'AI受付', value: 'ai' },
          ],
        },
        { name: 'message', type: 'textarea', localized: true, required: true },
      ],
    },
  ],
}
