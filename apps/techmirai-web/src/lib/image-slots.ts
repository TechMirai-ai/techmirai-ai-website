/**
 * Pack-4/N1: every image slot on the site (Spec §19, pp.111-113) as data.
 * docs/IMAGE-SLOTS.md is the human table for the same list;
 * `image-slots.test.ts` checks the alt text, the Spec wording and that the two stay in step.
 *
 * Sizes are written only where the Spec gives one (CLAUDE.md rule 5).
 */

export const JA_TODO = '[JA TODO]'
export const SIZE_NOT_IN_SPEC = '[TBD: size not in Spec]'

export type ImageSlotStatus = 'done' | 'generated' | 'placeholder' | 'not-built'

export interface ImageAlt {
  en: string
  ja: string
}

export interface ImageSlot {
  id: string
  label: string
  page: string
  /** File (or route) that fills the slot today; null when nothing exists yet. */
  file: string | null
  size: string
  status: ImageSlotStatus
  /** `decorative` means an empty alt on purpose. */
  alt: ImageAlt | 'decorative'
  supplier: string
  registerId?: string
  note?: string
}

/** Spec p.113 alt text, word for word. */
export const SPEC_ALT = {
  heroMockup: {
    en: 'AI受付 answering a question and confirming a booking on a smartphone',
    ja: 'スマートフォンでAI受付が質問に答え、予約を確定している画面',
  },
  jamalPortrait: {
    en: 'Jamal Shah, founder of TechMirai',
    ja: 'TechMirai代表 ジャマル・シャー',
  },
  harukaPortrait: {
    en: 'Haruka Fujimori, sales and client relations',
    ja: '営業・お客様窓口 [藤森 はるか]',
  },
  layersDiagram: {
    en: 'AI受付 answers with buttons first, then approved answers, then AI, with staff available at every step',
    ja: 'AI受付は、ボタン、承認済みの回答、AIの順に答え、どの段階でもスタッフにつながる',
  },
} as const satisfies Record<string, ImageAlt>

const PORTRAIT_SIZE = '1200×1500 (Spec); placeholder file is 1200×1200'
const PLACEHOLDER_PORTRAIT_NOTE = 'Placeholder is a neutral initials avatar, never a generated face (CLAUDE.md rule 8).'
const CONSENT_SUPPLIER = 'The person (written consent, F1-15)'

function placeholderPortraitAlt(name: string): ImageAlt {
  return { en: `Placeholder portrait for ${name}: real photo pending written consent (F1-15)`, ja: JA_TODO }
}

