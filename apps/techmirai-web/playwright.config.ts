import { defineConfig, devices } from '@playwright/test'

/**
 * Minimal Playwright config scoped to the one booking journey e2e test —
 * not a general framework buildout. Mirrors scripts/a11y-check.ts's
 * BASE_URL convention.
 */
const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    // Pixel 7 (Chrome/Chromium engine) rather than an iPhone descriptor —
    // the latter defaults to WebKit, a separate browser download this repo
    // doesn't otherwise need.
    ...devices['Pixel 7'],
    trace: 'retain-on-failure',
  },
  ...(process.env['CI']
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      }),
})
