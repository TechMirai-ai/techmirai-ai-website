import { test, expect, type Page } from '@playwright/test'
import { LEGAL_PAGE_META, PAGE_META } from '../src/lib/seo/page-meta'
import { LLMS_TXT } from '../src/lib/seo/llms-txt'

// Pack-4/L1 acceptance crawl: every public route in both locales has exactly
// one <h1> with no skipped heading levels, the Spec §17.1 title/description,
// a self-referencing canonical and ja/en/x-default hreflang. Plus noindex
// pages, legacy redirects, sitemap and llms.txt. Run against `pnpm dev`.

const ORIGIN = 'https://techmirai-ai.com'
const LOCALES = ['ja', 'en'] as const
type Locale = (typeof LOCALES)[number]

const CASE_STUDY = '/case-studies/sadiatec'
const ROWS = { ...PAGE_META, ...LEGAL_PAGE_META }

function localPath(path: string, locale: Locale): string {
  const full = `${locale === 'ja' ? '' : '/en'}${path}`
  return full === '' ? '/' : full
}
const absolute = (path: string, locale: Locale): string => `${ORIGIN}${locale === 'ja' ? '' : '/en'}${path}`

async function headInfo(page: Page) {
  return page.evaluate(() => {
    const attr = (sel: string, name: string) => document.querySelector(sel)?.getAttribute(name) ?? null
    const hreflang: Record<string, string> = {}
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((l) => {
      hreflang[l.getAttribute('hreflang') ?? ''] = l.getAttribute('href') ?? ''
    })
    const levels = Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6'))
      .map((h) => Number(h.tagName[1]))
    return {
      title: document.title,
      description: attr('meta[name="description"]', 'content'),
      canonical: attr('link[rel="canonical"]', 'href'),
      robots: attr('meta[name="robots"]', 'content'),
      h1Count: document.querySelectorAll('h1').length,
      levels,
      hreflang,
    }
  })
}

const seenTitles = new Map<string, string>()

for (const [path, row] of Object.entries(ROWS)) {
  for (const locale of LOCALES) {
    const url = localPath(path, locale)
    test(`head + headings: ${url}`, async ({ page }) => {
      const res = await page.goto(url)
      expect(res?.status(), url).toBe(200)
      const info = await headInfo(page)

      expect(info.h1Count, `${url} h1 count`).toBe(1)
      // Soft: a skipped level fails the test but the head checks below still run.
      info.levels.forEach((level, i) => {
        const prev = i === 0 ? 1 : (info.levels[i - 1] ?? 1)
        expect.soft(level, `${url} heading #${i} skips a level (h${prev} → h${level})`).toBeLessThanOrEqual(prev + 1)
      })

      expect(info.canonical, `${url} canonical`).toBe(absolute(path, locale))
      expect(info.hreflang, `${url} hreflang`).toEqual({
        ja: absolute(path, 'ja'),
        en: absolute(path, 'en'),
        'x-default': absolute(path, 'ja'),
      })

      // The case study keeps a generic title until Sadiatec's permission switch is on.
      const caseStudyHidden = path === CASE_STUDY && !info.title.includes('Sadiatec')
      if (!caseStudyHidden) {
        expect(info.title, `${url} title`).toBe(row[locale].title)
        expect(info.description, `${url} description`).toBe(row[locale].description)
      }
      expect(info.robots, `${url} must be indexable`).toBeNull()

      const clash = seenTitles.get(info.title)
      expect(clash, `${url} reuses the title of ${clash}`).toBeUndefined()
      seenTitles.set(info.title, url)
    })
  }
}

for (const url of ['/thanks', '/en/thanks', '/booking/manage', '/en/booking/manage']) {
  test(`noindex: ${url}`, async ({ page }) => {
    await page.goto(url)
    const { robots } = await headInfo(page)
    expect(robots ?? '', url).toContain('noindex')
  })
}

const REDIRECTS: Array<[string, string]> = [
  ['/legal/privacy.html', '/privacy'],
  ['/legal/terms.html', '/terms'],
  ['/legal/tokutei.html', '/legal-notice'],
]
for (const [from, to] of REDIRECTS) {
  test(`301: ${from} → ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(new URL(res.headers()['location'] ?? '', 'http://x').pathname).toBe(to)
    expect((await request.get(to)).status()).toBe(200)
  })
}

test('sitemap.xml lists both locales of every public page and nothing excluded', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1])
  for (const path of Object.keys(ROWS)) {
    if (path === CASE_STUDY) continue // listed only once visible
    for (const locale of LOCALES) expect(locs, `${path} ${locale}`).toContain(absolute(path, locale))
  }
  for (const banned of ['/thanks', '/booking', '/company', '/team', '/news', '/services', '/pages']) {
    expect(locs.some((u) => u?.endsWith(banned)), banned).toBe(false)
  }
  expect(xml).toContain('hreflang="x-default"')
})

test('llms.txt serves the Spec §17.4 block', async ({ request }) => {
  const res = await request.get('/llms.txt')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/plain')
  const body = await res.text()
  const caseStudyLine = '- [Case study: Sadiatec](https://techmirai-ai.com/en/case-studies/sadiatec)\n'
  expect([LLMS_TXT, LLMS_TXT.replace(caseStudyLine, '')]).toContain(body)
})

test('non-production: robots.txt disallows all and pages send X-Robots-Tag noindex', async ({ request }) => {
  test.skip(process.env['SITE_ENV'] === 'production', 'production server')
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(/Disallow: \/\s*$/m)
  const res = await request.get('/en/pricing')
  expect(res.headers()['x-robots-tag']).toBe('noindex')
})
