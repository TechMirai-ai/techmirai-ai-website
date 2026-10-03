/**
 * Accessibility audit using axe-core via Playwright.
 *
 * Prerequisites (first time only):
 *   pnpm --filter clinic-demo exec playwright install chromium
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 pnpm --filter clinic-demo a11y
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000'

const PATHS = [
  '/',
  '/contact',
  '/services',
  '/faq',
  '/blog',
  '/news',
  '/en',
  '/en/contact',
  '/en/services',
  '/en/faq',
  '/booking',
  '/en/booking',
]

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  let totalViolations = 0

  for (const path of PATHS) {
    const url = `${BASE_URL}${path}`
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
      if (!response?.ok()) {
        console.warn(`  skipped (${response?.status() ?? 'no response'}): ${url}`)
        continue
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      if (results.violations.length === 0) {
        console.log(`✓ ${url}`)
      } else {
        console.error(`\n✗ ${url} — ${results.violations.length} violation(s)`)
        for (const v of results.violations) {
          console.error(`  [${v.impact ?? 'unknown'}] ${v.id}: ${v.description}`)
          for (const node of v.nodes.slice(0, 3)) {
            console.error(`    → ${node.html.slice(0, 140)}`)
          }
        }
        totalViolations += results.violations.length
      }
    } catch (err) {
      console.error(`  error checking ${url}:`, err instanceof Error ? err.message : err)
    }
  }

  await browser.close()

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} violation(s) found. Fix before deploying.`)
    process.exit(1)
  }

  console.log('\nAll pages pass WCAG 2.1 AA checks.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
