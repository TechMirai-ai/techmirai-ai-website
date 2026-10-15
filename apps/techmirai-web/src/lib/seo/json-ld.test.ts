import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ORGANIZATION_DESCRIPTION,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  serviceJsonLd,
  stripBracketed,
  websiteJsonLd,
} from './json-ld'

// Pack-4/L2 unit tests. Run with `pnpm --filter techmirai-web test`.

const SPEC_PATH = resolve(__dirname, '../../../../../docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md')
const ORG_ID = 'https://techmirai-ai.com/#organization'

/** True if any string value (not JSON array syntax) contains a [bracketed] placeholder. */
function hasBracket(data: unknown): boolean {
  if (typeof data === 'string') return /\[[^\]]*\]/.test(data)
  if (Array.isArray(data)) return data.some(hasBracket)
  if (data && typeof data === 'object') return Object.values(data).some(hasBracket)
  return false
}

/** Spec §17.4 "Canonical company facts" table rows as [EN, JA]. */
function readCompanyFacts(): Array<[string, string]> {
  const spec = readFileSync(SPEC_PATH, 'utf8')
  const section = spec.slice(spec.indexOf('**Canonical company facts**'), spec.indexOf('**Page habits'))
  return section
    .split('\n')
    .filter((line) => line.startsWith('| ') && !line.startsWith('| EN') && !line.startsWith('| ---'))
    .map((line) => {
      const [en = '', ja = ''] = line.split(' | ').map((c) => c.replace(/^\| /, '').replace(/ \|$/, ''))
      return [en, ja]
    })
}

test('stripBracketed: drops bracketed strings and containers they empty, without mutating input', () => {
  const input = {
    a: '[x]',
    b: 'keep',
    c: ['[y]', 'z'],
    d: { '@type': 'Thing', e: '[w]' },
    f: ['[only]'],
    g: { '@type': 'Thing', h: 'kept' },
  }
  assert.deepEqual(stripBracketed(input), { b: 'keep', c: ['z'], g: { '@type': 'Thing', h: 'kept' } })
  assert.equal(input.a, '[x]')
  assert.deepEqual(input.c, ['[y]', 'z'])
})

test('Organization description is Spec §17.4 sentences 1–2 verbatim, per locale', () => {
  const facts = readCompanyFacts()
  assert.equal(facts.length, 4)
  const [first, second] = facts as [[string, string], [string, string]]
  assert.equal(ORGANIZATION_DESCRIPTION.en, `${first[0]} ${second[0]}`)
  assert.equal(ORGANIZATION_DESCRIPTION.ja, `${first[1]}${second[1]}`)
})

test('Organization: Spec §17.3 shape, bracketed values and placeholder logo omitted', () => {
  for (const locale of ['en', 'ja'] as const) {
    const org = organizationJsonLd({ locale, founderName: 'Jamal Shah' })
    assert.equal(hasBracket(org), false)
    assert.equal(org['@type'], 'Organization')
    assert.equal(org['@id'], ORG_ID)
    assert.equal(org['name'], 'TechMirai')
    assert.equal(org['url'], 'https://techmirai-ai.com/')
    assert.equal(org['email'], 'info@techmirai-ai.com')
    assert.equal(org['description'], ORGANIZATION_DESCRIPTION[locale])
    assert.deepEqual(org['alternateName'], ['TechMirai AI'])
    assert.deepEqual(org['address'], { '@type': 'PostalAddress', addressCountry: 'JP' })
    assert.equal(org['areaServed'], 'JP')
    assert.deepEqual(org['knowsLanguage'], ['ja', 'en'])
    for (const omitted of ['logo', 'telephone', 'sameAs']) {
      assert.equal(omitted in org, false, `${omitted} should be omitted`)
    }
  }
})

test('Organization founder follows the founder switch', () => {
  const visible = organizationJsonLd({ locale: 'en', founderName: 'Jamal Shah' })
  assert.deepEqual(visible['founder'], { '@type': 'Person', name: 'Jamal Shah' })

  const hidden = organizationJsonLd({ locale: 'en' })
  assert.equal('founder' in hidden, false)
  assert.equal('founder' in organizationJsonLd({ locale: 'ja', founderName: undefined }), false)
})