export const IMAGE_SLOTS: readonly ImageSlot[] = [
  // People
  {
    id: 'portrait-jamal',
    label: 'Portrait: Jamal Shah',
    page: 'Homepage 5.11, About 10.4',
    file: 'placeholder-team-jamal.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: SPEC_ALT.jamalPortrait,
    supplier: CONSENT_SUPPLIER,
    registerId: 'N1-08',
    note: PLACEHOLDER_PORTRAIT_NOTE,
  },
  {
    id: 'portrait-maruf',
    label: 'Portrait: Abdullah Al Maruf',
    page: 'Homepage 5.11, About 10.4',
    file: 'placeholder-team-abdullah.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: placeholderPortraitAlt('Abdullah Al Maruf'),
    supplier: CONSENT_SUPPLIER,
    registerId: 'N1-09',
    note: PLACEHOLDER_PORTRAIT_NOTE,
  },
  {
    id: 'portrait-haruka',
    label: 'Portrait: Haruka Fujimori',
    page: 'Homepage 5.11, About 10.4',
    file: 'placeholder-team-haruka.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: SPEC_ALT.harukaPortrait,
    supplier: CONSENT_SUPPLIER,
    registerId: 'N1-08',
    note: PLACEHOLDER_PORTRAIT_NOTE,
  },
  {
    id: 'portrait-nahida',
    label: 'Portrait: Nahida Rahaman',
    page: 'Homepage 5.11, About 10.4',
    file: 'placeholder-team-nahida.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: placeholderPortraitAlt('Nahida Rahaman'),
    supplier: CONSENT_SUPPLIER,
    registerId: 'N1-09',
    note: PLACEHOLDER_PORTRAIT_NOTE,
  },
  {
    id: 'portrait-new-engineer',
    label: 'Portrait: new engineer',
    page: 'Homepage 5.11, About 10.4',
    file: 'placeholder-team-new-engineer.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: placeholderPortraitAlt('the new engineer'),
    supplier: 'Jamal (person not hired yet)',
    registerId: 'N1-09',
    note: PLACEHOLDER_PORTRAIT_NOTE,
  },
  {
    id: 'portrait-partner',
    label: 'Portrait: Md. Sanaul Haque (partner)',
    page: 'Homepage 5.11, About 10.5',
    file: 'placeholder-partner-sanaul-haque.png',
    size: SIZE_NOT_IN_SPEC,
    status: 'placeholder',
    alt: { en: 'Placeholder portrait for Sadiatec Co., Ltd. partner (Md. Sanaul Haque): real photo pending', ja: JA_TODO },
    supplier: "Sadiatec's approved photo (Jamal asks Md. Sanaul Haque)",
    registerId: 'N1-09',
    note: 'The page shows the block alt (company name), not this media alt.',
  },
  {
    id: 'portrait-generic',
    label: 'Generic individual portrait placeholder',
    page: 'Not placed on a page',
    file: 'placeholder-team-portrait.png',
    size: PORTRAIT_SIZE,
    status: 'placeholder',
    alt: placeholderPortraitAlt('an individual'),
    supplier: 'Developer (remove when unused)',
    registerId: 'N1-09',
    note: 'F3-16: generated, unassigned.',
  },
  {
    id: 'team-group',
    label: 'Team group photo',
    page: 'About hero (10.1)',
    file: 'placeholder-team-group.png',
    size: '2400×1350',
    status: 'placeholder',
    alt: { en: 'Placeholder team group photo: real photo pending (Spec §19)', ja: JA_TODO },
    supplier: 'Team (a real workplace; never a composite photo)',
    registerId: 'N1-09',
    note: 'F3-15: generated, not placed on the About hero yet.',
  },
  {
    id: 'haruka-at-work',
    label: 'Haruka at work',
    page: 'Homepage first-time card, Assessment page',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: "Haruka (and the client's permission)",
    registerId: 'N1-02',
    note: 'Alt text is written when the real photo exists.',
  },
  {
    id: 'engineer-at-work',
    label: 'Engineer at work (admin panel on a laptop)',
    page: 'Technology page',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: 'Engineer (no private data visible)',
    registerId: 'N1-03',
    note: 'Alt text is written when the real photo exists.',
  },
  // Product visuals
  {
    id: 'hero-phone-mockup',
    label: 'Phone mockup (chat answer, booking, LINE confirmation)',
    page: 'Homepage hero 5.1',
    file: 'placeholder-hero-phone-mockup.png',
    size: '750×1334 (chosen in G1; the Spec gives no size)',
    status: 'placeholder',
    alt: SPEC_ALT.heroMockup,
    supplier: 'Developer, from real demo screenshots',
    registerId: 'G1-01',
  },
  {
    id: 'three-step-strip',
    label: 'Three-step strip (choose a service, pick a time, confirmed)',
    page: 'Homepage 5.5',
    file: null,
    size: 'n/a',
    status: 'done',
    alt: 'decorative',
    supplier: 'Developer',
    note: 'Built as three text pills in the live-demo block, so there is no image file.',
  },
  {
    id: 'before-after',
    label: 'Before/After illustration (static site vs. site with reception chat)',
    page: 'Homepage 5.3',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: 'Designer or Jamal',
    registerId: 'N1-04',
  },
  {
    id: 'layers-diagram',
    label: 'Layered answers diagram',
    page: 'How It Works (Section 8)',
    file: 'inline SVG: layered-answers-diagram block',
    size: 'n/a (vector)',
    status: 'done',
    alt: SPEC_ALT.layersDiagram,
    supplier: 'Developer',
    note: 'The SVG is aria-hidden and a screen-reader list follows it; the Spec alt sentence is not applied (engine block).',
  },
  {
    id: 'admin-screenshot',
    label: 'Admin panel screenshot (booking list and FAQ editor, demo data)',
    page: 'How It Works, Technology',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: 'Developer (demo data only)',
    registerId: 'N1-05',
  },
  {
    id: 'sample-report',
    label: 'Sample assessment report (one page, demo data, labelled Sample)',
    page: 'Assessment page',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: 'Developer / Jamal (content of the report)',
    registerId: 'N1-06',
  },
  {
    id: 'qr-code',
    label: 'QR code to the live demo',
    page: 'Homepage 5.5 (desktop only)',
    file: 'generated at render time: src/lib/qr-code.ts',
    size: '140×140 on page',
    status: 'done',
    alt: 'decorative',
    supplier: 'Developer',
    note: 'Encodes siteConfig.integrations.demoUrl. Empty alt: the demo button and caption beside it carry the meaning.',
  },
  // Industry images
  {
    id: 'industry-images',
    label: 'Industry images (clinic, beauty, automobile, hotel)',
    page: 'Industry pages (Section 7)',
    file: null,
    size: SIZE_NOT_IN_SPEC,
    status: 'not-built',
    alt: 'decorative',
    supplier: 'Jamal (licensed stock or brand-green illustrations; never captioned as clients)',
    registerId: 'N1-07',
  },
  // Brand
  {
    id: 'logo',
    label: 'Logo (SVG)',
    page: 'Header, footer, loader',
    file: 'public/brand/logo.svg',
    size: 'vector',
    status: 'placeholder',
    alt: { en: 'TechMirai Logo', ja: 'TechMirai Logo' },
    supplier: 'Jamal (keep the current logo, Spec §19)',
    registerId: 'D2-02',
    note: 'Text wordmark until the real SVG is supplied.',
  },
  {
    id: 'favicon',
    label: 'Favicon (square source plus .ico)',
    page: 'Every page',
    file: 'public/favicon.ico, public/brand/favicon-512.png',
    size: 'square (512×512 source)',
    status: 'placeholder',
    alt: 'decorative',
    supplier: 'Jamal',
    registerId: 'D2-02',
    note: 'Still the old clinic icon.',
  },
  {
    id: 'blog-hero-background',
    label: 'Blog index hero background (clinic template leftover)',
    page: '/blog, /en/blog',
    file: '/hero-placeholder.jpg',
    size: SIZE_NOT_IN_SPEC,
    status: 'placeholder',
    alt: 'decorative',
    supplier: 'Jamal (or remove from the page)',
    registerId: 'N1-01',
  },
  // Share images
  {
    id: 'share-images',
    label: 'Social share images, one per page',
    page: 'og:image and twitter:image on every page',
    file: 'generated: /og?path=&locale= (L2-05)',
    size: '1200×630',
    status: 'generated',
    alt: 'decorative',
    supplier: 'Developer',
    registerId: 'L2-05',
    note: 'Not rendered in the page body, so no alt attribute applies.',
  },
  {
    id: 'share-images-seeded',
    label: 'Seeded og-*.png files (superseded by /og, unused)',
    page: 'None',
    file: 'og-*.png in the media collection',
    size: '1200×630',
    status: 'placeholder',
    alt: { en: 'Placeholder social-share image for the page', ja: JA_TODO },
    supplier: 'Developer (remove when convenient)',
    registerId: 'N1-09',
    note: 'F3-01 to F3-14 and F3-17 to F3-20.',
  },
]
