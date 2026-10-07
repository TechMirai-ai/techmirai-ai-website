import type { Payload } from 'payload'
import siteConfig from '../../site.config'

/**
 * Seeds the Header and Footer globals' real TechMirai nav/footer content
 * (Content Spec §4), relocated from the retired demo/ folder — these two
 * modules already held real content (Pack-2/E1-E2), not clinic placeholder
 * copy, so they move here unchanged rather than being deleted with the rest
 * of demo/.
 *
 * Read-modify-write at `locale: 'all'` rather than one `locale: 'ja'` write
 * followed by a `locale: 'en'` one — see @techmirai/cms-core/seed's
 * createLocalizedDoc doc comment for why a sequential per-locale write
 * clobbers shared row storage on a localized array field.
 */
export async function seedHeader(payload: Payload): Promise<void> {
  const phone = siteConfig.contact.phone ?? ''

  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const current = await (payload as any).findGlobal({ slug: 'header', locale: 'all', depth: 0 })

  await (payload as any).updateGlobal({
    slug: 'header',
    locale: 'all',
    data: {
      ...current,
      navItems: [
        { label: { en: 'AI受付', ja: 'AI受付' }, href: '/ai-reception' },
        {
          label: { en: 'Solutions', ja: '業種別' },
          href: '/solutions',
          children: [
            { label: { en: 'Clinics & treatment rooms', ja: 'クリニック・治療院' }, href: '/solutions/clinic' },
            { label: { en: 'Beauty salons', ja: '美容サロン' }, href: '/solutions/beauty' },
            { label: { en: 'Auto service & dealers', ja: '自動車整備・販売' }, href: '/solutions/automobile' },
            { label: { en: 'Hotels & guesthouses', ja: 'ホテル・宿泊施設' }, href: '/solutions/hotel' },
          ],
        },
        { label: { en: 'How It Works', ja: '仕組み' }, href: '/how-it-works' },
        { label: { en: 'Integrations', ja: '連携' }, href: '/integrations' },
        { label: { en: 'Pricing', ja: '料金' }, href: '/pricing' },
        { label: { en: 'About', ja: '会社紹介' }, href: '/about' },
        { label: { en: 'Technology', ja: 'AI開発' }, href: '/technology' },
      ],
      ctaButton: {
        // label is written separately below — see the comment there.
        href: '/assessment',
      },
      phoneButton: {
        phoneDisplay: phone,
        phoneHref: `tel:${phone}`,
        badgeLabel: 'Call Now',
        subLabel: 'Click to call us',
      },
      lineButton: {
        href: siteConfig.reception.staffLineUrl ?? '',
      },
    },
  })

  // ctaButton.label is a GROUP field's localized sub-field — unlike navItems'
  // (an ARRAY field's localized sub-field, which the locale:'all' write above
  // persists correctly), a locale:'all' write silently drops group-field
  // localized values (confirmed by direct DB read: navItems[].label came
  // back as {en,ja} correctly, ctaButton.label came back as {en: null}, no
  // ja key at all). Logged in docs/ENGINE-FIXES.md. Workaround: write each
  // locale's label separately, after navItems already has both locales
  // filled so these single-locale updates don't fail the "empty required
  // label" global validation.
  await (payload as any).updateGlobal({
    slug: 'header',
    locale: 'en',
    data: { ctaButton: { label: 'Free AI Website Assessment', href: '/assessment' } },
  })
  await (payload as any).updateGlobal({
    slug: 'header',
    locale: 'ja',
    data: { ctaButton: { label: '無料AIホームページ診断', href: '/assessment' } },
  })
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function seedFooter(payload: Payload): Promise<void> {
  // locale:'all' is a Payload runtime feature not reflected in its TypeScript overloads
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const current = await (payload as any).findGlobal({ slug: 'footer', locale: 'all', depth: 0 })

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