test('WebSite: Spec §17.3 shape, publisher references the Organization', () => {
  assert.deepEqual(websiteJsonLd(), {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://techmirai-ai.com/#website',
    url: 'https://techmirai-ai.com/',
    name: 'TechMirai',
    inLanguage: ['ja', 'en'],
    publisher: { '@id': ORG_ID },
  })
})

test('Service: Spec §17.3 fields; offer omitted while the price is bracketed', () => {
  const service = serviceJsonLd()
  assert.equal(hasBracket(service), false)
  assert.deepEqual(service, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'TechMirai AI受付',
    serviceType: 'AI reception system for websites and LINE',
    provider: { '@id': ORG_ID },
    areaServed: 'JP',
  })
})

test('FAQPage: one Question per displayed item; bracketed answers dropped', () => {
  const faq = faqPageJsonLd([
    {
      question: 'AI受付とは何ですか？',
      answer: 'ホームページ・チャット・LINEで働く受付の仕組みです。',
    },
    { question: 'Price?', answer: 'From [¥300,000].' },
  ])
  assert.equal(hasBracket(faq), false)
  assert.equal(faq['@type'], 'FAQPage')
  assert.deepEqual(faq['mainEntity'], [
    {
      '@type': 'Question',
      name: 'AI受付とは何ですか？',
      acceptedAnswer: { '@type': 'Answer', text: 'ホームページ・チャット・LINEで働く受付の仕組みです。' },
    },
    { '@type': 'Question', name: 'Price?' },
  ])
})

test('BlogPosting: locale URL, publisher reference, bracketed author omitted', () => {
  const post = blogPostingJsonLd({
    locale: 'en',
    slug: 'front-desk-checklist',
    headline: 'Headline',
    datePublished: '2026-10-01',
    authorName: '[author name]',
  })
  assert.equal(hasBracket(post), false)
  assert.deepEqual(post, {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Headline',
    inLanguage: 'en',
    datePublished: '2026-10-01',
    dateModified: '2026-10-01',
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: 'https://techmirai-ai.com/en/blog/front-desk-checklist',
  })

  const ja = blogPostingJsonLd({ locale: 'ja', slug: 's', headline: 'H', authorName: 'Jamal Shah' })
  assert.deepEqual(ja['author'], { '@type': 'Person', name: 'Jamal Shah' })
  assert.equal(ja['mainEntityOfPage'], 'https://techmirai-ai.com/blog/s')
})

test('BreadcrumbList: Spec §4 labels, positions and locale URLs', () => {
  const items = [{ path: '' }, { path: '/solutions' }, { path: '/solutions/hotel' }]
  const pick = (locale: 'en' | 'ja') =>
    (breadcrumbJsonLd(locale, items)['itemListElement'] as Array<Record<string, unknown>>).map((i) => [
      i['position'],
      i['name'],
      i['item'],
    ])
  assert.deepEqual(pick('ja'), [
    [1, 'ホーム', 'https://techmirai-ai.com'],
    [2, '業種別の活用', 'https://techmirai-ai.com/solutions'],
    [3, 'ホテル・宿泊施設', 'https://techmirai-ai.com/solutions/hotel'],
  ])
  assert.deepEqual(pick('en'), [
    [1, 'Home', 'https://techmirai-ai.com/en'],
    [2, 'Solutions', 'https://techmirai-ai.com/en/solutions'],
    [3, 'Hotels & guesthouses', 'https://techmirai-ai.com/en/solutions/hotel'],
  ])

  const custom = breadcrumbJsonLd('en', [{ path: '/blog' }, { path: '/blog/x', name: 'Post title' }])
  const names = (custom['itemListElement'] as Array<Record<string, unknown>>).map((i) => i['name'])
  assert.deepEqual(names, ['Insights', 'Post title'])
})
