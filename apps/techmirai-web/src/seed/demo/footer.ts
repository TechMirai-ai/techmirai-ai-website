import type { Payload } from 'payload'

/**
 * Seeds the Footer global's contact info (both locales explicitly written) so
 * the footer never falls through to Footer.tsx's own siteConfig fallbacks or
 * to Payload's ja→en locale fallback.
 *
 * Read-modify-write at `locale: 'all'` rather than one `locale: 'ja'` write
 * followed by a `locale: 'en'` one. Two reasons:
 *
 *  1. `columns[].links[].label` is `localized: true, required: true`, and the
 *     footer links currently in the CMS were authored in `en` only. A
 *     `locale: 'ja'` update revalidates the whole global and fails on those
 *     empty ja labels — which is what made this seed abort on its last step.
 *     Writing every locale at once keeps each label exactly as authored.
 *  2. It is the same single-write rule the collections follow (see
 *     @techmirai/cms-core/seed's createLocalizedDoc): one write per localized
 *     array field, never a per-locale sequence that clobbers shared row
 *     storage.
 */
const OFFICE_ADDRESS = {
  ja: '〒154-0022 東京都世田谷区梅丘2-14-8 さくらビル1F',
  en: 'Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022',
}

const CONTACT_EMAIL = 'info@sakura-sekkotsu.example'

export async function seedDemoFooter(payload: Payload): Promise<void> {
  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const current = await (payload as any).findGlobal({ slug: 'footer', locale: 'all', depth: 0 })

  await (payload as any).updateGlobal({
    slug: 'footer',
    locale: 'all',
    data: {
      ...current,
      contactEmail: CONTACT_EMAIL,
      officeAddress: OFFICE_ADDRESS,
    },
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
