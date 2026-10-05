/**
 * Pack-2/F1 launch-gate rendered-page pass (docs/WORK-ORDER.md Appendix B).
 * Reporter only — always exits 0. scripts/preflight-check.mjs's `--launch`
 * mode spawns this as a child process, parses its stdout (one JSON hit per
 * line), and is the sole pass/fail authority (applies the allow-list, sets
 * the exit code). Modeled on apps/techmirai-web/scripts/a11y-check.ts's
 * Playwright/BASE_URL pattern.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npx tsx scripts/launch-scan-pages.ts
 */

import { chromium } from 'playwright'
import { runSharedChecks, checkB3BareNumbers, checkB6BracketPlaceholders } from '../../../scripts/launch-scan-rules.mjs'

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000'

type Hit = {
  ruleId: string
  line: number | null
  snippet: string
  note: string
  scope?: string
  route?: string
  locale?: string
}

// Known route folders under apps/techmirai-web/src/app/(frontend)/[locale]/.
// '' = home. Routes that don't exist yet for a given locale are skipped
// (non-200 response), not reported as a hit — only Gate 3's own "every page
// the step touched returns 200" matters for pages that actually exist.
const ROUTES = [
  '',
  'about',
  'ai-reception',
  'assessment',
  'blog',
  'booking',
  'case-studies',
  'company',
  'contact',
  'faq',
  'gallery',
  'how-it-works',
  'integrations',
  'jobs',
  'legal-notice',
  'news',
  'pricing',
  'privacy',
  'services',
  'solutions',
  'team',
  'technology',
  'terms',
  'thanks',
]

// Tailwind arbitrary-value class syntax (`text-[72px]`, `z-[9999]`,
// `w-[var(--color-text)]`) renders bracket text directly into `class`/
// `style` attributes — CSS syntax, not a Spec content placeholder. Filtered
// out of the markup bracket check only; a content placeholder like
// "[080-7701-3004]" or "[PLACEHOLDER: ...]" never matches this pattern.
const CSS_ARBITRARY_VALUE_PATTERN = /^(var\(-?-?[\w-]+(,[^)]*)?\)|-?[\d.]+(px|rem|em|%|vh|vw|fr|s|ms|deg)?|#[0-9a-fA-F]{3,8})$/i
function isLikelyCssArbitraryValue(bracketSnippet: string): boolean {
  const inner = bracketSnippet.slice(1, -1).trim()
  return CSS_ARBITRARY_VALUE_PATTERN.test(inner)
}

function buildPath(route: string, locale: 'ja' | 'en'): string {
  const suffix = route ? `/${route}` : ''
  return locale === 'ja' ? suffix || '/' : `/en${suffix}`
}

