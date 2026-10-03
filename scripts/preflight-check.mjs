#!/usr/bin/env node
// Fails loudly (non-zero exit, grouped report) if this repo isn't safe to
// deploy for a client: leftover __FILL_ME__ sentinels from
// create-client-app.mjs, leaked content from the original Sakura demo
// this template was built from, or hardcoded personal-email PII.
// Intended to run in CI on every push/PR — see
// .github/workflows/preflight.yml.
//
// Usage: node scripts/preflight-check.mjs

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const repoRoot = process.cwd()
const SITE_CONFIG_PATH = 'apps/clinic-demo/site.config.ts'

const SCAN_ROOTS = ['apps', 'packages']
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.data',
  'dist',
  'coverage',
  'test-results',
  'review-docs',
  '.git',
])
const isTestFile = (path) => /(\.test\.|\.spec\.|__tests__\/)/.test(path)

function walk(dir, onFile) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIR_NAMES.has(entry)) continue
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      walk(fullPath, onFile)
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      onFile(fullPath)
    }
  }
}

function findLineNumbers(content, needle) {
  const lines = content.split('\n')
  const matches = []
  lines.forEach((line, index) => {
    if (line.includes(needle)) matches.push(index + 1)
  })
  return matches
}

function main() {
  const failures = []

  // --- 1. Leftover __FILL_ME__ sentinels -------------------------------
  const siteConfigContent = readFileSync(join(repoRoot, SITE_CONFIG_PATH), 'utf8')
  const sentinelLines = findLineNumbers(siteConfigContent, '__FILL_ME__')
  for (const line of sentinelLines) {
    failures.push(`${SITE_CONFIG_PATH}:${line} — unfilled __FILL_ME__ placeholder`)
  }

  // --- 2. Leaked Sakura demo content ------------------------------------
  // This template's own origin demo is "Sakura Osteopathic Clinic". Every
  // scaffolded client repo must never contain it. Skipped only when
  // running against the source template itself (site.name is still
  // literally the Sakura name — nothing has been customized yet, so
  // there's nothing to compare against).
  const isSourceTemplate = siteConfigContent.includes(`name: 'Sakura Osteopathic Clinic',`)
  if (!isSourceTemplate) {
    const LEGACY_STRINGS = [
      'Sakura Osteopathic Clinic',
      'さくら接骨院',
      'sakura-sekkotsu',
      '+81-3-5432-1188',
    ]
    for (const root of SCAN_ROOTS) {
      walk(join(repoRoot, root), (filePath) => {
        if (isTestFile(filePath)) return
        const content = readFileSync(filePath, 'utf8')
        const relPath = relative(repoRoot, filePath)
        for (const legacy of LEGACY_STRINGS) {
          for (const line of findLineNumbers(content, legacy)) {
            failures.push(`${relPath}:${line} — leftover template content: ${JSON.stringify(legacy)}`)
          }
        }
      })
    }
  }

  // --- 3. Hardcoded personal-email PII ----------------------------------
  const GMAIL_PATTERN = /[\w.+-]+@gmail\.com/
  for (const root of SCAN_ROOTS) {
    walk(join(repoRoot, root), (filePath) => {
      if (isTestFile(filePath)) return
      const content = readFileSync(filePath, 'utf8')
      const relPath = relative(repoRoot, filePath)
      content.split('\n').forEach((line, index) => {
        if (GMAIL_PATTERN.test(line)) {
          failures.push(`${relPath}:${index + 1} — hardcoded personal email address`)
        }
      })
    })
  }

  // --- 4. New required env vars must be documented in .env.example -----
  // Real secrets never live in this repo, so preflight can't check whether
  // a deploying client actually filled these in — that's enforced at
  // runtime instead (e.g. lib/line.ts's getLineChannelSecret() throws
  // loudly on first use if unset, mirroring payload.config.ts's
  // DATABASE_URI check). What CAN be checked statically is that every var
  // the app actually reads is documented here at all — a var referenced in
  // code but missing from .env.example is a silent onboarding trap for the
  // next client.
  const ENV_EXAMPLE_PATH = 'apps/clinic-demo/.env.example'
  const REQUIRED_ENV_VARS_DOCUMENTED = [
    // LINE Messaging API webhook (STEP 2 Part 1) — src/app/api/line/webhook/route.ts
    'LINE_CHANNEL_SECRET',
    'LINE_CHANNEL_ACCESS_TOKEN',
    // LINE Login / LIFF booking flow (STEP 2 Part 2) — src/lib/line.ts
    'LINE_LOGIN_CHANNEL_ID',
    'LINE_LOGIN_CHANNEL_SECRET',
    'NEXT_PUBLIC_LIFF_ID',
  ]
  const envExampleContent = readFileSync(join(repoRoot, ENV_EXAMPLE_PATH), 'utf8')
  for (const varName of REQUIRED_ENV_VARS_DOCUMENTED) {
    // Anchored to the start of a line (optional leading whitespace) so a
    // commented-out entry (`# VAR=`) doesn't satisfy the check the way a
    // plain substring match would.
    const documentedLinePattern = new RegExp(`^\\s*${varName}=`, 'm')
    if (!documentedLinePattern.test(envExampleContent)) {
      failures.push(`${ENV_EXAMPLE_PATH} — missing required env var documentation: ${varName}`)
    }
  }

  if (failures.length > 0) {
    console.error(`\nPreflight FAILED — ${failures.length} issue(s):\n`)
    for (const failure of failures) console.error(`  - ${failure}`)
    console.error(`\nFix the above before deploying. See docs/DEPLOY-NEW-CLIENT.md.\n`)
    process.exit(1)
  }

  console.log('Preflight OK — no unfilled placeholders, leaked template content, or hardcoded PII found.')
}

main()
