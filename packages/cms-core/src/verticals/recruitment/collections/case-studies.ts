import { safeRevalidateTag as revalidateTag } from '../../../payload/lib/revalidate'
import type { CollectionConfig } from 'payload'
import { aiVisibleField } from '../../../payload/fields/ai-visible'
import { slugField } from '../../../payload/fields/slug'
import { PageHeroBlockConfig } from '../../../blocks/page-hero/config'
import { LabelValueListBlockConfig } from '../../../blocks/label-value-list/config'
import { SecurityPointsBlockConfig } from '../../../blocks/security-points/config'
import { CTABannerBlockConfig } from '../../../blocks/cta-banner/config'

export const CaseStudiesCollection: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'clientName', 'publishedAt', 'active'],
    preview: (doc) => {
      const base = process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
      return `${base}/case-studies/${String(doc['slug'] ?? '')}`
    },
  },
  hooks: {
    afterChange: [() => { revalidateTag('case-studies') }, () => { revalidateTag('search-index') }],
  },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'clientName', type: 'text', localized: true, required: true },
    { name: 'industry', type: 'text', localized: true, required: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'challenge', type: 'richText', localized: true },
    { name: 'solution', type: 'richText', localized: true },
    { name: 'outcome', type: 'richText', localized: true },
    { name: 'role', type: 'text', localized: true, admin: { description: 'e.g. HR Director • TechGlobal Inc.' } },
    { name: 'metricValue', type: 'text', localized: true, admin: { description: 'e.g. 100%, 14 Days, 1st' } },
    { name: 'metricCaption', type: 'text', localized: true, admin: { description: 'e.g. Fluency & confidence achieved' } },
    { name: 'photo', type: 'upload', relationTo: 'media', admin: { description: 'Avatar / headshot (distinct from featured image)' } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'results',
      type: 'array',
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text' },
        { name: 'label', type: 'text', localized: true, required: true },
      ],
    },
    { name: 'publishedAt', type: 'date', required: true },
    // Pack-3/I3: additive field — this collection's existing fields above
    // (challenge/solution/outcome richText, metricValue/metricCaption,
    // numeric results[]) are shaped for a single-metric testimonial card,
    // which doesn't fit the Sadiatec case study's Spec §13 structure (an
    // at-a-glance table, before/what-we-built/what-it-means lists, an empty
    // client-comment slot) and the Spec's own ban on inventing metrics for
    // this page. Rather than force content into those fields, this reuses
    // the same block types already used by `pages.layout` elsewhere on the
    // site (page-hero, label-value-list, security-points, cta-banner) —
    // same pattern, additive, touches no existing field or row.
    {
      name: 'layout',
      type: 'blocks',
      blocks: [PageHeroBlockConfig, LabelValueListBlockConfig, SecurityPointsBlockConfig, CTABannerBlockConfig],
    },
    slugField,
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'visible',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Sadiatec case-study visibility — requires Sadiatec\'s written permission (Spec §1 item 14) before enabling. Separate from "active", which is this collection\'s generic publish flag.',
      },
    },
    aiVisibleField,
  ],
}
