import type { SiteConfig } from '@techmirai/cms-core/schema'

// Originally cloned from clinic-demo-standalone, which proved the ENGINE/vertical
// separation by standing up a clinic-vertical app. As of Pack-2/D1, both verticals are
// off for this TechMirai site — neither doctors/treatments (clinic) nor jobs/seminars/
// case-studies (recruitment) apply here. features.jobListings/seminars/recruit/
// caseStudies mirror recruitmentVertical below rather than being toggled independently,
// matching the convention used by other apps built on this shared engine.
const recruitmentVertical = false
const clinicVertical = false

// Shared by contact.phone and reception.clinicPhone so the two never drift.
const clinicPhone = '+81-3-5432-1188'

const siteConfig: SiteConfig = {
  site: {
    name: 'Sakura Osteopathic Clinic',
    tagline: {
      en: 'Gentle, community-rooted care for every body',
      ja: '地域に根ざした、やさしい施術を',
    },
    domain: 'sakura-sekkotsu.example',
  },

  brand: {
    logoFile: 'brand/logo.svg',
    faviconFile: 'favicon.ico',
    ogImageFile: 'brand/logo.svg',
    colors: {
      // Calm-teal palette. primary (#0F6E56, 6.2:1 on white) is the ONLY color
      // permitted behind white text at normal size — accent (#1D9E75, 3.4:1 on
      // white) fails WCAG AA for body-size text and is restricted to hover
      // states, icon fills, borders, and text 24px+. See globals.css for the
      // mirrored legacy --color-brand-*/--color-bg-*/--color-text-*/--color-border-*
      // block, a second statically-compiled copy of this same palette.
      primary: '#0F6E56',
      secondary: '#0F6E56',
      accent: '#1D9E75',
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
      deepAccent: '#0F6E56',
      iconAccent: '#1D9E75',
      buttonAccent: '#0F6E56',
      buttonAccentHover: '#0D5E49',
      priceHighlight: '#1D9E75',
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
    caseStudies: recruitmentVertical,
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
    email: 'info@sakura-sekkotsu.example',
    phone: clinicPhone,
    address: {
      en: 'Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022',
      ja: '〒154-0022 東京都世田谷区梅丘2-14-8 さくらビル1F',
    },
    mapEmbedUrl: 'https://www.google.com/maps?q=Umegaoka+Station+Tokyo&output=embed',
    // Each value is "morning / afternoon", a "△"-prefixed segment for limited/
    // by-appointment hours, or a bare "休診" for a fully closed day — parsed by
    // the hours-location block into a real table with ●/▲/休 symbols.
    businessHours: {
      monday: '09:00–12:00 / 15:00–19:30',
      tuesday: '09:00–12:00 / 15:00–19:30',
      wednesday: '09:00–12:00 / 休',
      thursday: '09:00–12:00 / 15:00–19:30',
      friday: '09:00–12:00 / 15:00–19:30',
      saturday: '09:00–12:00 / △13:00–16:00',
      sunday: '休診',
    },
  },

  forms: {
    // TODO: replace with the client's real inbox before real client launch
    contactRecipient: 'reception@sakura-sekkotsu.example',
    // TODO: replace with the client's real inbox before real client launch
    appointmentRecipient: 'reception@sakura-sekkotsu.example',
  },

  legal: {
    privacyPolicySlug: '/privacy',
    termsSlug: '/terms',
  },

  seo: {
    titleTemplate: '%s | さくら接骨院 Sakura Osteopathic Clinic',
    defaultDescription: {
      en: 'Sakura Osteopathic Clinic is a neighborhood clinic in Setagaya, Tokyo, offering insured orthopedic and sports-injury treatment alongside self-pay pelvic alignment and traffic-accident aftercare.',
      ja: 'さくら接骨院は東京都世田谷区の地域密着型接骨院です。打撲・捻挫・スポーツ外傷などの保険診療から、骨盤矯正や交通事故治療まで幅広く対応しています。',
    },
    sitemapIncludeCollections: ['pages', 'news', 'blog', 'services', 'team', 'company', 'faq', 'contact'],
  },

  integrations: {
    resendFromEmail: 'onboarding@resend.dev',
    // TODO: replace with real booking provider before real client launch
    bookingProviderUrl: 'https://example.com/book-placeholder',
  },

  notifications: {
    // Local hour (see notifications/templates/shared.ts's formatDateTime doc
    // comment — appointment times are stored/compared UTC-only, matching the
    // rest of this app) at which the day-before reminder becomes due.
    // Currently INERT: the cron only runs once daily (vercel.json), so
    // reminders always target 00:00 UTC regardless of this value — see
    // notifications/reminder-schedule.ts's doc comment. Takes effect again
    // once the cron moves to an hourly cadence (tracked for WO-8).
    reminderHourLocal: 9,
  },

  booking: {
    // Customers can self-service cancel/reschedule up to 24h before their
    // appointment; past that, the manage page shows contact.phone instead.
    cancellationCutoffHours: 24,
  },

  reception: {
    enabled: true,
    greeting: {
      en: "Hello! Thanks for visiting Sakura Osteopathic Clinic. How can we help you today?",
      ja: 'こんにちは。さくら接骨院にご来院いただきありがとうございます。本日はどのようなご用件でしょうか?',
    },
    openDelayMs: 8000,
    locales: ['ja', 'en'],
    clinicPhone,
    // Placeholder — same convention as the socialLinks placeholders above.
    // Swap for the real clinic's LINE add-friend URL before launch; until
    // then this demo shows the "Talk to staff" option using this link.
    staffLineUrl: 'https://line.me/R/ti/p/~nahidarahamanrupta',
  },
}

export default siteConfig
