import type { Block } from 'payload'

import { HeroBlockConfig } from './hero/config'
import { StatsBlockConfig } from './stats/config'
import { ServicesGridBlockConfig } from './services-grid/config'
import { BentoGridBlockConfig } from './bento-grid/config'
import { ProblemSectionBlockConfig } from './problem-section/config'
import { BeforeAfterBlockConfig } from './before-after/config'
import { CapabilityCardsBlockConfig } from './capability-cards/config'
import { LiveDemoBlockConfig } from './live-demo/config'
import { ToolsCompatibilityBlockConfig } from './tools-compatibility/config'
import { ProcessStepsBlockConfig } from './process-steps/config'
import { CaseStudyTeaserBlockConfig } from './case-study-teaser/config'
import { PricingTeaserBlockConfig } from './pricing-teaser/config'
import { SecurityPointsBlockConfig } from './security-points/config'
import { ProductEditionBlockConfig } from './product-edition/config'
import { ExampleChatBlockConfig } from './example-chat/config'
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
import { SetupStepsBlockConfig } from './setup-steps/config'
import { LayeredAnswersDiagramBlockConfig } from './layered-answers-diagram/config'
import { IntegrationsStatusTableBlockConfig } from './integrations-status-table/config'
import { LabelValueListBlockConfig } from './label-value-list/config'

export const allBlockConfigs: Block[] = [
  HeroBlockConfig,
  StatsBlockConfig,
  ServicesGridBlockConfig,
  BentoGridBlockConfig,
  ProblemSectionBlockConfig,
  BeforeAfterBlockConfig,
  CapabilityCardsBlockConfig,
  LiveDemoBlockConfig,
  ToolsCompatibilityBlockConfig,
  ProcessStepsBlockConfig,
  CaseStudyTeaserBlockConfig,
  PricingTeaserBlockConfig,
  SecurityPointsBlockConfig,
  ProductEditionBlockConfig,
  ExampleChatBlockConfig,
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
  SetupStepsBlockConfig,
  LayeredAnswersDiagramBlockConfig,
  IntegrationsStatusTableBlockConfig,
  LabelValueListBlockConfig,
]

export type { HeroBlockProps } from './hero/types'
export type { StatsBlockProps, StatItem } from './stats/types'
export type { ServicesGridBlockProps, ServiceItem, ServiceCta, ServicesLayout } from './services-grid/types'
export type { BentoGridBlockProps, BentoGridItem, BentoLayout } from './bento-grid/types'
export type { ProblemSectionBlockProps, ProblemSectionJourneyStep, ProblemSectionCard } from './problem-section/types'
export type { BeforeAfterBlockProps, BeforeAfterRow } from './before-after/types'
export type { CapabilityCardsBlockProps, CapabilityCard, CapabilityStatus, CapabilitySplitItem } from './capability-cards/types'
export type { LiveDemoBlockProps, LiveDemoChecklistItem, LiveDemoStep, LiveDemoTile } from './live-demo/types'
export type { ToolsCompatibilityBlockProps } from './tools-compatibility/types'
export type { ProcessStepsBlockProps, ProcessStep } from './process-steps/types'
export type { CaseStudyTeaserBlockProps } from './case-study-teaser/types'
export type { PricingTeaserBlockProps } from './pricing-teaser/types'
export type { SecurityPointsBlockProps, SecurityPoint } from './security-points/types'
export type { ProductEditionBlockProps, ProductEditionWayToStart } from './product-edition/types'
export type { ExampleChatBlockProps, ExampleChatTurn } from './example-chat/types'
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
export type { SetupStepsBlockProps, SetupStep } from './setup-steps/types'
export type { LayeredAnswersDiagramBlockProps, LayeredAnswersStep } from './layered-answers-diagram/types'
export type { IntegrationsStatusTableBlockProps, IntegrationRow, IntegrationStatus } from './integrations-status-table/types'
export type { LabelValueListBlockProps, LabelValueRow } from './label-value-list/types'

export { HeroBlock } from './hero/component'
export { ProblemSectionBlock } from './problem-section/component'
export { BeforeAfterBlock } from './before-after/component'
export { CapabilityCardsBlock } from './capability-cards/component'
export { LiveDemoBlock } from './live-demo/component'
export { ToolsCompatibilityBlock } from './tools-compatibility/component'
export { ProcessStepsBlock } from './process-steps/component'
export { CaseStudyTeaserBlock } from './case-study-teaser/component'
export { PricingTeaserBlock } from './pricing-teaser/component'
export { SecurityPointsBlock } from './security-points/component'
export { ProductEditionBlock } from './product-edition/component'
export { ExampleChatBlock } from './example-chat/component'
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
