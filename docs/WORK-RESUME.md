# Work resume checkpoint

**Saved:** 2026-10-15 · **Branch:** `j2-consultation-booking` · **HEAD:** `69d9fd8` (feat: add bilingual SEO structured data and OG images)

**To resume:**
1. Read this file.
2. Run `git status` and check it matches "Current Git changes" below.
3. Continue from "Exact next action". Do not redo completed work.

## Current task

**Pack-4 / M1 — legal pages** (`/privacy`, `/terms`, `/legal-notice`, EN + JA). The plan is approved and implemented. The current sub-step is **launch-scan option 1**: make the launch scan flag the approved Japanese placeholder. Jamal chose option 1 on 2026-10-15.

## Approval-screen status

- **No approval screen is open.** The session was paused by Jamal before the pending command ran, and that command was rejected, so nothing is awaiting approval.
- **Approvals given:**
  - the M1 plan ("Yes, and use auto mode")
  - launch-scan option 1
- **Not authorized:** commit, push, deploy, or cleanup. Per CLAUDE.md rule 3, the developer commits.

## Approved decisions (Jamal, 2026-10-15)

1. **EN placeholder**, under every legal heading: `[PLACEHOLDER: wording to be written by a professional. Do not launch with this text.]`
2. **JA placeholder**, under every legal heading: `専門家による文案作成が必要です。この文章のまま公開しないでください。` Supplied by Jamal; not written or translated by ECC.
3. **Phone:** placeholder only. The unconfirmed `[080-7701-3004]` is not shown on legal pages.
4. **Redirects:** 301 `/legal` → `/legal-notice` and `/en/legal` → `/en/legal-notice`. The L1 `/legal/*.html` redirects are unchanged.
5. **Launch scan, option 1:** add the exact JA placeholder string to rule B6 without changing legal-page content or approved wording.

## Completed work (uncommitted)

- **Headings data:** `apps/techmirai-web/src/lib/legal-headings.ts` holds the Spec §18 headings (privacy 9, terms 6, legal notice 10, EN + JA), the approved placeholders, and confirmed facts only: "TechMirai" under Business information / 事業者情報 and Seller / 販売事業者, and info@techmirai-ai.com under Contact / お問い合わせ窓口 and Email / メールアドレス.
- **Page component:** new `_components/LegalPage.tsx`; the three legal routes use it; `_components/LegalPlaceholder.tsx` deleted.
- **Consent link:** `AssessmentForm.tsx` now uses the locale-aware `Link` (`/en/assessment` → `/en/privacy`).
- **Redirects:** `next.config.ts` has the two approved 301s.
- **Unit test:** new `legal-headings.test.ts` re-reads the Spec rows and checks the placeholders, the facts and the absence of the phone.
- **Launch-scan rule:** `scripts/launch-scan-rules.mjs` adds `B6_UNBRACKETED_PLACEHOLDERS` (the exact JA string), matched by `checkB6BracketPlaceholders` under rule ID `B6_BRACKET_PLACEHOLDERS`.
- **Launch-scan test:** new `src/lib/launch-scan-placeholder.test.ts` (4 tests: no drift from `LEGAL_PLACEHOLDER.ja`; JA flagged; EN still flagged; no false positives).
- **Docs:**
  - `PLACEHOLDER-REGISTER.md`: E2-01 closed; M1-01 to M1-03 added.
  - `FINDINGS.md`: M1 section appended. Its "Blocker" paragraph still says the JA placeholder is **not** flagged. It must be updated with the option-1 result; that update is not done yet.

## Last confirmed results

**Verified (observed output in this session):**
- **Before the scan-rule change:**
  - typecheck passed
  - web unit suite 32/32
  - cms-core unit suite 67 files / 1012 tests
  - rendered check of all 6 legal pages: one H1, H2s equal to the Spec rows, one placeholder per heading, no other text in `<main>`
  - consent and footer links correct in both locales
  - all 5 legal redirects return 301 to the right targets
  - fictional-demo sentence present on the clinic page in both locales
  - no `Set-Cookie` on `/`, `/en`, `/en/privacy`
  - no browser console errors or warnings on the 8 touched pages
  - launch scan: EN placeholder flagged (`/en/legal-notice` 20, `/en/privacy` 18, `/en/terms` 12 hits); JA placeholder 0 hits
