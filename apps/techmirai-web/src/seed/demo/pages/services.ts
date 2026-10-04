import type { Payload } from 'payload'
import type { DemoMediaIds } from '../media'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'

/** Services page — slug `services`, rendered at the site's real /services route. */
export async function seedDemoServicesPage(payload: Payload, media: DemoMediaIds, faqIds: string[]): Promise<void> {
  const jaLayout = [
    {
      blockType: 'page-hero',
      variant: 'page-title',
      pageTitle: '施術メニュー',
      showBreadcrumb: false,
    },
    {
      blockType: 'services-grid',
      eyebrow: '施術のご案内',
      heading: '保険診療から自費メニューまで',
      layout: 'corporate-banner',
      services: [
        { title: '整形外科的施術', subheadline: '保険診療', description: '打撲・捻挫・挫傷など、日常のケガに保険診療で対応します。', image: media.services[3], cta: { label: '詳しくはこちら', href: '/contact' } },
        { title: 'スポーツ障害・リハビリ', subheadline: '保険診療・自費診療', description: 'スポーツによるケガの施術と、競技復帰に向けたリハビリプログラムをご用意しています。', image: media.services[4], cta: { label: '詳しくはこちら', href: '/contact' } },
        { title: '交通事故治療', subheadline: '自賠責保険', description: 'むちうちなど交通事故によるケガを、自賠責保険を使って施術します。', image: media.services[5], cta: { label: '詳しくはこちら', href: '/contact' } },
      ],
    },
    {
      blockType: 'faq',
      sectionHeading: 'よくあるご質問',
      items: faqIds,
      variant: 'grid',
    },
    {
      blockType: 'cta-banner',
      heading: 'まずはお気軽にご相談ください',
      body: 'お電話またはフォームより、ご予約・お問い合わせを承っております。',
      primaryButton: { label: 'お問い合わせ', href: '/contact' },
      backgroundStyle: 'brand',
      variant: 'solid',
    },
  ]

  const enLayout = [
    {
      blockType: 'page-hero',
      variant: 'page-title',
      pageTitle: 'Treatment Menu',
      showBreadcrumb: false,
    },
    {
      blockType: 'services-grid',
      eyebrow: 'Our Treatments',
      heading: 'From insured care to self-pay programs',
      layout: 'corporate-banner',
      services: [
        { title: 'Orthopedic Care', subheadline: 'Insured', description: 'Insured treatment for everyday injuries such as bruises, sprains, and strains.', image: media.services[3], cta: { label: 'Learn more', href: '/contact' } },
        { title: 'Sports Injury & Rehab', subheadline: 'Insured & self-pay', description: 'Treatment for sports injuries plus rehab programs to support your return to competition.', image: media.services[4], cta: { label: 'Learn more', href: '/contact' } },
        { title: 'Traffic Accident Treatment', subheadline: 'Auto insurance (jibaiseki)', description: 'Whiplash and other accident-related injuries, treated under compulsory auto insurance.', image: media.services[5], cta: { label: 'Learn more', href: '/contact' } },
      ],
    },
    {
      blockType: 'faq',
      sectionHeading: 'Frequently Asked Questions',
      items: faqIds,
      variant: 'grid',
    },
    {
      blockType: 'cta-banner',
      heading: 'Get in touch — we are happy to help',
      body: 'Reach us by phone or through the contact form to book a visit or ask a question.',
      primaryButton: { label: 'Contact Us', href: '/contact' },
      backgroundStyle: 'brand',
      variant: 'solid',
    },
  ]

  await createLocalizedDoc(payload, 'pages', {
    ja: {
      title: '施術メニュー',
      slug: 'services',
      status: 'published',
      meta: {
        title: '施術メニュー | さくら接骨院',
        description: '整形外科的施術・スポーツ障害・交通事故治療・産前産後骨盤矯正まで、さくら接骨院の施術メニューをご覧ください。',
      },
      layout: jaLayout,
    },
    en: {
      title: 'Treatment Menu',
      meta: {
        title: 'Treatment Menu | Sakura Osteopathic Clinic',
        description: 'Explore Sakura Osteopathic Clinic\'s full treatment menu — insured orthopedic and sports-injury care alongside self-pay pelvic alignment and traffic-accident treatment.',
      },
      layout: enLayout,
    },
  })
}