async function checkSitemap(baseUrl: string): Promise<Hit[]> {
  const hits: Hit[] = []
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`)
    if (!res.ok) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: '/sitemap.xml', note: `sitemap not reachable (status ${res.status})` })
      return hits
    }
    const text = await res.text()
    if (!text.includes('/en')) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: '/sitemap.xml', note: 'sitemap missing /en locale URLs' })
    }
    if (!/<loc>https?:\/\/[^<]+<\/loc>/.test(text)) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: '/sitemap.xml', note: 'sitemap has no <loc> entries' })
    }
  } catch (err) {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: '/sitemap.xml', note: `sitemap fetch failed: ${err instanceof Error ? err.message : err}` })
  }
  return hits
}

// JSON-LD legitimately uses "[" for array syntax, so this must only flag
// bracket-placeholder TEXT inside string values, never raw JSON structure.
function extractJsonLdHits(html: string): Hit[] {
  const hits: Hit[] = []
  const scriptPattern = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = scriptPattern.exec(html))) {
    let data: unknown
    try {
      data = JSON.parse(match[1] ?? '')
    } catch {
      continue // malformed JSON-LD — not this scan's job to validate syntax
    }
    const strings: string[] = []
    const collect = (value: unknown) => {
      if (typeof value === 'string') strings.push(value)
      else if (Array.isArray(value)) value.forEach(collect)
      else if (value && typeof value === 'object') Object.values(value).forEach(collect)
    }
    collect(data)
    for (const str of strings) {
      if (/\[[^\]\n]+\]/.test(str)) {
        hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: str, note: 'JSON-LD string value contains a bracket placeholder' })
      }
    }
  }
  return hits
}

async function checkStructural(page: import('playwright').Page, response: import('playwright').Response, routePath: string, route: string): Promise<Hit[]> {
  const hits: Hit[] = []

  const h1Count = await page.evaluate(() => document.querySelectorAll('h1').length)
  if (h1Count !== 1) {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: `h1 count: ${h1Count}`, note: 'expected exactly one <h1> per page' })
  }

  const images = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img')).map((img) => ({
      src: img.getAttribute('src') ?? '(no src)',
      alt: img.getAttribute('alt'),
    }))
  )
  for (const { src, alt } of images) {
    if (!alt || !alt.trim()) {
      hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: src, note: 'image missing alt text' })
    }
  }

  const linkTags = await page.evaluate(() => ({
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    hreflangs: Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((el) => el.getAttribute('hreflang')),
  }))
  if (!linkTags.canonical) {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: routePath, note: 'missing <link rel="canonical">' })
  }
  if (!linkTags.hreflangs.includes('ja') || !linkTags.hreflangs.includes('en')) {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: routePath, note: 'missing hreflang alternates for both locales' })
  }

  const robotsMeta = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null)
  const headers = await response.allHeaders()
  const xRobotsHeader = headers['x-robots-tag'] ?? null
  const isNoindex = Boolean(robotsMeta?.includes('noindex') || xRobotsHeader?.includes('noindex'))

  if (route === 'thanks' && !isNoindex) {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: routePath, note: '/thanks must be noindex' })
  }
  if (process.env['SITE_ENV'] === 'production' && isNoindex && route !== 'thanks') {
    hits.push({ ruleId: 'B7_TECHNICAL', line: null, snippet: routePath, note: 'production must allow indexing, but this page is noindex' })
  }

  return hits
}

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  const hits: Hit[] = []

  hits.push(...(await checkSitemap(BASE_URL)))

  for (const route of ROUTES) {
    for (const locale of ['ja', 'en'] as const) {
      const routePath = buildPath(route, locale)
      const url = `${BASE_URL}${routePath}`
      let response: import('playwright').Response | null = null
      try {
        response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
      } catch (err) {
        console.error(`  error loading ${url}: ${err instanceof Error ? err.message : err}`)
        continue
      }
      if (!response || !response.ok()) {
        console.error(`  skipped (${response?.status() ?? 'no response'}): ${url}`)
        continue
      }

      const html = await page.content()
      const innerText = await page.evaluate(() => document.body.innerText)
      const ctx = { route: routePath, locale }
      // Next.js embeds its React Server Components hydration payload as
      // large bracket-heavy serialized data inside <script> tags in
      // page.content() — not published content. Strip script tags before
      // the markup bracket check so it only sees actual rendered attributes
      // (e.g. alt="[TBD]"); extractJsonLdHits runs on the full `html`
      // separately since it specifically targets JSON-LD <script> content.
      const htmlWithoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '')

      const pageHits: Hit[] = [
        ...runSharedChecks(innerText, ctx),
        ...checkB3BareNumbers(innerText),
        ...checkB6BracketPlaceholders(htmlWithoutScripts)
          .filter((h: Hit) => !isLikelyCssArbitraryValue(h.snippet))
          .map((h: Hit) => ({ ...h, note: `${h.note} (markup)` })),
        ...extractJsonLdHits(html),
        ...(await checkStructural(page, response, routePath, route)),
      ]
      for (const hit of pageHits) {
        hits.push({ ...hit, scope: 'rendered', route: routePath, locale })
      }
    }
  }

  await browser.close()

  for (const hit of hits) {
    console.log(JSON.stringify(hit))
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
