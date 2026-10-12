import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'

/**
 * Pack-3/I4: /thanks (Spec §12.3 "After submitting", lines 1051-1057 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`; route
 * description at p.16: "After any form. noindex"). Same `updateLocalizedDoc`
 * pattern as `pages/technology.ts`.
 *
 * Spec deviation (confirmed in plan review, logged in docs/FINDINGS.md):
 * the Spec's body sentence is "Want to talk sooner? Book a 30-minute call
 * below or message us on LINE." The booking half has no real destination —
 * consultation booking is Pack 4/J2, not built yet — and this page is
 * explicitly generic/reusable for any form, not assessment-specific, so
 * inventing a booking link here would be a dead CTA. Only the clause
 * "Book a 30-minute call below or " is removed (capitalizing "Message" in
 * its place); every other word, including both `[1 business day]`/
 * `[3 business days]` brackets, is unchanged from the Spec.
 *
 * Unlike every prior page seed file (pricing/security/about/technology),
 * this one also sets `meta.title`/`meta.description` (mirroring the H1,
 * not new copy) and `meta.noindex`/`aiVisible`, since this page specifically
 * requires both per the Spec (p.16 "noindex"; line 1571 excludes /thanks
 * from AI-visible pages) — the prior pages' placeholder meta/aiVisible gap
 * is a separate, pre-existing issue logged in docs/FINDINGS.md, not fixed
 * here.
 *
 * The LINE link reuses page-hero's own (non-required) `secondaryButton`
 * field with the href sentinel `'#'`, resolved to the real LINE URL by
 * `[locale]/[slug]/page.tsx`'s new Pack-3/I4 branch — same sentinel idiom
 * `cta-banner` already uses elsewhere on this site, just applied to one
 * more block type. No `cta-banner` block here: every existing usage of it
 * always sets a required `primaryButton`, and the Spec gives this page no
 * primary action beyond the (omitted) booking link.
 */
export async function seedThanksPage(payload: Payload): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'Thank you. We have received your request.',
      body:
        'You will hear from us within [1 business day] to confirm, and receive your report within [3 business days]. Want to talk sooner? Message us on LINE.',
      textAlignment: 'left',
      secondaryButton: { label: 'Message us on LINE', href: '#' },
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'お申し込みありがとうございます。',
      body:
        '[1営業日]以内に受付のご連絡を、[3営業日]以内にレポートをお送りします。お急ぎの場合は、LINEでご連絡ください。',
      textAlignment: 'left',
      secondaryButton: { label: 'LINEでご連絡ください', href: '#' },
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'thanks', {
    en: {
      layout: enLayout,
      meta: {
        title: 'Thank you',
        description: 'Thank you. We have received your request.',
        noindex: true,
      },
      aiVisible: false,
    },
    ja: {
      layout: jaLayout,
      meta: {
        title: '送信完了',
        description: 'お申し込みありがとうございます。',
        noindex: true,
      },
      aiVisible: false,
    },
  })

  payload.logger.info('🙏 /thanks content seeded (Spec §12.3), noindex + excluded from AI corpus')
}
