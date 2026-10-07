import type { Block } from 'payload'

import { HeroBlockConfig } from './hero/config'
import { StatsBlockConfig } from './stats/config'
import { ServicesGridBlockConfig } from './services-grid/config'
import { BentoGridBlockConfig } from './bento-grid/config'
import { ProblemSectionBlockConfig } from './problem-section/config'
import { BeforeAfterBlockConfig } from './before-after/config'
import { CaseStudyCarouselBlockConfig } from '../verticals/recruitment/blocks/case-study-carousel/config'
import { LogoCloudBlockConfig } from './logo-cloud/config'
import { CTABannerBlockConfig } from './cta-banner/config'
import { RichTextBlockConfig } from './rich-text/config'
import { FAQBlockConfig } from './faq/config'
import { ContactFormBlockConfig } from './contact-form/config'
import { TeamGridBlockConfig } from './team-grid/config'
import { EventListBlockConfig } from './event-list/config'
import { GalleryBlockConfig } from './gallery/config'
import { HoursLocationBlockConfig } from './hours-location/config'
import { CaseStudiesGridBlockConfig } from '../verticals/recruitment/blocks/case-studies-grid/config'
import { CompanyProfileBlockConfig } from './company-profile/config'
import { ComplianceGridBlockConfig } from '../verticals/recruitment/blocks/compliance-grid/config'
import { DownloadsGridBlockConfig } from './downloads-grid/config'
import { BlogTeaserBlockConfig } from './blog-teaser/config'
import { NewsListBlockConfig } from './news-list/config'
import { PageHeroBlockConfig } from './page-hero/config'
import { ImageTextSplitBlockConfig } from './image-text-split/config'
import { StatsBarBlockConfig } from './stats-bar/config'
import { CEOMessageBlockConfig } from './ceo-message/config'
import { AffiliatesBlockConfig } from './affiliates/config'
import { BusinessLineListBlockConfig } from '../verticals/recruitment/blocks/business-line-list/config'
import { GalleryGridBlockConfig } from './gallery-grid/config'
import { HistoryBlockConfig } from './history/config'
import { PlacementStatisticsBlockConfig } from '../verticals/recruitment/blocks/placement-statistics/config'
import { ContactInfoCardBlockConfig } from './contact-info-card/config'
import { MissionStatementBlockConfig } from './mission-statement/config'
import { DoctorGridBlockConfig } from '../verticals/clinic/blocks/doctor-grid/config'
import { DepartmentListBlockConfig } from '../verticals/clinic/blocks/department-list/config'
import { TreatmentListBlockConfig } from '../verticals/clinic/blocks/treatment-list/config'
import { BookingCtaBlockConfig } from './booking-cta/config'

export const allBlockConfigs: Block[] = [
  HeroBlockConfig,
  StatsBlockConfig,
  ServicesGridBlockConfig,
  BentoGridBlockConfig,
  ProblemSectionBlockConfig,
  BeforeAfterBlockConfig,
  CaseStudyCarouselBlockConfig,
  LogoCloudBlockConfig,
  CTABannerBlockConfig,
  RichTextBlockConfig,
  FAQBlockConfig,
  ContactFormBlockConfig,
  TeamGridBlockConfig,
  EventListBlockConfig,
  GalleryBlockConfig,
  HoursLocationBlockConfig,
  CaseStudiesGridBlockConfig,
  CompanyProfileBlockConfig,
  ComplianceGridBlockConfig,
  DownloadsGridBlockConfig,
  BlogTeaserBlockConfig,
  NewsListBlockConfig,
  PageHeroBlockConfig,
  ImageTextSplitBlockConfig,
  StatsBarBlockConfig,
  CEOMessageBlockConfig,
  AffiliatesBlockConfig,
  BusinessLineListBlockConfig,
  GalleryGridBlockConfig,
  HistoryBlockConfig,
  PlacementStatisticsBlockConfig,
  ContactInfoCardBlockConfig,
  MissionStatementBlockConfig,
  DoctorGridBlockConfig,
  DepartmentListBlockConfig,
  TreatmentListBlockConfig,
  BookingCtaBlockConfig,
]

