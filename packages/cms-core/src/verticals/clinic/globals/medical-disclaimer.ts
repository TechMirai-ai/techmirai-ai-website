import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import { plainTextToLexical } from '../../../payload/lib/plain-text-to-lexical'
import type { GlobalConfig } from 'payload'

// Japanese 医療広告ガイドライン (and equivalents elsewhere) can require a
// legally-reviewed, prefecture/jurisdiction-specific medical disclaimer on
// every page. This is an open question flagged in docs/adr/001-foundation-choices.md
// (#2) — the copy below is a placeholder only, not legal content.
export const MEDICAL_DISCLAIMER_PLACEHOLDER =
  '[PLACEHOLDER — replace with legally reviewed medical disclaimer before this site is used for a real clinic client. Do not launch with this text.]'

export const MedicalDisclaimerGlobal: GlobalConfig = {
  slug: 'medical-disclaimer',
  label: 'Medical Disclaimer',
  hooks: { afterChange: [() => { revalidateTag('medical-disclaimer') }] },
  fields: [
    {
      name: 'disclaimer',
      type: 'richText',
      localized: true,
      defaultValue: () => plainTextToLexical(MEDICAL_DISCLAIMER_PLACEHOLDER),
      admin: {
        description:
          'Shown on every page (footer). Legally-required medical advertising disclaimer — must be replaced with reviewed, jurisdiction-specific text before this site goes live for a real clinic client. Do not decide this content without legal review.',
      },
    },
  ],
}
