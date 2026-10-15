import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildPageMetadata, hreflangAlternates, localizedUrl, metadataFromPageDoc, staticPageMetadata } from './build-metadata'
import { BLOG_POST_META, PAGE_META, pathForPageSlug } from './page-meta'
import { buildSitemapEntries } from './sitemap-entries'
import robots from '../../app/robots'
import { LLMS_TXT, buildLlmsTxt } from './llms-txt'

// Pack-4/L1 unit tests. Run with `pnpm --filter techmirai-web test`.

const SPEC_PATH = resolve(__dirname, '../../../../../docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md')

/** Spec §17.1 table rows: page name + [EN title, EN desc, JA title, JA desc]. */
function readSpecRows(): Array<{ page: string; cells: string[] }> {
  const spec = readFileSync(SPEC_PATH, 'utf8')
  const section = spec.slice(spec.indexOf('### 17.1'), spec.indexOf('### 17.2'))
  return section
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.startsWith('| Page') && !line.startsWith('| ---'))
    .map((line) => {
      const cells = line
        .split(' | ')
        .map((c) => c.replace(/^\| /, '').replace(/ \|$/, '').replace(/\\\[/g, '[').replace(/\\\]/g, ']'))
      return { page: cells[0] ?? '', cells: cells.slice(1, 5) }
    })
}

const SPEC_ROW_TO_PATH: Record<string, string> = {
  Home: '', 'AI受付': '/ai-reception', Solutions: '/solutions', Clinic: '/solutions/clinic',
  Beauty: '/solutions/beauty', Automobile: '/solutions/automobile', Hotel: '/solutions/hotel',
  'How it works': '/how-it-works', Integrations: '/integrations', Pricing: '/pricing',
  Security: '/security', About: '/about', Technology: '/technology', Assessment: '/assessment',
  'Case study': '/case-studies/sadiatec', FAQ: '/faq', Blog: '/blog', Contact: '/contact',
}

test('PAGE_META and BLOG_POST_META match Spec §17.1 verbatim, every row', () => {
  const rows = readSpecRows()
  assert.equal(rows.length, 21)
  for (const { page, cells } of rows) {
    const postMatch = /^Post (\d)$/.exec(page)
    const meta = postMatch ? BLOG_POST_META[Number(postMatch[1]) - 1] : PAGE_META[SPEC_ROW_TO_PATH[page] ?? '?']
    assert.ok(meta, `no entry for Spec row "${page}"`)
    assert.deepEqual(
      [meta.en.title, meta.en.description, meta.ja.title, meta.ja.description],
      cells,
      `Spec row "${page}" drifted`,
    )
  }
  assert.equal(Object.keys(PAGE_META).length, 18)
})

test('titles are unique per locale', () => {
  for (const locale of ['en', 'ja'] as const) {
    const titles = Object.values(PAGE_META).map((m) => m[locale].title)
    assert.equal(new Set(titles).size, titles.length)
  }
})

test('localizedUrl: Japanese unprefixed, English under /en', () => {
  assert.equal(localizedUrl('', 'ja'), 'https://techmirai-ai.com')
  assert.equal(localizedUrl('', 'en'), 'https://techmirai-ai.com/en')
  assert.equal(localizedUrl('/pricing', 'ja'), 'https://techmirai-ai.com/pricing')
  assert.equal(localizedUrl('/pricing', 'en'), 'https://techmirai-ai.com/en/pricing')
})

test('hreflangAlternates: ja, en and x-default pointing at the Japanese URL', () => {
  assert.deepEqual(hreflangAlternates('/faq'), {
    ja: 'https://techmirai-ai.com/faq',
    en: 'https://techmirai-ai.com/en/faq',
    'x-default': 'https://techmirai-ai.com/faq',
  })
})

test('buildPageMetadata: self-canonical per locale, hreflang, no robots unless noindex', () => {
  const en = buildPageMetadata({ locale: 'en', path: '/pricing', title: 'T', description: 'D' })
  assert.equal(en.alternates?.canonical, 'https://techmirai-ai.com/en/pricing')
  assert.equal((en.alternates?.languages as Record<string, string>)['x-default'], 'https://techmirai-ai.com/pricing')
  assert.equal(en.title, 'T')
  assert.equal(en.description, 'D')
  assert.equal(en.robots, undefined)

  const ja = buildPageMetadata({ locale: 'ja', path: '/thanks', title: 'T', noindex: true })
  assert.equal(ja.alternates?.canonical, 'https://techmirai-ai.com/thanks')
  assert.deepEqual(ja.robots, { index: false, follow: false })
  assert.equal('description' in ja, false)
})

test('pathForPageSlug maps CMS slugs to public paths', () => {
  assert.equal(pathForPageSlug('home'), '')
  assert.equal(pathForPageSlug('hotel'), '/solutions/hotel')
  assert.equal(pathForPageSlug('pricing'), '/pricing')
})

