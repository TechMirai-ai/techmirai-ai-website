import { safeRevalidateTag as revalidateTag } from '../lib/revalidate'
import type { Block, CollectionConfig } from 'payload'
import type { SiteConfig } from '../../schema/site-config'
import { aiVisibleField } from '../fields/ai-visible'
import { slugField } from '../fields/slug'
import { HeroBlockConfig } from '../../blocks/hero/config'
import { StatsBlockConfig } from '../../blocks/stats/config'
import { ServicesGridBlockConfig } from '../../blocks/services-grid/config'
import { BentoGridBlockConfig } from '../../blocks/bento-grid/config'
import { ProblemSectionBlockConfig } from '../../blocks/problem-section/config'
import { BeforeAfterBlockConfig } from '../../blocks/before-after/config'
import { CapabilityCardsBlockConfig } from '../../blocks/capability-cards/config'
import { LiveDemoBlockConfig } from '../../blocks/live-demo/config'
import { CaseStudyCarouselBlockConfig } from '../../verticals/recruitment/blocks/case-study-carousel/config'
import { LogoCloudBlockConfig } from '../../blocks/logo-cloud/config'
import { CTABannerBlockConfig } from '../../blocks/cta-banner/config'
import { RichTextBlockConfig } from '../../blocks/rich-text/config'
import { FAQBlockConfig } from '../../blocks/faq/config'
import { ContactFormBlockConfig } from '../../blocks/contact-form/config'
import { TeamGridBlockConfig } from '../../blocks/team-grid/config'
import { EventListBlockConfig } from '../../blocks/event-list/config'
import { GalleryBlockConfig } from '../../blocks/gallery/config'
import { HoursLocationBlockConfig } from '../../blocks/hours-location/config'
import { CaseStudiesGridBlockConfig } from '../../verticals/recruitment/blocks/case-studies-grid/config'
import { CompanyProfileBlockConfig } from '../../blocks/company-profile/config'
import { ComplianceGridBlockConfig } from '../../verticals/recruitment/blocks/compliance-grid/config'
import { DownloadsGridBlockConfig } from '../../blocks/downloads-grid/config'
import { BlogTeaserBlockConfig } from '../../blocks/blog-teaser/config'
import { NewsListBlockConfig } from '../../blocks/news-list/config'
import { PageHeroBlockConfig } from '../../blocks/page-hero/config'
import { ImageTextSplitBlockConfig } from '../../blocks/image-text-split/config'
import { StatsBarBlockConfig } from '../../blocks/stats-bar/config'
import { CEOMessageBlockConfig } from '../../blocks/ceo-message/config'
import { AffiliatesBlockConfig } from '../../blocks/affiliates/config'
import { BusinessLineListBlockConfig } from '../../verticals/recruitment/blocks/business-line-list/config'
import { GalleryGridBlockConfig } from '../../blocks/gallery-grid/config'
import { HistoryBlockConfig } from '../../blocks/history/config'
import { PlacementStatisticsBlockConfig } from '../../verticals/recruitment/blocks/placement-statistics/config'
import { ContactInfoCardBlockConfig } from '../../blocks/contact-info-card/config'
import { MissionStatementBlockConfig } from '../../blocks/mission-statement/config'
import { DoctorGridBlockConfig } from '../../verticals/clinic/blocks/doctor-grid/config'
import { DepartmentListBlockConfig } from '../../verticals/clinic/blocks/department-list/config'
import { TreatmentListBlockConfig } from '../../verticals/clinic/blocks/treatment-list/config'
import { BookingCtaBlockConfig } from '../../blocks/booking-cta/config'

export function buildAvailableBlocks(siteConfig: SiteConfig): Block[] {
  return [
    HeroBlockConfig,
    StatsBlockConfig,
    ServicesGridBlockConfig,
    BentoGridBlockConfig,
    ProblemSectionBlockConfig,
    BeforeAfterBlockConfig,
    CapabilityCardsBlockConfig,
    LiveDemoBlockConfig,
    LogoCloudBlockConfig,
    CTABannerBlockConfig,
    RichTextBlockConfig,
    FAQBlockConfig,
    ContactFormBlockConfig,
    ...(siteConfig.features.team ? [TeamGridBlockConfig] : []),
    ...(siteConfig.features.events ? [EventListBlockConfig] : []),
    ...(siteConfig.features.gallery ? [GalleryBlockConfig] : []),
    ...(siteConfig.features.locations ? [HoursLocationBlockConfig] : []),
    ...(siteConfig.features.company ? [CompanyProfileBlockConfig] : []),
    ...(siteConfig.features.downloads ? [DownloadsGridBlockConfig] : []),
    ...(siteConfig.features.blog ? [BlogTeaserBlockConfig] : []),
    NewsListBlockConfig,
    PageHeroBlockConfig,
    ImageTextSplitBlockConfig,
    StatsBarBlockConfig,
    CEOMessageBlockConfig,
    AffiliatesBlockConfig,
    GalleryGridBlockConfig,
    HistoryBlockConfig,
    ContactInfoCardBlockConfig,
    MissionStatementBlockConfig,
    // Recruitment vertical: these five blocks move together as one unit.
    ...(siteConfig.verticals.recruitment ? [
      CaseStudyCarouselBlockConfig,
      CaseStudiesGridBlockConfig,
      ComplianceGridBlockConfig,
      BusinessLineListBlockConfig,
      PlacementStatisticsBlockConfig,
    ] : []),
    // Clinic vertical: doctors, departments (via services), treatments move together as one unit.
    ...(siteConfig.verticals.clinic ? [
      DoctorGridBlockConfig,
      DepartmentListBlockConfig,
      TreatmentListBlockConfig,
    ] : []),
    // Booking CTA is a core feature, not clinic-specific — any vertical with
    // features.bookingWidget on can use it.
    ...(siteConfig.features.bookingWidget ? [BookingCtaBlockConfig] : []),
  ]
}

export function PagesCollection(siteConfig: SiteConfig): CollectionConfig {
  return {
    slug: 'pages',
    labels: { singular: 'Page', plural: 'Pages' },
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', 'slug', 'updatedAt'],
      preview: (doc) => {
        const base = process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
        return `${base}/${String(doc['slug'] ?? '')}`
      },
    },
    hooks: { afterChange: [() => { revalidateTag('pages') }, () => { revalidateTag('search-index') }] },
    fields: [
      { name: 'title', type: 'text', localized: true, required: true },
      slugField,
      {
        name: 'layout',
        type: 'blocks',
        blocks: buildAvailableBlocks(siteConfig),
      },
      {
        name: 'meta',
        type: 'group',
        label: 'SEO',
        fields: [
          { name: 'title', type: 'text', localized: true },
          { name: 'description', type: 'textarea', localized: true },
          { name: 'image', type: 'upload', relationTo: 'media' },
        ],
      },
      aiVisibleField,
    ],
  }
}
