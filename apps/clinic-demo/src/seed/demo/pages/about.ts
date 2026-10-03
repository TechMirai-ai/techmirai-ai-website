import type { Payload } from 'payload'
import type { DemoMediaIds } from '../media'
import { richText } from '../lib/rich-text'
import { createLocalizedDoc } from '@techmirai/cms-core/seed'

/** Demo about page — slug `demo-about`. Visit /demo-about to preview. */
export async function seedDemoAboutPage(payload: Payload, media: DemoMediaIds): Promise<void> {
  await createLocalizedDoc(payload, 'pages', {
    ja: {
      title: 'Demo About',
      slug: 'demo-about',
      status: 'published',
      layout: [
        {
          blockType: 'page-hero',
          variant: 'hero',
          heading: 'This is a sample about-page heading',
          coloredSubtitle: 'Sample Subtitle',
          body: 'This is sample body copy for the about-page hero — replace with real content.',
          backgroundImage: media.aboutHeroBg,
          overlayOpacity: 50,
          overlayColor: 'black',
          primaryButton: { label: 'Our Services', href: '/services' },
          secondaryButton: { label: 'Contact Us', href: '/contact' },
          profileCard: {
            badgeText: 'Since 2020 (sample)',
            cardHeading: 'Sample Corporate Profile',
            rows: [
              { label: 'Company Name', value: 'Demo Company Ltd' },
              { label: 'Founded', value: 'January 2020' },
              { label: 'Capital', value: '¥10,000,000 (sample)' },
            ],
          },
          textAlignment: 'left',
          minHeight: 'lg',
          showBreadcrumb: false,
        },
        {
          blockType: 'image-text-split',
          image: media.aboutSplit[0],
          imageAlt: 'Sample placeholder image — replace with a real photo',
          imagePosition: 'right',
          eyebrow: 'Sample Eyebrow',
          heading: 'This is a sample image-and-text heading',
          body: richText('This is a sample services page — replace with real content.', 'Add real detail about the company here.'),
          primaryButton: { label: 'Learn more', href: '/services' },
          imageSplit: '50/50',
          backgroundStyle: 'white',
          verticalAlign: 'center',
        },
        {
          blockType: 'image-text-split',
          image: media.aboutSplit[1],
          imageAlt: 'Sample placeholder image — replace with a real photo',
          imagePosition: 'left',
          eyebrow: 'Sample Eyebrow',
          heading: 'This is a second sample image-and-text heading',
          body: richText('This is another sample section — replace with real content specific to your mission or values.'),
          imageSplit: '50/50',
          backgroundStyle: 'light',
          verticalAlign: 'center',
        },
        {
          blockType: 'rich-text',
          content: richText(
            'This is a sample rich-text block — replace with real content.',
            'It can hold multiple paragraphs of freeform copy, useful for longer-form sections like company history or detailed policy explanations.',
          ),
          maxWidth: 'prose',
        },
        {
          blockType: 'gallery-grid',
          heading: 'This is a sample gallery heading',
          intro: 'This is a sample gallery intro — replace with real content.',
          showFilter: false,
          items: media.galleryBlock.map((id, i) => ({
            image: id,
            caption: `Sample caption ${i + 1}`,
          })),
          columns: '3',
          enableLightbox: true,
          aspectRatio: 'auto',
        },
        {
          blockType: 'cta-banner',
          heading: 'This is a sample call-to-action heading',
          body: 'This is sample CTA body copy — replace with real content.',
          primaryButton: { label: 'Contact Us', href: '/contact' },
          backgroundStyle: 'brand',
          variant: 'gradient',
        },
      ],
    },
  })
}
