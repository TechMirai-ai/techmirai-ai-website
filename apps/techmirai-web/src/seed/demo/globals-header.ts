import type { Payload } from 'payload'
import siteConfig from '../../../site.config'

/**
 * Seeds the Header global's nav items, CTA button, and phone/LINE buttons.
 *
 * Pack-2/E1: navItems/ctaButton now carry the real TechMirai navigation
 * (Content Spec §4), written with `locale: 'all'` and `{en, ja}` label
 * objects — the same localized-array-field pattern `seedDemoFooter` uses —
 * since `navItems.label`/`children.label`/`ctaButton.label` are all
 * `localized: true` in the schema. This replaces the clinic-era nav content
 * that was previously hand-authored in the Payload admin UI and only existed
 * in the dev DB (not reproducible from any file in this repo before this).
 *
 * The Hero block has no phone/nav field of its own — those are injected at
 * render time from this global by `resolveHeaderData()` (see `page.tsx`'s
 * hero block-data injection).
 *
 * Pack-2/D2: phoneDisplay/phoneHref and the LINE button's href read from
 * site.config.ts (the single identity-constant source).
 */
export async function seedDemoHeader(payload: Payload): Promise<void> {
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
        // The doc says nothing about these two localized labels, so they carry
        // the values the schema itself defaults them to rather than new copy.
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
  // label" global validation that affected navItems historically.
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
