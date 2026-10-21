/**
 * Generates public/downloads/techmirai-ringi-overview.pdf — the 1–2 page
 * 稟議 [internal approval] overview offered on /contact (ECC Master Prompt v2
 * §9). Built from the same copy as the site (what it is, how it works, PoC
 * flow, privacy summary, contact) using Playwright's bundled Chromium, so no
 * new dependency or service is needed.
 *
 * Run: pnpm --filter techmirai-web ringi:pdf
 *
 * Every fact the owner has not confirmed stays a [TBD: ...] placeholder, and
 * the file says so on its first line. Japanese text is limited to the strings
 * the prompt supplies (CLAUDE.md rule 6).
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const OUTPUT_DIR = resolve(__dirname, '../public/downloads')
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'techmirai-ringi-overview.pdf')

const SECTIONS: ReadonlyArray<{ heading: string; lines: readonly string[] }> = [
  {
    heading: 'What it is',
    lines: [
      'コールセンター・電話窓口向け AI音声エージェント (AI voice agent for call centers and phone desks).',
      'AI gives first-line response to routine, busy-time and after-hours calls, records and summarizes them, and passes what needs a person to staff. Call-center operators can offer it as their own service.',
    ],
  },
  {
    heading: 'How it works',
    lines: [
      'A customer calls → operators are busy or it is after hours → AI answers from approved knowledge → AI records, transcribes and summarizes → complex or sensitive cases go to a person.',
      'Next morning, staff see caller details, transcript, summary, urgency, callback status and a recommended action in a dashboard.',
      'AI supports human operators; it does not replace them.',
    ],
  },
  {
    heading: 'Proof of concept (PoC) flow',
    lines: [
      '検証 Validate → 効果測定 Measure the effect → 導入判断 Decide on adoption → 本番開発 Production development.',
      'Target task: [TBD]. Duration: [TBD: X weeks]. Partner provides: [TBD]. TechMirai delivers: [TBD].',
      'No results are claimed. Suggested measures: response rate, completion rate, transfer rate, callback rate, incorrect-answer rate, missed-call reduction, handling time, after-call work, operator review, abandonment.',
    ],
  },
  {
    heading: 'Privacy summary',
    lines: [
      'Forms require consent before sending. Demo calls require a recording and transcription notice and active agreement before any microphone use.',
      'Retention period: [TBD]. Who can access data: [TBD]. The full privacy policy is [TBD: pending professional review].',
    ],
  },
  {
    heading: 'Contact',
    lines: [
      'Company: [TBD: legal company name]. Contact person: [TBD]. Email: [TBD]. Web: /contact',
      'No prices are published. Commercial terms are discussed in consultation.',
    ],
  },
]

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function buildHtml(): string {
  const body = SECTIONS.map(
    (s) =>
      `<h2>${escapeHtml(s.heading)}</h2>${s.lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}`,
  ).join('')

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TechMirai — overview for internal approval</title>
<style>
  body { font-family: "Noto Sans JP", "Segoe UI", sans-serif; color: #04342C; font-size: 11pt; line-height: 1.7; margin: 0; }
  h1 { font-size: 18pt; color: #0F6E56; margin: 0 0 4pt; }
  h2 { font-size: 12.5pt; color: #0F6E56; margin: 14pt 0 3pt; border-bottom: 1px solid #E2E8E7; }
  p { margin: 3pt 0; }
  .draft { background: #FFF7E6; border: 1px solid #D97706; padding: 6pt 8pt; font-size: 9.5pt; margin-bottom: 10pt; }
</style></head><body>
<div class="draft">DRAFT — contains [TBD] placeholders. The owner must review and complete them before this document is shared.</div>
<h1>TechMirai — AI voice agent for call centers</h1>
<p>Overview for internal approval (稟議)</p>
${body}
</body></html>`
}

async function main(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(buildHtml(), { waitUntil: 'load' })
    await page.pdf({ path: OUTPUT_FILE, format: 'A4', margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } })
  } finally {
    await browser.close()
  }
  console.log(`Wrote ${OUTPUT_FILE}`)
}

main().catch((err: unknown) => {
  console.error('ringi PDF generation failed:', err)
  process.exit(1)
})
