#!/usr/bin/env node
// Scaffolds a new, standalone client repo from this template.
//
// What it does:
//   1. Copies every git-tracked file (via `git archive`) into a fresh
//      target directory — no node_modules, .next, .turbo, .data, or
//      .env.local, since none of those are tracked.
//   2. Replaces every client-identity value in the copy's
//      apps/techmirai-web/site.config.ts with a __FILL_ME__ sentinel, so
//      the new repo can never accidentally ship this template's demo
//      content (see docs/DEPLOY-NEW-CLIENT.md for the fill-in checklist).
//
// It does NOT run `git init`, `pnpm install`, or touch any secrets —
// see docs/DEPLOY-NEW-CLIENT.md for the remaining manual steps.
//
// Usage:
//   node scripts/create-client-app.mjs <target-directory>

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SITE_CONFIG_RELATIVE_PATH = 'apps/techmirai-web/site.config.ts'

function fail(message) {
  console.error(`\nERROR: ${message}\n`)
  process.exit(1)
}

function parseArgs(argv) {
  const target = argv[2]
  if (!target || target.startsWith('-')) {
    fail('Usage: node scripts/create-client-app.mjs <target-directory>')
  }
  return { targetPath: resolve(process.cwd(), target) }
}

function copyTrackedTree(targetPath) {
  mkdirSync(targetPath, { recursive: true })
  // `git archive` only includes files tracked in git — this is what
  // keeps node_modules/.next/.turbo/.data/.env.local out without needing
  // a hand-maintained exclude list that can drift from .gitignore.
  execFileSync('sh', ['-c', `git archive HEAD | tar -x -C "${targetPath}"`], {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}

// Each entry replaces an exact substring of site.config.ts with a
// __FILL_ME__ sentinel. `count` is the number of occurrences expected —
// if the live file doesn't match, the template has drifted and this
// script (and its counts) need updating. That failure is intentional:
// a silent no-op here would ship a new client site with leftover Sakura
// content instead of failing loudly.
const REQUIRED = (description) => `__FILL_ME__ REQUIRED: ${description}`
const OPTIONAL = (description) =>
  `__FILL_ME__ OPTIONAL — delete this entry if not applicable: ${description}`

const SITE_CONFIG_REPLACEMENTS = [
  {
    find: `name: 'Sakura Osteopathic Clinic',`,
    replace: `name: '${REQUIRED('client display name, e.g. "Sakura Osteopathic Clinic"')}',`,
    count: 1,
  },
  {
    find: `en: 'Gentle, community-rooted care for every body',`,
    replace: `en: '${REQUIRED('short English tagline')}',`,
    count: 1,
  },
  {
    find: `ja: '地域に根ざした、やさしい施術を',`,
    replace: `ja: '${REQUIRED('short Japanese tagline')}',`,
    count: 1,
  },
  {
    find: `bn: 'প্রতিটি শরীরের জন্য কোমল, স্থানীয় পরিচর্যা',`,
    replace: `bn: '${REQUIRED('short Bengali tagline')}',`,
    count: 1,
  },
  {
    find: `domain: 'sakura-sekkotsu.example',`,
    replace: `domain: '${REQUIRED('client domain, no protocol, e.g. "example-clinic.com"')}',`,
    count: 1,
  },
  {
    find: `{ platform: 'facebook', url: 'https://facebook.com/sakura-sekkotsu-placeholder' },`,
    replace: `{ platform: 'facebook', url: '${OPTIONAL('client Facebook URL')}' },`,
    count: 1,
  },
  {
    find: `{ platform: 'instagram', url: 'https://instagram.com/sakura-sekkotsu-placeholder' },`,
    replace: `{ platform: 'instagram', url: '${OPTIONAL('client Instagram URL')}' },`,
    count: 1,
  },
  {
    find: `{ platform: 'youtube', url: 'https://youtube.com/@sakura-sekkotsu-placeholder' },`,
    replace: `{ platform: 'youtube', url: '${OPTIONAL('client YouTube URL')}' },`,
    count: 1,
  },
  {
    find: `{ platform: 'linkedin', url: 'https://linkedin.com/company/sakura-sekkotsu-placeholder' },`,
    replace: `{ platform: 'linkedin', url: '${OPTIONAL('client LinkedIn URL')}' },`,
    count: 1,
  },
  {
    find: `email: 'info@sakura-sekkotsu.example',`,
    replace: `email: '${REQUIRED('client contact email')}',`,
    count: 1,
  },
  {
    find: `en: 'Sakura Building 1F, 2-14-8 Umegaoka, Setagaya-ku, Tokyo 154-0022',`,
    replace: `en: '${REQUIRED('client address, English')}',`,
    count: 1,
  },
  {
    find: `ja: '〒154-0022 東京都世田谷区梅丘2-14-8 さくらビル1F',`,
    replace: `ja: '${REQUIRED('client address, Japanese')}',`,
    count: 1,
  },
  {
    find: `bn: 'সাকুরা বিল্ডিং ১ম তলা, ২-১৪-৮ উমেগাওকা, সেতাগায়া-কু, টোকিও ১৫৪-০০২২',`,
    replace: `bn: '${REQUIRED('client address, Bengali')}',`,
    count: 1,
  },
  {
    find: `mapEmbedUrl: 'https://www.google.com/maps?q=Umegaoka+Station+Tokyo&output=embed',`,
    replace: `mapEmbedUrl: '${REQUIRED('Google Maps embed URL for the clinic location')}',`,
    count: 1,
  },
  {
    find: `monday: '09:00–12:00 / 15:00–19:30',`,
    replace: `monday: '${REQUIRED('Monday hours, e.g. "09:00–12:00 / 15:00–19:30" or "休診" if closed')}',`,
    count: 1,
  },
  {
    find: `tuesday: '09:00–12:00 / 15:00–19:30',`,
    replace: `tuesday: '${REQUIRED('Tuesday hours')}',`,
    count: 1,
  },
  {
    find: `wednesday: '09:00–12:00 / 休',`,
    replace: `wednesday: '${REQUIRED('Wednesday hours')}',`,
    count: 1,
  },
  {
    find: `thursday: '09:00–12:00 / 15:00–19:30',`,
    replace: `thursday: '${REQUIRED('Thursday hours')}',`,
    count: 1,
  },
  {
    find: `friday: '09:00–12:00 / 15:00–19:30',`,
    replace: `friday: '${REQUIRED('Friday hours')}',`,
    count: 1,
  },
  {
    find: `saturday: '09:00–12:00 / △13:00–16:00',`,
    replace: `saturday: '${REQUIRED('Saturday hours')}',`,
    count: 1,
  },
  {
    find: `sunday: '休診',`,
    replace: `sunday: '${REQUIRED('Sunday hours')}',`,
    count: 1,
  },
  {
    // Both forms.contactRecipient and forms.appointmentRecipient share this
    // exact value in the template — replaceAll is intentional here.
    find: `'reception@sakura-sekkotsu.example'`,
    replace: `'${REQUIRED('the real inbox for form/booking notifications')}'`,
    count: 2,
  },
  {
    find: `titleTemplate: '%s | さくら接骨院 Sakura Osteopathic Clinic',`,
    replace: `titleTemplate: '%s | ${REQUIRED('SEO title template, e.g. "%s | Client Name"')}',`,
    count: 1,
  },
  {
    find: `en: 'Sakura Osteopathic Clinic is a neighborhood clinic in Setagaya, Tokyo, offering insured orthopedic and sports-injury treatment alongside self-pay pelvic alignment and traffic-accident aftercare.',`,
    replace: `en: '${REQUIRED('SEO meta description, English')}',`,
    count: 1,
  },
  {
    find: `ja: 'さくら接骨院は東京都世田谷区の地域密着型接骨院です。打撲・捻挫・スポーツ外傷などの保険診療から、骨盤矯正や交通事故治療まで幅広く対応しています。',`,
    replace: `ja: '${REQUIRED('SEO meta description, Japanese')}',`,
    count: 1,
  },
  {
    find: `bn: 'সাকুরা অস্টিওপ্যাথিক ক্লিনিক টোকিওর সেতাগায়াতে অবস্থিত একটি স্থানীয় ক্লিনিক, যেখানে বীমাকৃত অর্থোপেডিক ও ক্রীড়া-আঘাতের চিকিৎসার পাশাপাশি স্ব-খরচে পেলভিক অ্যালাইনমেন্ট সেবা দেওয়া হয়।',`,
    replace: `bn: '${REQUIRED('SEO meta description, Bengali')}',`,
    count: 1,
  },
  {
    find: `bookingProviderUrl: 'https://example.com/book-placeholder',`,
    replace: `bookingProviderUrl: '${REQUIRED('the booking provider URL, or disable via features.bookingWidget: false')}',`,
    count: 1,
  },
  {
    find: `en: "Hello! Thanks for visiting Sakura Osteopathic Clinic. How can we help you today?",`,
    replace: `en: "${REQUIRED('reception widget greeting, English')}",`,
    count: 1,
  },
  {
    find: `ja: 'こんにちは。さくら接骨院にご来院いただきありがとうございます。本日はどのようなご用件でしょうか?',`,
    replace: `ja: '${REQUIRED('reception widget greeting, Japanese')}',`,
    count: 1,
  },
  {
    find: `const clinicPhone = '+81-3-5432-1188'`,
    replace: `const clinicPhone = '${REQUIRED('client phone number, e.g. "+81-3-5432-1188"')}'`,
    count: 1,
  },
]

function countOccurrences(haystack, needle) {
  return needle.length === 0 ? 0 : haystack.split(needle).length - 1
}

function templateSiteConfig(targetPath) {
  const configPath = resolve(targetPath, SITE_CONFIG_RELATIVE_PATH)
  let config = readFileSync(configPath, 'utf8')

  const driftErrors = []
  for (const { find, replace, count } of SITE_CONFIG_REPLACEMENTS) {
    const actual = countOccurrences(config, find)
    if (actual !== count) {
      driftErrors.push(
        `  expected ${count} occurrence(s) of ${JSON.stringify(find)}, found ${actual}`,
      )
      continue
    }
    config = config.split(find).join(replace)
  }

  if (driftErrors.length > 0) {
    fail(
      [
        `site.config.ts no longer matches what scripts/create-client-app.mjs expects.`,
        `The template must have changed since this script's replacement list was written.`,
        `Update SITE_CONFIG_REPLACEMENTS in scripts/create-client-app.mjs to match, then re-run.`,
        ``,
        ...driftErrors,
      ].join('\n'),
    )
  }

  writeFileSync(configPath, config)
}

function main() {
  const { targetPath } = parseArgs(process.argv)

  if (existsSync(targetPath)) {
    fail(`${targetPath} already exists — choose a target directory that doesn't exist yet.`)
  }

  console.log(`Copying tracked files to ${targetPath} ...`)
  copyTrackedTree(targetPath)

  console.log(`Templating ${SITE_CONFIG_RELATIVE_PATH} with __FILL_ME__ sentinels ...`)
  templateSiteConfig(targetPath)

  console.log(
    [
      ``,
      `Done. New client app scaffolded at ${targetPath}`,
      ``,
      `Next steps (see docs/DEPLOY-NEW-CLIENT.md):`,
      `  1. cd ${targetPath} && git init`,
      `  2. Fill in every __FILL_ME__ in apps/techmirai-web/site.config.ts`,
      `  3. cp apps/techmirai-web/.env.example apps/techmirai-web/.env.local and fill in real values`,
      `  4. pnpm install`,
      `  5. node scripts/preflight-check.mjs`,
      ``,
    ].join('\n'),
  )
}

main()