test('sitemap: both locales of every public page, no excluded routes', () => {
  const now = new Date('2026-10-14T00:00:00Z')
  const entries = buildSitemapEntries({ blogPosts: [{ slug: 'post-a' }], caseStudyVisible: false, now })
  const urls = entries.map((e) => e.url)

  for (const path of ['', '/pricing', '/solutions/hotel', '/privacy', '/terms', '/legal-notice', '/blog/post-a']) {
    assert.ok(urls.includes(localizedUrl(path, 'ja')), `missing ja ${path}`)
    assert.ok(urls.includes(localizedUrl(path, 'en')), `missing en ${path}`)
  }
  for (const banned of ['/thanks', '/booking', '/case-studies/sadiatec', '/company', '/team', '/news', '/services', '/pages']) {
    assert.ok(!urls.some((u) => u.endsWith(banned) || u.includes(`${banned}/`)), `should exclude ${banned}`)
  }
  assert.equal(new Set(urls).size, urls.length)
  for (const e of entries) assert.ok(e.alternates?.languages && 'x-default' in e.alternates.languages)

  const withCase = buildSitemapEntries({ blogPosts: [], caseStudyVisible: true, now }).map((e) => e.url)
  assert.ok(withCase.includes('https://techmirai-ai.com/en/case-studies/sadiatec'))
})

test('robots: production serves the Spec §17.2 rules; anything else disallows all', () => {
  const original = process.env['SITE_ENV']
  try {
    process.env['SITE_ENV'] = 'production'
    assert.deepEqual(robots(), {
      rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/thanks'] }],
      sitemap: 'https://techmirai-ai.com/sitemap.xml',
    })
    process.env['SITE_ENV'] = 'staging'
    assert.deepEqual(robots(), { rules: { userAgent: '*', disallow: '/' } })
    delete process.env['SITE_ENV']
    assert.deepEqual(robots(), { rules: { userAgent: '*', disallow: '/' } })
  } finally {
    if (original === undefined) delete process.env['SITE_ENV']
    else process.env['SITE_ENV'] = original
  }
})

test('llms.txt matches the Spec §17.4 block verbatim; case-study link gated', () => {
  const spec = readFileSync(SPEC_PATH, 'utf8')
  const afterHeading = spec.slice(spec.indexOf('**llms.txt**'))
  const open = afterHeading.indexOf('```markdown\n') + '```markdown\n'.length
  const specBlock = afterHeading.slice(open, afterHeading.indexOf('```', open))
  assert.equal(LLMS_TXT, specBlock)

  assert.equal(buildLlmsTxt(true), LLMS_TXT)
  const hidden = buildLlmsTxt(false)
  assert.ok(!hidden.includes('case-studies/sadiatec'))
  assert.ok(hidden.includes('- [FAQ](https://techmirai-ai.com/en/faq): common questions\n'))
})

test('metadataFromPageDoc: reads meta group, falls back to page title, honours noindex', () => {
  const doc = { title: 'Page', meta: { title: 'Meta T', description: 'Meta D', noindex: true, image: { url: '/og.png' } } }
  const m = metadataFromPageDoc(doc, 'en', '/thanks')
  assert.equal(m.title, 'Meta T')
  assert.equal(m.description, 'Meta D')
  assert.deepEqual(m.robots, { index: false, follow: false })
  assert.equal(m.alternates?.canonical, 'https://techmirai-ai.com/en/thanks')
  assert.deepEqual((m.openGraph as { images?: unknown }).images, ['/og.png'])

  const bare = metadataFromPageDoc({ title: 'Only title' }, 'ja', '/about')
  assert.equal(bare.title, 'Only title')
  assert.equal(bare.robots, undefined)
  assert.equal('description' in bare, false)
})

test('staticPageMetadata: Spec row for the locale, legal rows too, unknown path throws', () => {
  const ja = staticPageMetadata('/assessment', 'ja')
  assert.equal(ja.title, '無料AIホームページ診断｜TechMirai')
  assert.equal(ja.alternates?.canonical, 'https://techmirai-ai.com/assessment')
  assert.equal(staticPageMetadata('/terms', 'en').title, 'Terms of Use')
  assert.deepEqual(staticPageMetadata('/faq', 'fr'), {})
  assert.throws(() => staticPageMetadata('/nope', 'en'))
})

test('site.config seo defaults are TechMirai (Spec Home row), not the clinic leftovers', async () => {
  const { default: siteConfig } = await import('../../../site.config')
  assert.equal(siteConfig.seo.titleTemplate, '%s')
  assert.deepEqual(siteConfig.seo.defaultDescription, {
    en: PAGE_META['']?.en.description,
    ja: PAGE_META['']?.ja.description,
  })
})
