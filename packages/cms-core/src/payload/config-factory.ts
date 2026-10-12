import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig, Config } from 'payload'

import { siteConfigSchema } from '../schema/site-config'
import type { SiteConfig } from '../schema/site-config'
import { adminOnly } from './access'

import { PagesCollection, buildAvailableBlocks } from './collections/pages'
import { MediaCollection } from './collections/media'
import { ServicesCollection } from './collections/services'
import { FAQsCollection } from './collections/faqs'
import { ChatAnswersCollection } from './collections/chat-answers'
import { NewsCollection } from './collections/news'
import { UsersCollection } from './collections/users'
import { TestimonialsCollection } from './collections/testimonials'
import { EventsCollection } from './collections/events'
import { SeminarsCollection } from '../verticals/recruitment/collections/seminars'
import { GalleryCollection } from './collections/gallery'
import { DownloadsCollection } from './collections/downloads'
import { JobsCollection } from '../verticals/recruitment/collections/jobs'
import { TeamCollection } from './collections/team'
import { CaseStudiesCollection } from '../verticals/recruitment/collections/case-studies'
import { DoctorsCollection } from '../verticals/clinic/collections/doctors'
import { TreatmentsCollection } from '../verticals/clinic/collections/treatments'
import { BlogCollection } from './collections/blog'
import { FormSubmissionsCollection } from './collections/form-submissions'
import { bookingCollections } from './collections/booking'

import { HeaderGlobal } from './globals/header'
import { FooterGlobal } from './globals/footer'
import { CompanyInfoGlobal } from './globals/company-info'
import { SEODefaultsGlobal } from './globals/seo-defaults'
import { MedicalDisclaimerGlobal } from '../verticals/clinic/globals/medical-disclaimer'

const BeforeDashboardPath = '@techmirai/cms-core/payload/admin/BeforeDashboard'

// ---------------------------------------------------------------------------
// RBAC helper: enforce admin-only delete across all content collections
// ---------------------------------------------------------------------------

function withAdminDelete(collection: CollectionConfig): CollectionConfig {
  return {
    ...collection,
    access: {
      ...collection.access,
      delete: adminOnly,
    },
  }
}

// ---------------------------------------------------------------------------
// Optional admin component overrides from the consuming app
// ---------------------------------------------------------------------------

type AdminComponents = NonNullable<Config['admin']>['components']

// ---------------------------------------------------------------------------
// Config factory
// ---------------------------------------------------------------------------

