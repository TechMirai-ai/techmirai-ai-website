import type { Block } from 'payload'

// Spec §8.1 ("Diagram for the designer: how AI受付 answers", p.50-51):
// 4 nodes, redrawn as inline SVG in brand colours (see component.tsx) with
// a bilingual text alternative (the "done when" accessibility gate).
export const LayeredAnswersDiagramBlockConfig: Block = {
  slug: 'layered-answers-diagram',
  interfaceName: 'LayeredAnswersDiagramBlock',
  labels: { singular: 'Layered Answers Diagram', plural: 'Layered Answers Diagrams' },
  fields: [
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 4,
      admin: {
        description:
          'Exactly 4 nodes, in order (e.g. Buttons / Your own answers / AI / A person). The last node is rendered as the always-reachable "talk to a person" target, with a dashed route open from every earlier node, per Spec p.50-51.',
      },
      fields: [{ name: 'label', type: 'text', localized: true, required: true }],
    },
  ],
}
