import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import siteConfig from '../../site.config'
import { LEGAL_PAGES, LEGAL_PLACEHOLDER, legalPageContent, type LegalPageKey } from './legal-headings'

// Pack-4/M1 unit tests. Run with `pnpm --filter techmirai-web test`.

const SPEC_PATH = resolve(__dirname, '../../../../docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md')

const SPEC_ROW: Record<LegalPageKey, string> = {
  privacy: 'Privacy policy',
  terms: 'Terms of use',
  legalNotice: 'Legal notice',
}

/** Spec §18 "Legal page headings" row → { en, ja } heading lists (JA gloss in parentheses dropped). */
function readSpecHeadings(rowName: string): { en: string[]; ja: string[] } {
  const spec = readFileSync(SPEC_PATH, 'utf8')
  const table = spec.slice(spec.indexOf('**Legal page headings**'))
  const line = table.split('\n').find((l) => l.startsWith(`| ${rowName} |`))
  assert.ok(line, `Spec row "${rowName}" not found`)
  const [, enCell = '', jaCell = ''] = line.split(' | ').map((c) => c.replace(/^\| /, '').replace(/ \|$/, ''))
  const jaHeadings = jaCell.replace(/ \(.*\)$/, '')
  return { en: enCell.split(' · '), ja: jaHeadings.split('・') }
}

test('legal headings match the Spec §18 table exactly, both locales, every page', () => {
  const expectedCounts: Record<LegalPageKey, number> = { privacy: 9, terms: 6, legalNotice: 10 }
  for (const page of Object.keys(LEGAL_PAGES) as LegalPageKey[]) {
    const spec = readSpecHeadings(SPEC_ROW[page])
    assert.equal(spec.en.length, expectedCounts[page], `${page} EN count in Spec`)
    assert.equal(spec.ja.length, expectedCounts[page], `${page} JA count in Spec`)
    for (const locale of ['en', 'ja'] as const) {
      const headings = legalPageContent(page, locale).sections.map((s) => s.heading)
      assert.deepEqual(headings, spec[locale], `${page} ${locale} headings`)
    }
  }
})

test('every section carries exactly the approved placeholder for its locale', () => {
  assert.equal(
    LEGAL_PLACEHOLDER.en,
    '[PLACEHOLDER: wording to be written by a professional. Do not launch with this text.]',
  )
  assert.equal(LEGAL_PLACEHOLDER.ja, '専門家による文案作成が必要です。この文章のまま公開しないでください。')
  for (const page of Object.keys(LEGAL_PAGES) as LegalPageKey[]) {
    for (const locale of ['en', 'ja'] as const) {
      for (const section of legalPageContent(page, locale).sections) {
        assert.equal(section.placeholder, LEGAL_PLACEHOLDER[locale], `${page} ${locale} ${section.heading}`)
      }
    }
  }
})

test('only confirmed config facts appear (name, email), under the planned headings; never the phone', () => {
  const facts = (page: LegalPageKey, locale: 'en' | 'ja') =>
    legalPageContent(page, locale)
      .sections.filter((s) => s.fact !== undefined)
      .map((s) => [s.heading, s.fact])

  assert.deepEqual(facts('privacy', 'en'), [
    ['Business information', siteConfig.site.name],
    ['Contact', siteConfig.contact.email],
  ])
  assert.deepEqual(facts('privacy', 'ja'), [
    ['事業者情報', siteConfig.site.name],
    ['お問い合わせ窓口', siteConfig.contact.email],
  ])
  assert.deepEqual(facts('legalNotice', 'en'), [
    ['Seller', siteConfig.site.name],
    ['Email', siteConfig.contact.email],
  ])
  assert.deepEqual(facts('legalNotice', 'ja'), [
    ['販売事業者', siteConfig.site.name],
    ['メールアドレス', siteConfig.contact.email],
  ])
  assert.deepEqual(facts('terms', 'en'), [])

  const phone = siteConfig.contact.phone
  assert.ok(phone, 'config has a (placeholder) phone to guard against')
  for (const page of Object.keys(LEGAL_PAGES) as LegalPageKey[]) {
    for (const locale of ['en', 'ja'] as const) {
      const text = JSON.stringify(legalPageContent(page, locale))
      assert.equal(text.includes(phone), false, `${page} ${locale} must not show the unconfirmed phone`)
    }
  }
})

test('page titles are the Spec §4 titles', () => {
  assert.equal(legalPageContent('privacy', 'en').title, 'Privacy Policy')
  assert.equal(legalPageContent('privacy', 'ja').title, 'プライバシーポリシー')
  assert.equal(legalPageContent('terms', 'ja').title, '利用規約')
  assert.equal(legalPageContent('legalNotice', 'en').title, 'Legal Notice')
  assert.equal(legalPageContent('legalNotice', 'ja').title, '特定商取引法に基づく表記')
})
