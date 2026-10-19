/**
 * Accessibility audit using axe-core via Playwright (Pack-4/O2).
 *
 * Routes come from the Spec §4 / §17.1 metadata (`PAGE_META`, `LEGAL_PAGE_META`
 * in src/lib/seo/page-meta.ts — the same list the sitemap uses), plus the
 * booking and thank-you pages. Each route is checked in Japanese (unprefixed)
 * and English (`/en`).
 *
 * Deliberately NOT checked (not Spec §4 pages; noindex; see docs/O2-ACCESSIBILITY.md):
 *   /company, /services, /news, /team and their detail pages, /booking/manage.
 *
 * Pass rule: no `serious` or `critical` violation on any route, and every
 * route answers 200. `moderate` / `minor` violations are printed but do not
 * fail the run.
 *
 * Prerequisites (first time only):
 *   pnpm --filter techmirai-web exec playwright install chromium
 *
 * Usage (against a running app, ideally `next start`):
 *   BASE_URL=http://localhost:3000 pnpm --filter techmirai-web a11y
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { PAGE_META, LEGAL_PAGE_META } from '../src/lib/seo/page-meta'

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000'

const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(['serious', 'critical'])
const NAVIGATION_TIMEOUT_MS = 60_000
const SETTLE_TIMEOUT_MS = 10_000

/** Public pages that are not in the §17.1 metadata tables but are part of the lead flow. */
const EXTRA_PATHS: readonly string[] = ['/booking', '/thanks']

function buildRoutes(): string[] {
  const keys = [...Object.keys(PAGE_META), ...Object.keys(LEGAL_PAGE_META), ...EXTRA_PATHS]
  return keys.flatMap((key) => [key === '' ? '/' : key, `/en${key}`])
}

interface RouteResult {
  readonly url: string
  readonly status: number | null
  readonly blocking: number
  readonly nonBlocking: number
}

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const results: RouteResult[] = []
  let blockingTotal = 0
  let nonBlockingTotal = 0
  let routeErrors = 0

  for (const path of buildRoutes()) {
    const url = `${BASE_URL}${path}`
    try {
      const response = await page.goto(url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS })
      // The chat widget keeps polling, so "idle" is best-effort only.
      await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS }).catch(() => undefined)

      const status = response?.status() ?? null
      if (!response?.ok()) {
        console.error(`✗ ${url} — HTTP ${status ?? 'no response'} (expected 200)`)
        routeErrors += 1
        results.push({ url, status, blocking: 0, nonBlocking: 0 })
        continue
      }

      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const blocking = axe.violations.filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ''))
      const nonBlocking = axe.violations.filter((v) => !BLOCKING_IMPACTS.has(v.impact ?? ''))

      if (axe.violations.length === 0) {
        console.log(`✓ ${url}`)
      } else {
        const mark = blocking.length > 0 ? '✗' : '~'
        console.log(`${mark} ${url} — ${blocking.length} blocking, ${nonBlocking.length} non-blocking`)
        for (const v of axe.violations) {
          const kind = BLOCKING_IMPACTS.has(v.impact ?? '') ? 'BLOCKING' : 'note'
          console.log(`  [${v.impact ?? 'unknown'}/${kind}] ${v.id}: ${v.description} (${v.nodes.length} node(s))`)
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`    → ${node.html.slice(0, 140).replace(/\s+/g, ' ')}`)
          }
        }
      }

      blockingTotal += blocking.length
      nonBlockingTotal += nonBlocking.length
      results.push({ url, status, blocking: blocking.length, nonBlocking: nonBlocking.length })
    } catch (err) {
      routeErrors += 1
      console.error(`✗ ${url} — error: ${err instanceof Error ? err.message : String(err)}`)
      results.push({ url, status: null, blocking: 0, nonBlocking: 0 })
    }
  }

  await browser.close()

  console.log(
    `\nSummary: ${results.length} route(s) checked; ${blockingTotal} blocking (serious/critical) violation(s); ` +
      `${nonBlockingTotal} non-blocking (moderate/minor) violation(s); ${routeErrors} route error(s).`,
  )

  if (blockingTotal > 0 || routeErrors > 0) {
    console.error('Accessibility check FAILED. Fix, or document each item in docs/O2-ACCESSIBILITY.md.')
    process.exit(1)
  }

  console.log('No serious or critical WCAG 2.1 AA violations on any checked route.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
