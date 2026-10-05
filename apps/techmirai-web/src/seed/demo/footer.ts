import type { Payload } from 'payload'
import siteConfig from '../../../site.config'

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
export async function seedDemoFooter(payload: Payload): Promise<void> {
  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const current = await (payload as any).findGlobal({ slug: 'footer', locale: 'all', depth: 0 })

  // Pack-2/E2: footer columns (Content Spec §4 "Footer" — Product/Solutions/
  // Company), replacing whatever clinic-era content was hand-authored in the
  // admin UI and never captured in version control. "Live demo" is an
  // external link to the (placeholder) demo subdomain.
  await (payload as any).updateGlobal({
    slug: 'footer',
    locale: 'all',
    data: {
      ...current,
      contactEmail: siteConfig.contact.email,
      officeAddress: {
        en: siteConfig.contact.address?.en,
        ja: siteConfig.contact.address?.ja,
      },
      columns: [
        {
          heading: { en: 'Product', ja: 'サービス' },
          links: [
            { label: { en: 'AI受付', ja: 'AI受付' }, href: '/ai-reception' },
            { label: { en: 'How It Works', ja: '仕組み' }, href: '/how-it-works' },
            { label: { en: 'Integrations', ja: '連携' }, href: '/integrations' },
            { label: { en: 'Pricing', ja: '料金' }, href: '/pricing' },
            {
              // demoUrl is currently a bracketed CONFIRM placeholder (see
              // docs/PLACEHOLDER-REGISTER.md), stored literally per CLAUDE.md
              // rule 5 — not a real URL yet.
              label: { en: 'Live demo', ja: 'デモ' },
              href: siteConfig.integrations.demoUrl ?? '',
            },
          ],
        },
        {
          heading: { en: 'Solutions', ja: '業種別' },
          links: [
            { label: { en: 'Clinics', ja: 'クリニック・治療院' }, href: '/solutions/clinic' },
            { label: { en: 'Beauty salons', ja: '美容サロン' }, href: '/solutions/beauty' },
            { label: { en: 'Auto service', ja: '自動車整備・販売' }, href: '/solutions/automobile' },
            { label: { en: 'Hotels', ja: 'ホテル・宿泊施設' }, href: '/solutions/hotel' },
          ],
        },
        {
          heading: { en: 'Company', ja: '会社情報' },
          links: [
            { label: { en: 'About', ja: '会社紹介' }, href: '/about' },
            { label: { en: 'Technology', ja: 'AI開発' }, href: '/technology' },
            { label: { en: 'Case study', ja: '導入事例' }, href: '/case-studies/sadiatec' },
            { label: { en: 'Insights', ja: 'コラム' }, href: '/blog' },
            { label: { en: 'FAQ', ja: 'よくあるご質問' }, href: '/faq' },
            { label: { en: 'Contact', ja: 'お問い合わせ' }, href: '/contact' },
          ],
        },
      ],
    },
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
