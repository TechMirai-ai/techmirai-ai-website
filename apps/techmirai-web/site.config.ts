import type { SiteConfig } from '@techmirai/cms-core/schema'

// Originally cloned from clinic-demo-standalone, which proved the ENGINE/vertical
// separation by standing up a clinic-vertical app. As of Pack-2/D1, both verticals are
// off for this TechMirai site — neither doctors/treatments (clinic) nor jobs/seminars
// (recruitment) apply here. features.jobListings/seminars/recruit mirror
// recruitmentVertical below rather than being toggled independently, matching the
// convention used by other apps built on this shared engine.
const recruitmentVertical = false
const clinicVertical = false

// Pack-2/F2: case studies (Sadiatec) are not a recruitment feature — they're used on
// the homepage, About and a dedicated case-study page regardless of the recruitment
// vertical. Decoupled from recruitmentVertical (see docs/ENGINE-FIXES.md) so the
// Sadiatec case-study collection/page exist even with recruitment off. The page itself
// still sits behind its own `visible` switch pending Sadiatec's written permission.
const caseStudiesEnabled = true

// Pack-3/G3: the homepage's Spec §5.8 case-study teaser card has its own
// visibility switch, separate from caseStudiesEnabled above (which only
// gates the generic collection/feature). Default false — Sadiatec's written
// permission is still pending (docs/PLACEHOLDER-REGISTER.md F1-14). Injected
// into the 'case-study-teaser' block at render time in page.tsx, same
// pattern as features.bookingWidget → booking-cta's `enabled` prop — so the
// card and its button either both exist or neither does, on both locales at
// once, with no stored boolean to drift between them.
const sadiatecCaseStudyTeaserVisible = false

// Shared by contact.phone and reception.clinicPhone so the two never drift.
// Pack-2/D2: Spec gives this only as a bracketed CONFIRM item — stored
// literally bracketed per CLAUDE.md rule 5, see docs/PLACEHOLDER-REGISTER.md.
const clinicPhone = '[080-7701-3004]'