export function buildCmsConfig(
  siteConfig: SiteConfig,
  adminComponents?: AdminComponents,
  dbOverride?: Config['db'],
): Config {
  siteConfigSchema.parse(siteConfig)

  const alwaysOn: CollectionConfig[] = [
    PagesCollection(siteConfig),
    MediaCollection,
    ServicesCollection(siteConfig),
    FAQsCollection,
    ChatAnswersCollection,
    NewsCollection,
    UsersCollection,
    FormSubmissionsCollection({
      contactRecipient: siteConfig.forms.contactRecipient,
      jobApplicationRecipient: siteConfig.forms.jobApplicationRecipient ?? siteConfig.forms.contactRecipient,
      seminarRecipient: siteConfig.forms.contactRecipient,
      // Pack-4/J1: deliberately NO `?? contactRecipient` fallback here —
      // confirmed in plan review. A misconfigured/missing assessment
      // recipient must skip the staff email loudly (see
      // send-form-emails.ts), never silently misdirect it to an unrelated
      // inbox. Conditional spread (not `assessmentRecipient: x | undefined`)
      // because this tsconfig sets `exactOptionalPropertyTypes: true`, which
      // requires the key to be omitted entirely rather than present with an
      // explicit `undefined` value.
      ...(siteConfig.forms.assessmentRecipient ? { assessmentRecipient: siteConfig.forms.assessmentRecipient } : {}),
      fromEmail: siteConfig.integrations.resendFromEmail,
    }),
    // Booking module: catalog, resources, schedulable slots, customers, and
    // the appointments driven by the atomic reservation engine (src/booking).
    ...bookingCollections(),
  ]

  const optional: CollectionConfig[] = [
    ...(siteConfig.features.blog ? [BlogCollection] : []),
    ...(siteConfig.features.testimonials ? [TestimonialsCollection] : []),
    ...(siteConfig.features.events ? [EventsCollection] : []),
    ...(siteConfig.features.gallery ? [GalleryCollection] : []),
    ...(siteConfig.features.downloads ? [DownloadsCollection] : []),
    ...(siteConfig.features.team ? [TeamCollection] : []),
    // Recruitment vertical: jobs and seminars move together as one unit.
    ...(siteConfig.verticals.recruitment ? [JobsCollection, SeminarsCollection] : []),
    // Case studies (e.g. Sadiatec) are not recruitment-specific — Pack-2/F2 decoupled this from
    // the recruitment vertical flag (docs/ENGINE-FIXES.md) so a case-study page can exist with
    // recruitment off.
    ...(siteConfig.features.caseStudies ? [CaseStudiesCollection] : []),
    // Clinic vertical: doctors, treatments move together as one unit.
    ...(siteConfig.verticals.clinic ? [DoctorsCollection, TreatmentsCollection] : []),
  ]

  const collections = [...alwaysOn, ...optional].map(withAdminDelete)

  const defaultLocale = siteConfig.locales.default

  return {
    serverURL: process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000',
    collections,
    globals: [
      HeaderGlobal,
      FooterGlobal,
      CompanyInfoGlobal,
      SEODefaultsGlobal,
      ...(siteConfig.verticals.clinic ? [MedicalDisclaimerGlobal] : []),
    ],
    // Must match buildAvailableBlocks(siteConfig) exactly (not the unfiltered
    // allBlockConfigs) — a block registered here whose fields reference a
    // collection this app doesn't have (e.g. a vertical-gated relationship)
    // fails Payload's config sanitizer at boot, not at typecheck.
    blocks: buildAvailableBlocks(siteConfig),
    editor: lexicalEditor({}),
    localization: {
      locales: siteConfig.locales.enabled.map((code) => ({
        code,
        label: { en: code.toUpperCase() },
      })),
      defaultLocale,
      fallback: true,
    },
    db: dbOverride ?? postgresAdapter({
      pool: {
        connectionString: process.env['DATABASE_URI'] ?? '',
      },
    }),
    secret: process.env['PAYLOAD_SECRET'] ?? '',
    typescript: {
      outputFile: 'payload-types.ts',
    },
    admin: {
      user: UsersCollection.slug,
      meta: {
        titleSuffix: `— ${siteConfig.site.name}`,
        icons: [{ rel: 'icon', url: `/${siteConfig.brand.faviconFile}` }],
      },
      livePreview: {
        url: ({ data, collectionConfig, locale }) => {
          const base = process.env['NEXT_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
          const localeCode = typeof locale === 'string' ? locale : (locale as { code: string }).code
          const prefix = localeCode === defaultLocale ? '' : `/${localeCode}`
          const slug = String(data['slug'] ?? '')
          const slugMap: Record<string, string> = {
            pages: `${prefix}/${slug}`,
            blog: `${prefix}/blog/${slug}`,
            'case-studies': `${prefix}/case-studies/${slug}`,
          }
          const collSlug = collectionConfig?.slug ?? ''
          return `${base}${slugMap[collSlug] ?? `${prefix}/${slug}`}`
        },
        collections: ['pages', 'blog', 'case-studies'],
        breakpoints: [
          { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
          { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
          { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
        ],
      },
      components: {
        // Cast required: Payload's CustomComponent generic differs from standard React.ComponentType
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beforeDashboard: [{ path: BeforeDashboardPath }],
        ...adminComponents,
      },
    },
  }
}
