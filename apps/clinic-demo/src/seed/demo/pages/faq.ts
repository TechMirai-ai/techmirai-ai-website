import type { Payload } from 'payload'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'

/** FAQ page — slug `faq`, rendered at the site's real /faq route via [slug]/page.tsx. */
export async function seedDemoFAQPage(payload: Payload, faqIds: string[]): Promise<void> {
  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'page-title',
      pageTitle: 'よくあるご質問',
      showBreadcrumb: false,
    },
    {
      blockType: 'faq',
      sectionHeading: 'よくあるご質問',
      items: faqIds,
      variant: 'accordion',
    },
    {
      blockType: 'cta-banner',
      heading: 'それでも解決しない場合は',
      body: 'お電話またはお問い合わせフォームよりお気軽にご連絡ください。',
      primaryButton: { label: 'お問い合わせ', href: '/contact' },
      backgroundStyle: 'brand',
      variant: 'solid',
    },
  ]

  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'page-title',
      pageTitle: 'Frequently Asked Questions',
      showBreadcrumb: false,
    },
    {
      blockType: 'faq',
      sectionHeading: 'Frequently Asked Questions',
      items: faqIds,
      variant: 'accordion',
    },
    {
      blockType: 'cta-banner',
      heading: 'Still have questions?',
      body: 'Reach us by phone or through the contact form — we are happy to help.',
      primaryButton: { label: 'Contact Us', href: '/contact' },
      backgroundStyle: 'brand',
      variant: 'solid',
    },
  ]

  await createLocalizedDoc(payload, 'pages', {
    ja: {
      title: 'よくあるご質問',
      slug: 'faq',
      status: 'published',
      meta: {
        title: 'よくあるご質問 | さくら接骨院',
        description: '保険診療・ご予約・交通事故治療など、さくら接骨院へのよくあるご質問にお答えします。',
      },
      layout: jaLayout,
    },
    en: {
      title: 'FAQ',
      meta: {
        title: 'FAQ | Sakura Osteopathic Clinic',
        description: 'Answers to common questions about insurance, appointments, and traffic-accident treatment at Sakura Osteopathic Clinic.',
      },
      layout: enLayout,
    },
  })
}