const siteConfig: SiteConfig = {
  site: {
    name: 'TechMirai',
    tagline: {
      en: 'Gentle, community-rooted care for every body',
      ja: '地域に根ざした、やさしい施術を',
    },
    domain: 'techmirai-ai.com',
  },

  brand: {
    logoFile: 'brand/logo.svg',
    faviconFile: 'favicon.ico',
    ogImageFile: 'brand/logo.svg',
    colors: {
      // TechMirai palette (Pack-2/D2): green primary kept from the original
      // logo per the Spec ("keep the current logo and green"); navy/orange
      // introduced as the brochure's accent colors. TEMPORARY exact hex
      // values — the brochure (TECHMIRAI_BROCHURE.html) is not yet supplied,
      // see docs/PLACEHOLDER-REGISTER.md. primary (#0F6E56, 6.2:1 on white)
      // is the ONLY color permitted behind white text at normal size. See
      // globals.css for the mirrored legacy --color-brand-*/--color-bg-*/
      // --color-text-*/--color-border-* block, a second statically-compiled
      // copy of this same palette — keep both in sync.
      primary: '#0F6E56',
      secondary: '#1B2A45',
      accent: '#D97706',
      background: '#F7FAF9',
      surface: '#FFFFFF',
      text: '#04342C',
      muted: '#4B6B63',
      error: '#DC2626',
      success: '#12823B',
      warning: '#A35905',
      surfaceAlt: '#E1F5EE',
      surfaceSubtle: '#E8F7F2',
      surfaceFaint: '#F0F8F5',
      textSecondary: '#4B6B63',
      headingDark: '#04342C',
      deepAccent: '#1B2A45',
      iconAccent: '#1B2A45',
      buttonAccent: '#D97706',
      buttonAccentHover: '#B45309',
      priceHighlight: '#D97706',
    },
    typography: {
      fontSans: 'Inter',
      fontSerif: "'Noto Serif JP'",
      fontSizeBase: '17px',
      fontWeightHeading: '700',
      fontWeightBody: '400',
    },
  },

  locales: {
  enabled: ['ja', 'en'],
  default: 'ja',
  direction: { en: 'ltr', ja: 'ltr' },
},

  verticals: {
    recruitment: recruitmentVertical,
    clinic: clinicVertical,
  },

  features: {
    aiAgent: true,
    // TODO: replace with real booking provider before real client launch
    bookingWidget: true,
    jobListings: recruitmentVertical,
    events: false,
    seminars: recruitmentVertical,
    gallery: false,
    testimonials: true,
    downloads: true,
    news: true,
    team: true,
    locations: true,
    services: true,
    caseStudies: caseStudiesEnabled,
    caseStudyTeaser: sadiatecCaseStudyTeaserVisible,
    blog: true,
    company: true,
    recruit: recruitmentVertical,
    faq: true,
    contact: true,
    about: false,
  },

  nav: {
    legalLinks: [
      { slug: '/privacy', labelKey: 'nav.privacy' },
      { slug: '/terms', labelKey: 'nav.terms' },
    ],
    // Placeholder URLs — Footer.tsx sources social icons from here, not from the
    // footer CMS global. Swap for the real clinic's accounts before launch.
    socialLinks: [
      { platform: 'facebook', url: 'https://facebook.com/sakura-sekkotsu-placeholder' },
      { platform: 'instagram', url: 'https://instagram.com/sakura-sekkotsu-placeholder' },
      { platform: 'youtube', url: 'https://youtube.com/@sakura-sekkotsu-placeholder' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/sakura-sekkotsu-placeholder' },
    ],
  },

  contact: {
    // Pack-2/D2: TechMirai's own identity constants (Content Spec Section
    // 10.6). email/domain are given plainly by the Spec; phone/address/hours
    // are given only as bracketed CONFIRM items — stored literally bracketed
    // per CLAUDE.md rule 5, not invented. See docs/PLACEHOLDER-REGISTER.md.
    email: 'info@techmirai-ai.com',
    phone: clinicPhone,
    address: {
      en: '[Address you may publish]',
      ja: '[掲載可能な住所]',
    },
    mapEmbedUrl: 'https://www.google.com/maps?q=Umegaoka+Station+Tokyo&output=embed',
    // Spec gives hours as one bracketed phrase, not a per-weekday schedule —
    // the hours-location block (packages/cms-core/src/blocks/hours-location)
    // expects monday..sunday keys and has no live instance on any page yet;
    // this single-key shape is a Pack-3 concern once that block is placed.
    businessHours: {
      weekdays: '[Weekdays 9:00–18:00]',
    },
  },

  forms: {
    // TODO: replace with the client's real inbox before real client launch
    contactRecipient: 'reception@sakura-sekkotsu.example',
    // Pack-4/J2, Spec §12.4: booking staff notifications go to info@techmirai-ai.com.
    appointmentRecipient: 'info@techmirai-ai.com',
    // Pack-4/J1, Spec §12.3: the Spec names info@techmirai-ai.com as the
    // staff-notification recipient for the assessment form (the same
    // address it already names for booking notifications). Kept separate
    // from `contactRecipient` above (deliberately untouched — still the
    // clinic-demo leftover, out of this step's scope) — see
    // docs/PLACEHOLDER-REGISTER.md for the pending Jamal confirmation.
    assessmentRecipient: 'info@techmirai-ai.com',
  },

  legal: {
    privacyPolicySlug: '/privacy',
    termsSlug: '/terms',
  },

  // Pack-4/L1: replaces the leftover Sakura-clinic values (FINDINGS 2026-10-05).
  // Per-page titles come from lib/seo/page-meta.ts (Spec §17.1) and already end
  // in "TechMirai", so the template adds nothing. The default description is the
  // Spec §17.1 Home row. sitemapIncludeCollections is no longer read by
  // sitemap.ts (lib/seo/sitemap-entries.ts owns the URL list) but the schema
  // still requires it.
  seo: {
    titleTemplate: '%s',
    defaultDescription: {
      en: 'AI reception for small businesses in Japan. Answer questions, take bookings and connect LINE 24/7, in Japanese and English. Free AI website assessment.',
      ja: '中小企業・店舗のためのAI受付。よくある質問への回答、予約受付、LINE連携を24時間、日本語・英語で。無料AIホームページ診断を受付中です。',
    },
    sitemapIncludeCollections: ['pages', 'news', 'blog', 'services', 'team', 'company', 'faq', 'contact'],
  },

  integrations: {
    resendFromEmail: 'onboarding@resend.dev',
    // TODO: replace with real booking provider before real client launch
    bookingProviderUrl: 'https://example.com/book-placeholder',
    // Pack-2/D2: Spec gives this only as a bracketed CONFIRM item — stored
    // literally bracketed per CLAUDE.md rule 5, see docs/PLACEHOLDER-REGISTER.md.
    demoUrl: '[demo.techmirai-ai.com]',
  },

  notifications: {
    // D-4 Option B (approved): the reminder goes out about 09:00 JST on the
    // day before the appointment's Tokyo date — NOT exactly 24 hours before.
    // This value is INERT: the only scheduler is the daily cron in vercel.json
    // (00:00 UTC = 09:00 JST), so reminders always target that instant
    // regardless of this number (9 is kept to match). See
    // notifications/reminder-schedule.ts's doc comment. It would only take
    // effect again if an hourly scheduler were ever added (not planned).
    reminderHourLocal: 9,
  },

  booking: {
    // Customers can self-service cancel/reschedule up to 24h before their
    // appointment; past that, the manage page shows contact.phone instead.
    cancellationCutoffHours: 24,
    // Pack-4/J2: the meeting tool is a Spec CONFIRM item — launch blocker in
    // docs/PLACEHOLDER-REGISTER.md. Keep false until Jamal confirms it.
    meetingToolConfirmed: false,
  },

  reception: {
    enabled: true,
    // Pack-2/E2: Content Spec §16.1 exact greeting text (includes the
    // required "automated assistant" self-disclosure).
    greeting: {
      en: "Hello! I'm TechMirai's AI受付, an automated assistant. I can answer questions about our service, show you the demo, or book a free consultation. What would you like to do?",
      ja: 'こんにちは。TechMiraiのAI受付（自動応答）です。サービスについてのご質問、デモのご案内、無料相談のご予約を承ります。ご用件をお選びください。',
    },
    openDelayMs: 8000,
    locales: ['ja', 'en'],
    clinicPhone,
    // Placeholder — same convention as the socialLinks placeholders above.
    // Spec gives only a bracket token ("[LINE Official Account URL]"), no
    // literal URL — this fake-but-valid placeholder keeps the widget
    // functional; swap for the real LINE add-friend URL before launch. See
    // docs/PLACEHOLDER-REGISTER.md.
    staffLineUrl: 'https://line.me/R/ti/p/~techmirai-placeholder',
    // Pack-4/K2: when a person is likely to reply — drives the Spec §16.5
    // during-hours / out-of-hours hand-off message. UNCONFIRMED: this mirrors
    // the Spec's bracketed phrase "[on weekdays 9:00–18:00]" (same fact as
    // contact.businessHours above), it is not a confirmed schedule, and it must
    // not be published as business hours. Launch blocker — see
    // docs/PLACEHOLDER-REGISTER.md K2-01. Delete the field to make the chat
    // stop making any claim about hours.
    handoffHours: { timeZone: 'Asia/Tokyo', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
  },
}

export default siteConfig