- **After the scan-rule change:**
  - `launch-scan-placeholder.test.ts` 4/4
  - `legal-headings.test.ts` 4/4
  - typecheck passed
  - launch scan (log: session scratchpad `launch-scan-m1.log`), exit 0:
    - JA placeholder: `/legal-notice` (ja) 11, `/privacy` (ja) 10, `/terms` (ja) 7; **0 hits outside the legal pages**
    - EN placeholder counts unchanged (20 / 18 / 12)

**Unverified (not yet confirmed):**
- The **split of the JA hits by scope.** The counts look like one text-scope hit per section (10 / 9 / 6) plus one markup hit per page, because the literal match counts once per line and the page HTML is one line. This has **not** been confirmed; that was the pending command.
- The **full web unit suite** has not been rerun after the scan-rule change; only the two relevant test files were run.
- The **static preflight pass** (`pnpm preflight`, which also imports `launch-scan-rules.mjs`) has not been run after the change.
- **FINDINGS** does not yet record the option-1 result.

## Pending command (not run — rejected when the session was paused)

**Purpose:** split the Japanese placeholder hits in `launch-scan-m1.log` by scope, for each of `/privacy`, `/terms` and `/legal-notice`:
- **text scope:** lines without `(markup)` in the note
- **markup scope:** lines with `(markup)`

This confirms every section is flagged in rendered text (expect 9 / 6 / 10 text-scope hits plus 1 markup hit each). It is read-only and needs no new scan run if the scratchpad log still exists; otherwise rerun the scan first.

## Current Git changes (`git status --short` at save time)

```
 M apps/techmirai-web/next.config.ts
 D apps/techmirai-web/src/app/(frontend)/[locale]/_components/LegalPlaceholder.tsx
 M apps/techmirai-web/src/app/(frontend)/[locale]/assessment/_components/AssessmentForm.tsx
 M apps/techmirai-web/src/app/(frontend)/[locale]/legal-notice/page.tsx
 M apps/techmirai-web/src/app/(frontend)/[locale]/privacy/page.tsx
 M apps/techmirai-web/src/app/(frontend)/[locale]/terms/page.tsx
 M docs/FINDINGS.md
 M docs/PLACEHOLDER-REGISTER.md
 M scripts/launch-scan-rules.mjs
?? apps/techmirai-web/src/app/(frontend)/[locale]/_components/LegalPage.tsx
?? apps/techmirai-web/src/lib/launch-scan-placeholder.test.ts
?? apps/techmirai-web/src/lib/legal-headings.test.ts
?? apps/techmirai-web/src/lib/legal-headings.ts
```

Plus this file, `docs/WORK-RESUME.md`. Nothing is staged and nothing is committed for M1.

**Known issue (not M1):** commit `a7a2914` has a malformed message: the `-m` flags ended up inside the subject line. It is already pushed. Fixing it needs an amend and force-push, which is Jamal's call.

## Dev-server status

- `pnpm dev` is running in the background (Claude Code task `bjtd116rp`, started with a cleared `.next`), listening on port 3000 (node PID 20688). It answered 200 just before the pause.
- A chrome-devtools page (isolated context `m1-check`) is still open on `/en/assessment`.
- On Windows, stopping the task does not stop the Next server: stop the PID holding port 3000 after checking its command line.

## Exact next action (updated after resume)

Done in the resumed session (2026-10-15): scan rerun, JA hits split by scope (text 10 / 9 / 6, markup 1 each, 0 JA hits elsewhere), FINDINGS blocker paragraph replaced with the observed result, web unit suite 36/36, typecheck clean. `pnpm preflight` fails with 12 pre-existing clinic-template leftovers in files M1 did not touch (already tracked in FINDINGS). The cms-core suite was not rerun.

Remaining: Jamal reviews and commits. Replace the EN/JA placeholders with professional text before launch. Do not commit, push or deploy from here.
