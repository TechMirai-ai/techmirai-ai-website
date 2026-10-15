import { test } from 'node:test'
import assert from 'node:assert/strict'
import { B6_UNBRACKETED_PLACEHOLDERS, checkB6BracketPlaceholders } from '../../../../scripts/launch-scan-rules.mjs'
import { LEGAL_PLACEHOLDER } from './legal-headings'

// Pack-4/M1: the launch scan must flag the approved legal-page placeholders in
// both locales. Run with `pnpm --filter techmirai-web test`.

test('the scan knows the exact approved JA placeholder (no drift from legal-headings.ts)', () => {
  assert.ok(B6_UNBRACKETED_PLACEHOLDERS.includes(LEGAL_PLACEHOLDER.ja))
})

test('B6 flags the approved JA placeholder in rendered text', () => {
  const page = `利用規約\n適用範囲\n${LEGAL_PLACEHOLDER.ja}\n禁止事項\n${LEGAL_PLACEHOLDER.ja}`
  const hits = checkB6BracketPlaceholders(page)
  assert.equal(hits.length, 2)
  for (const hit of hits) {
    assert.equal(hit.ruleId, 'B6_BRACKET_PLACEHOLDERS')
    assert.equal(hit.snippet, LEGAL_PLACEHOLDER.ja)
  }
  assert.deepEqual(hits.map((h) => h.line), [3, 5])
})

test('B6 still flags the bracketed EN placeholder exactly once per occurrence', () => {
  const hits = checkB6BracketPlaceholders(`Scope\n${LEGAL_PLACEHOLDER.en}`)
  assert.equal(hits.length, 1)
  assert.equal(hits[0]?.snippet, LEGAL_PLACEHOLDER.en)
})

test('B6 does not flag ordinary Japanese page text or a near-miss of the placeholder', () => {
  assert.deepEqual(checkB6BracketPlaceholders('お問い合わせ窓口\nTechMirai'), [])
  assert.deepEqual(checkB6BracketPlaceholders('専門家による文案作成が必要です。'), [])
})
