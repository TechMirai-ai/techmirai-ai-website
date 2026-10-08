import type { Payload } from 'payload'
import { updateLocalizedDoc } from '@techmirai/cms-core/seed'
import type { DownloadIds } from '../downloads'

/**
 * Pack-3/H2: /solutions (Spec §7, lines 539-547 of
 * `docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`). Same
 * `updateLocalizedDoc` pattern as `pages/ai-reception.ts`.
 *
 * The hub's own "Bottom line" sentence ("Don't see your industry?...") is
 * used as the closing `cta-banner`'s `heading` rather than reusing 5.14's
 * "Transform your website..." verbatim (unlike the 4 industry pages below,
 * which do reuse 5.14 — see solutions-industries.ts's own comment). The
 * Spec gives the hub this one dedicated invitation sentence, which reads
 * as a closing CTA in its own right; 5.14's heading doesn't fit directly
 * after "here are 4 industry pages, don't see yours?" as well as the
 * Spec's own sentence does. The button/secondaryButton/textLink/
 * showContactStrip underneath are the same site-wide pattern every other
 * closing CTA already uses. Logged as an interpretation call in
 * docs/FINDINGS.md.
 */
export async function seedSolutionsHub(payload: Payload, downloads: DownloadIds): Promise<void> {
  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: 'AI受付 for your industry',
      body: 'Every business has its own questions, bookings and busy hours. Here is how AI受付 works in yours.',
      textAlignment: 'left',
    },
    {
      blockType: 'bento-grid',
      layout: 'standard',
      items: [
        { title: 'Clinics & treatment rooms', href: '/solutions/clinic' },
        { title: 'Beauty salons', href: '/solutions/beauty' },
        { title: 'Auto service & dealers', href: '/solutions/automobile' },
        { title: 'Hotels & guesthouses', href: '/solutions/hotel' },
      ],
    },
    {
      blockType: 'cta-banner',
      heading: 'Don’t see your industry? Ask us — the same front desk works for any business that takes bookings.',
      primaryButton: { label: 'Get a free AI website assessment', href: '/assessment' },
      secondaryButton: { label: 'Ask us on LINE', href: '#', variant: 'outline' },
      textLink: { label: 'Download the brochure (PDF)', href: downloads.brochureUrl },
      showContactStrip: true,
    },
  ]

  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'hero',
      heading: '業種別のAI受付活用',
      body: '業種ごとに、よくあるご質問も、予約の形も、忙しい時間帯も違います。それぞれの業種での使い方をご紹介します。',
      textAlignment: 'left',
    },
    {
      blockType: 'bento-grid',
      layout: 'standard',
      items: [
        { title: 'クリニック・治療院', href: '/solutions/clinic' },
        { title: '美容サロン', href: '/solutions/beauty' },
        { title: '自動車整備・販売', href: '/solutions/automobile' },
        { title: 'ホテル・宿泊施設', href: '/solutions/hotel' },
      ],
    },
    {
      blockType: 'cta-banner',
      heading: '該当する業種がない場合も、お気軽にご相談ください。予約を受け付けるお店であれば、同じ仕組みでご利用いただけます。',
      primaryButton: { label: '無料AIホームページ診断を申し込む', href: '/assessment' },
      secondaryButton: { label: 'LINEで相談する', href: '#', variant: 'outline' },
      textLink: { label: '資料をダウンロード（PDF）', href: downloads.brochureUrl },
      showContactStrip: true,
    },
  ]

  await updateLocalizedDoc(payload, 'pages', 'solutions', {
    en: { layout: enLayout },
    ja: { layout: jaLayout },
  })

  payload.logger.info('🏭 /solutions hub content seeded (Spec §7)')
}