export type { HeroBlockProps } from './hero/types'
export type { StatsBlockProps, StatItem } from './stats/types'
export type { ServicesGridBlockProps, ServiceItem, ServiceCta, ServicesLayout } from './services-grid/types'
export type { BentoGridBlockProps, BentoGridItem, BentoLayout } from './bento-grid/types'
export type { ProblemSectionBlockProps, ProblemSectionJourneyStep, ProblemSectionCard } from './problem-section/types'
export type { BeforeAfterBlockProps, BeforeAfterRow } from './before-after/types'
export type { CaseStudyCarouselBlockProps } from '../verticals/recruitment/blocks/case-study-carousel/types'
export type { LogoCloudBlockProps, LogoItem, ScrollSpeed } from './logo-cloud/types'
export type { CTABannerBlockProps, CTABannerCta, CTABannerVariant, CTABannerBackgroundStyle, CTABannerButtonVariant, CTABannerLayout } from './cta-banner/types'
export type { RichTextBlockProps } from './rich-text/types'
export type { FAQBlockProps } from './faq/types'
export type { ContactFormBlockProps } from './contact-form/types'
export type { TeamGridBlockProps } from './team-grid/types'
export type { EventListBlockProps } from './event-list/types'
export type { GalleryBlockProps } from './gallery/types'
export type { HoursLocationBlockProps } from './hours-location/types'
export type { CaseStudiesGridBlockProps, CaseStudyCardItem, CaseStudiesLayout } from '../verticals/recruitment/blocks/case-studies-grid/types'
export type { CompanyProfileBlockProps, CompanyProfileRow, CompanyProfileCta } from './company-profile/types'
export type { ComplianceGridBlockProps, LicenseCard, ComplianceIcon } from '../verticals/recruitment/blocks/compliance-grid/types'
export type { DownloadsGridBlockProps, DownloadItem } from './downloads-grid/types'
export type { BlogTeaserBlockProps, BlogPostTeaser } from './blog-teaser/types'
export type { NewsListBlockProps, NewsItem } from './news-list/types'
export type { PageHeroBlockProps, PageHeroBreadcrumbItem, PageHeroProfileCard, PageHeroProfileCardRow } from './page-hero/types'
export type { ImageTextSplitBlockProps } from './image-text-split/types'
export type { StatsBarBlockProps, StatsBarItem } from './stats-bar/types'
export type { CEOMessageBlockProps } from './ceo-message/types'
export type { AffiliatesBlockProps, AffiliateItem } from './affiliates/types'
export type { BusinessLineListBlockProps, BusinessLineItem, BusinessLineFeature } from '../verticals/recruitment/blocks/business-line-list/types'
export type { GalleryGridBlockProps, GalleryCategory, GalleryImageItem } from './gallery-grid/types'
export type { HistoryBlockProps, HistoryEntry } from './history/types'
export type { PlacementStatisticsBlockProps, IndustrySlice, RegionBar } from '../verticals/recruitment/blocks/placement-statistics/types'
export type { ContactInfoCardBlockProps } from './contact-info-card/types'
export type { MissionStatementBlockProps, MissionPhoto, MissionPhotoSize } from './mission-statement/types'
export type { DoctorGridBlockProps, DoctorCardItem } from '../verticals/clinic/blocks/doctor-grid/types'
export type { DepartmentListBlockProps, DepartmentCardItem } from '../verticals/clinic/blocks/department-list/types'
export type { TreatmentListBlockProps, TreatmentCardItem } from '../verticals/clinic/blocks/treatment-list/types'
export type { BookingCtaBlockProps } from './booking-cta/types'

export { HeroBlock } from './hero/component'
export { ProblemSectionBlock } from './problem-section/component'
export { BeforeAfterBlock } from './before-after/component'
export { RichTextBlock } from './rich-text/component'
export { StatsBlock } from './stats/component'
export { CTABannerBlock } from './cta-banner/component'
export { PageHeroBlock } from './page-hero/component'
export { ImageTextSplitBlock } from './image-text-split/component'
export { StatsBarBlock } from './stats-bar/component'
export { CEOMessageBlock } from './ceo-message/component'
export { AffiliatesBlock } from './affiliates/component'
export { BusinessLineListBlock } from '../verticals/recruitment/blocks/business-line-list/component'
export { GalleryGridBlock } from './gallery-grid/component'
export { HistoryBlock } from './history/component'
export { PlacementStatisticsBlock } from '../verticals/recruitment/blocks/placement-statistics/component'
export { ContactInfoCardBlock } from './contact-info-card/component'
export { MissionStatementBlock } from './mission-statement/component'

export { blockRegistry } from './registry'
export type { BlockRenderer } from './registry'
