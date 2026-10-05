#!/usr/bin/env node
// Fails loudly (non-zero exit, grouped report) if this repo isn't safe to
// deploy for a client: leftover __FILL_ME__ sentinels from
// create-client-app.mjs, leaked content from the original Sakura demo
// this template was built from, or hardcoded personal-email PII.
// No CI workflow currently runs this automatically (no .github/ directory
// exists in this repo) — see docs/FINDINGS.md's D1 entry. Run it by hand
// before deploying.
//
// Usage:
//   node scripts/preflight-check.mjs            — normal checks (unchanged)
//   node scripts/preflight-check.mjs --launch    — Pack-2/F1 launch gate:
//     scans source + rendered pages (both locales) against every
//     docs/WORK-ORDER.md Appendix B rule. Requires the app already running
//     (BASE_URL env var, default http://localhost:3000).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { extname, join, relative } from 'node:path'
import { runSharedChecks } from './launch-scan-rules.mjs'

const repoRoot = process.cwd()
const SITE_CONFIG_PATH = 'apps/techmirai-web/site.config.ts'

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

function runNormalChecks() {
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
  const ENV_EXAMPLE_PATH = 'apps/techmirai-web/.env.example'
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

// --- Pack-2/F1 launch gate (docs/WORK-ORDER.md §5, Appendix B) -----------

const ALLOWLIST_PATH = 'docs/LAUNCH-SCAN-ALLOWLIST.json'

function loadAllowlist() {
  let raw
  try {
    raw = readFileSync(join(repoRoot, ALLOWLIST_PATH), 'utf8')
  } catch {
    return []
  }
  const entries = JSON.parse(raw)
  for (const entry of entries) {
    if (!entry.reason || !entry.reason.trim()) {
      throw new Error(`${ALLOWLIST_PATH}: entry for rule ${entry.rule} is missing a "reason"`)
    }
  }
  return entries
}

// A hit is suppressed only if every present allow-list field matches —
// rule always required; scope/locale/match are AND-ed in when present, so a
// broad-looking entry can never silently swallow an unrelated hit in the
// same file/route (docs/WORK-ORDER.md Appendix B preamble).
function isAllowlisted(hit, allowlist) {
  const scopeValue = hit.scope === 'rendered' ? hit.route : hit.file
  return allowlist.some((entry) => {
    if (entry.rule !== hit.ruleId) return false
    if (entry.scope && !(scopeValue ?? '').includes(entry.scope)) return false
    if (entry.locale && entry.locale !== hit.locale) return false
    if (entry.match && !String(hit.snippet).includes(entry.match)) return false
    return true
  })
}

function formatHit(hit) {
  const where = hit.scope === 'rendered' ? `${hit.route} (${hit.locale})` : `${hit.file}:${hit.line}`
  return `  - [${hit.ruleId}] ${where} — ${hit.note} (${JSON.stringify(hit.snippet)})`
}

// B6's bracket-placeholder regex (`[...]`) is only meaningful against actual
// *content* — it floods unreadably if run against general TS/TSX source,
// which is full of array literals, destructuring, regex character classes,
// and quoted CSS-selector strings (e.g. `querySelector('[rel="canonical"]')`)
// that all contain "[...]" for syntactic reasons unrelated to the Spec's
// placeholder-bracket convention. Scope B6 (only) to the known content
// locations where Spec-sourced bracket placeholders actually live; B1-B5
// are specific literal-phrase matches with much lower false-positive risk
// and stay scoped to the full apps/+packages/ source tree.
const CONTENT_PATH_PREFIXES = ['apps/techmirai-web/site.config.ts', 'apps/techmirai-web/src/seed/']
function isContentPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/')
  return CONTENT_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix))
}

async function runLaunchScan() {
  const allHits = []

  // --- static source pass (also covers seed data: apps/techmirai-web/src/seed/**
  // is already inside SCAN_ROOTS=['apps','packages'] with .ts/.tsx extensions) ---
  for (const root of SCAN_ROOTS) {
    walk(join(repoRoot, root), (filePath) => {
      if (isTestFile(filePath)) return
      const content = readFileSync(filePath, 'utf8')
      const relPath = relative(repoRoot, filePath)
      const isContent = isContentPath(relPath)
      for (const hit of runSharedChecks(content, { filePath: relPath })) {
        if (hit.ruleId === 'B6_BRACKET_PLACEHOLDERS' && !isContent) continue
        allHits.push({ ...hit, scope: 'source', file: relPath, locale: null })
      }
    })
  }

  // --- rendered-page pass (both locales) ----------------------------------
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
  let serverReachable = false
  try {
    const res = await fetch(baseUrl, { method: 'HEAD' })
    serverReachable = res.status < 500
  } catch {
    serverReachable = false
  }
  if (!serverReachable) {
    console.error(`\nLaunch scan cannot reach ${baseUrl}.`)
    console.error(`Start the app first (e.g. "pnpm dev", or "pnpm build && pnpm start"), then re-run with --launch.\n`)
    process.exit(1)
  }

  // `npx tsx` doesn't reliably resolve tsx's binary location in this
  // workspace; `npm run <script> --workspace=techmirai-web` is the pattern
  // already confirmed to work (same as running the dev server).
  let pageScanOutput = ''
  try {
    pageScanOutput = execFileSync('npm', ['run', 'launch-scan:pages', '--workspace=techmirai-web', '--silent'], {
      cwd: repoRoot,
      env: { ...process.env, BASE_URL: baseUrl },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
      shell: true,
    })
  } catch (err) {
    // launch-scan-pages.ts always exits 0 (it's a reporter, not the pass/
    // fail authority) — a non-zero exit here means the scan itself crashed,
    // not that it found hits. Surface whatever it printed either way.
    pageScanOutput = err.stdout?.toString?.() ?? ''
    if (err.stderr) console.error(err.stderr.toString())
  }
  for (const line of pageScanOutput.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      allHits.push(JSON.parse(trimmed))
    } catch {
      // Not a JSON hit line (e.g. a stray console.log from the page scan) — ignore.
    }
  }

  // --- allow-list partition ------------------------------------------------
  const allowlist = loadAllowlist()
  const failing = []
  const allowed = []
  for (const hit of allHits) {
    ;(isAllowlisted(hit, allowlist) ? allowed : failing).push(hit)
  }

  if (allowed.length > 0) {
    console.log(`\nAllow-listed — ${allowed.length} hit(s), for visibility:\n`)
    for (const hit of allowed) console.log(formatHit(hit))
  }

  if (failing.length > 0) {
    console.error(`\nLaunch scan FAILING — ${failing.length} hit(s):\n`)
    for (const hit of failing) console.error(formatHit(hit))
    console.error(`\nEach hit must be fixed, or added to ${ALLOWLIST_PATH} with a written reason.\n`)
    process.exit(1)
  }

  console.log('\nLaunch scan OK — no non-allow-listed Appendix B hits found.')
}

async function main() {
  if (process.argv.includes('--launch')) {
    await runLaunchScan()
  } else {
    runNormalChecks()
  }
}

main()
