# Handoff: TechMirai AI Reception website

**Written:** 2026-10-20 (Pack-4 step O3) · **Built on:** commit `269b1ab` (the O3 documents are not yet committed) · **Branch:** `main`

**Status: not ready to launch.** One hard blocker needs Jamal's decision (section 1), eight register rows are marked launch blockers, and the launch scan does not pass. Nothing in this file is a deployment, migration, seeding or reset procedure; where none is known it says so.

How to read this: section 1 to 4 are what needs a decision or action; sections 5 to 8 are what exists; section 9 to 11 are the evidence and logs. Counts come from the files named; they will drift as the files change.

---

## 1. HARD BLOCKER: production schema and migration

Jamal's decision is required before any deploy. Verified facts and open questions are in [../README.md](../README.md) section 5 and [DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md) section A; in short:

- `payload.config.ts` has `push: true`, `prodMigrations` is commented out, and there is no `migrations/` folder.
- The Postgres adapter pushes the schema only outside `NODE_ENV=production` and runs `prodMigrations` only in production when set. **As configured, a production start creates no tables and applies no indexes.**
- `payload migrate` fails in this monorepo; the config says no production-safe automated migration path exists and one "must be fixed before WO-8" (`ENGINE-FIXES.md`, 2026-10-04, open).
- `pnpm --filter techmirai-web db:apply-indexes` has not been run against an empty database; its behaviour there is unverified.
- The seed scripts refuse any database not declared `DATABASE_ENV=development`, so there is no supported way to load production content. No reset script exists.

Questions: is the launch database a separate Neon database (the only confirmed one is the development database); who creates its tables and how; how production content gets in; and whether a code fix (generated migrations or `prodMigrations`) is wanted as a separate approved change.

## 2. Other launch blockers named in the register

| Row | What | Why it blocks |
|---|---|---|
| J2-01 | Meeting tool for consultation bookings (decided: Google Meet, staff send the link by hand) | Customer confirmation is not sent outside local development until the workflow is verified and the flag is changed by a separate approved change |
| J2-02 | In-person "visit" service area, staff and duration | Blocks only if the visit is to be offered; it is seeded inactive (decision D-5) |
| J2-05 | Booking slots are DEMO availability | Must be replaced with real availability |
| J2-12 | Customer booking emails (confirmation, reminder, cancellation) are sent only when `NODE_ENV === 'development'` | A deliberate code change in `customer-send-policy.ts` is needed to go live; no flag turns it on |
| K2-01 | Chat hand-off hours (`reception.handoffHours`, `[on weekdays 9:00–18:00]`) are a proposal | Not confirmed; must not be published as business hours |
| M1-01, M1-02, M1-03 | `/privacy`, `/terms`, `/legal-notice` carry only approved placeholder text under every Spec §18 heading | Body text must come from a qualified professional |

Also gating publication (register, status OPEN): Sadiatec's written permission for the case study (F1-14, I3-04 to I3-06; the page is seeded hidden, `visible: false`), each team member's written consent for name, photo and bio (F1-15), the founder-visibility decision (F1-04), and the real phone, address, hours, prices and brand assets (F1-01, F1-02, F1-06, F1-21, D2-01, D2-02).

## 3. Decisions waiting on Jamal

1. The production-database questions in section 1.
2. Vercel settings (Root Directory, install and build commands, Node version) and a Node pin (`engines` or `.nvmrc`); none is recorded in the repo.
3. Enabling customer emails (J2-12), after the meeting workflow is verified.
4. Whether to fix heading order (14 route and language pairs; needs a change in shared engine blocks).
5. Whether to fix the server-rendered `lang="ja"` on `/en` pages (accepted for now; fix is to move `<html>` into `[locale]/layout.tsx`).
6. What to do with the clinic-era routes (`/company`, `/services`, `/news`, `/team` and their detail pages): they are reachable and `noindex`, not in the Spec.
7. Remaining clinic-era wording: nine static preflight hits, the `blog/[slug]` recruitment call to action, and the clinic-flavoured `/contact`.
8. The launch-scan settings: fill the Sadiatec location stub, activate the 完全 allow-list entry, add `case-studies/sadiatec` and `booking/manage` to the scanner routes, and decide whether the static B4 scan should skip comments.
9. Whether to add a formatter (the O2 quality gate had nothing to run) and a type check for `scripts/`.
10. The production AI provider and plan for the chat fallback (Groq today), the analytics and cookie decision, and the items in WORK-ORDER section 9.

## 4. Known issues and unfinished work

**Static preflight (`pnpm preflight`) fails with 9 hits:** `site.config.ts` lines 131 to 134 (placeholder social URLs containing `sakura-sekkotsu`) and 161 (`reception@sakura-sekkotsu.example`); engine files `blocks/hero/component.tsx:113` and `payload/globals/header.ts:102` (default phone `+81-3-5432-1188`), `blocks/services-grid/component.tsx:210` and `verticals/clinic/reception/faq-content.ts:389` ("Sakura Osteopathic Clinic"). O1 scope is closed; these are open.

**Rendered launch scan:** last full run (O1, dev server, before the O1 fixes): 1,695 hits. Mostly bracket placeholders (register items), number patterns such as phone fragments, code-comment and CSS matches, and "Available now" on the Web edition (not the Voice edition). Not rerun since.

**Language and content:** `[JA TODO]` markers (about 37 in 8 source files) show where the Spec has no Japanese; Japanese is never machine-translated. `/blog/[slug]` still shows the recruitment call to action; the same strings sit unused in `messages/en.json` and `ja.json` (lines 161 to 162).

**Accessibility and SEO limits:** 14 route and language pairs fail the soft heading-order check (`h1` to `h3`), `lang="ja"` on `/en` in the server HTML, temporary brand colours (re-check contrast when real ones arrive), placeholder images and `[JA TODO]` alt text, and automated checks only (no manual keyboard or screen-reader pass). See [O2-ACCESSIBILITY.md](O2-ACCESSIBILITY.md).

**Tests not run:** the three database-writing e2e specs, the `*.integration.test.ts` files (no usable database on the developer machine), and a production-mode (`SITE_ENV=production`) pass of robots, headers and `/thanks` noindex.

**Data:** the `case-studies` document in the database may still contain a stray control character until a reseed (the seed source is fixed). Booking slots are demo data.

**Code-level follow-ups recorded in the O2 review:** the hand-maintained `DEDICATED_ROUTE_SLUGS` list in the catch-all route (a second dedicated route with a same-slug page document would repeat the production-only empty-page bug), and `scripts/` outside the type check. See [O2-CODE-REVIEW.md](O2-CODE-REVIEW.md).

**Other recorded observations (from FINDINGS):** the contact form honeypot is never rendered; `CONTACT_NOTIFICATION_EMAIL` is documented but not read by code; two parallel Resend-calling implementations exist; the booking rate limiter is per server process (register I1-06); no Voice implementation exists, the edition is labelled "In development"; `.env.example` points to `docs/STEP2-LINE-CATALOGUE.md`, which does not exist.

## 5. What is built

Commit history, subjects as written (newest first). Step names are the authors', not re-mapped here.

| Date | Commits |
|---|---|
| 2026-10-20 | `269b1ab` verify build, tests and accessibility (O2) |
| 2026-10-19 | `fface4f` clean up legacy route metadata and blog content (O1); `f46c752` N1 image slots, alt text and launch-scan image rule |
| 2026-10-15 | `dd27a70` localized legal pages and launch placeholder checks (M1); `69d9fd8` bilingual SEO structured data and OG images (L2); `a7a2914` L1 metadata and technical SEO |
| 2026-10-14 | `0abd851` harden TechMirai reception chat (K2) |
| 2026-10-13 | `bbfa9a0` TechMirai reception chat flow (K1); `632ed8a` J2 Google Meet copy and reminder timing; `696a44c` Windows-safe booking seed guard; `7e09fd8` J2 findings and register; `6e2abbd` J2 booking seed; `531dc20` J2 notifications, fail-closed customer-email policy, dev staff override; `82da168` J2 Asia/Tokyo time zone; `12668d2` J2 booking schema and UI |
| 2026-10-12 | `16d72ec` assessment form and email notifications (J1); `2e36e54` thanks page with noindex; `8da63c7` technology and gated Sadiatec case study pages; `3a89c34` About page |
| 2026-10-11 | `dac5c36` pricing and security pages |
| 2026-10-08 | `568abe7` how-it-works and integrations; `967e966` industry solutions and example chats; `517a14a` AI reception page; `902708a` integrations and FAQ content |
| 2026-10-07 | `0cfba11` solutions overview; `2a68186` capabilities and live demo; `8c63aae` homepage; `32c3aac` reception widget locale fix; `0d6cd24` and `628a335` TechMirai content seeding |
| 2026-10-06 | `e14f3b5` Pack-2 F2 foundation (content models, FAQ migration, feature flags) |
| 2026-10-05 | `c20e2dd` header, footer, labels, badges, register and launch gate; `d32163b` header sign-off; `3002481` E2 complete |
| 2026-10-04 | `6775e14` D1: rename app to `techmirai-web`, remove Bengali locale, disable clinic vertical; `d4d5af5` CLAUDE.md guardrails |
| 2026-10-03 | `f57d609` initialise from the clinic clone |

Features in the code, from the pages and registers: bilingual site (`ja` default, `en` under `/en`); the Spec's 20 public pages and 3 legal pages; free assessment form with email notifications; consultation booking (Asia/Tokyo, demo slots, staff notifications, fail-closed customer emails); a reception chat with static content and a Groq fallback; SEO (metadata, hreflang, sitemap, `llms.txt`, JSON-LD, generated share images); image slots with alt text; launch scan with allow-list; accessibility check.

## 6. Routes

All 46 Spec routes below answered 200 in both locales and passed axe at O2 (production build).

| Path (ja unprefixed, English under `/en`) | Notes |
|---|---|
| `/`, `/ai-reception`, `/how-it-works`, `/integrations`, `/pricing`, `/security`, `/about`, `/technology` | CMS `pages` documents through the catch-all route (the `about` section also has a detail route) |
| `/solutions`, `/solutions/clinic`, `/solutions/beauty`, `/solutions/automobile`, `/solutions/hotel` | Hub and industry pages |
| `/assessment`, `/faq`, `/contact`, `/blog` (+ `/blog/[slug]`) | Dedicated routes. `/assessment` is served by its own route since the O2 catch-all fix. |
| `/case-studies/sadiatec` | Dedicated route; shows a generic stub until the case-study `visible` switch is turned on (Sadiatec permission) |
| `/privacy`, `/terms`, `/legal-notice` | Legal headings with approved placeholder text. `/legal` and `/legal/*.html` redirect (301). |
| `/booking`, `/thanks` | Booking flow; thank-you page is `noindex` |

Other routes: `/booking/manage` (`noindex`); `/company`, `/services` (+ `/services/[slug]`), `/news` (+ `/news/[slug]`), `/team` (+ `/team/[slug]`), all clinic-era and `noindex` since O1; `/gallery` and `/jobs` index pages return 404; `/line/booking` and `/line/manage` (LIFF, LINE is off); `/admin` (Payload); `/og`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`; API routes `/api/ai/corpus`, `/api/ai/query`, `/api/cron/notifications`, `/api/forms/[type]`, `/api/health`, `/api/line/webhook`, `/api/reception/ai`, `/api/revalidate`, `/api/search-index`, `/api/v1/booking/{availability,cancel,line-customer-lookup,line-manage-lookup,lookup,reschedule,reserve,services}` and Payload's `/api/[...slug]`.

## 7. Placeholders by owner and status

Source: [PLACEHOLDER-REGISTER.md](PLACEHOLDER-REGISTER.md), counted on 2026-10-20 with a read-only script. All 126 rows have the expected seven columns and were classified; none was ambiguous. Classification uses the leading word of the owner and status text. "Active other" groups PARTIAL, LIVE, DEFERRED, DECIDED, IMPLEMENTED, NOT YET BUILT, BLOCKED, AWAITING REVIEW and IN FORCE; "Settled" groups CLOSED, RESOLVED, APPROVED, BY DESIGN, ENFORCED and SUPERSEDED. A row whose status starts with a settled word can still mention follow-up in its text, so "Settled" is not proof that no work remains.

| Owner (as written) | Open | Active other | Settled | Total |
|---|---|---|---|---|
| Jamal (alone) | 50 | 17 | 4 | 71 |
| Jamal with others (Director, accountant, Sanaul Haque, Haruka) | 9 | 3 | 0 | 12 |
| Developer (including "Developer, then each person") | 24 | 2 | 1 | 27 |
| Sanaul Haque | 4 | 0 | 0 | 4 |
| Haruka | 3 | 0 | 0 | 3 |
| Engineer or Director | 1 | 0 | 1 | 2 |
| Each person (team consent) | 1 | 0 | 0 | 1 |
| Everyone (rule-enforced) | 0 | 0 | 2 | 2 |
| n/a (by design) | 0 | 0 | 4 | 4 |
| **Total** | **92** | **22** | **12** | **126** |

Eight rows say "launch blocker": J2-01, J2-02, J2-05, J2-12, K2-01, M1-01, M1-02, M1-03 (section 2). The register notes that placeholders found in later pages were meant to be added by each step; it was not independently audited for completeness in O3.

## 8. Definition of done (WORK-ORDER section 8): honest status

| Item | Status |
|---|---|
| All 20 public and 3 legal routes render in `/ja` and `/en`; header and footer match Spec §4 | Routes render (46 checked, 200); content still contains placeholders. Header and footer match was not re-audited in O3. |
| Every Spec section ticked in `docs/CLONE-PLAN.md` | Not checked in O3 |
| Normal preflight passes; launch preflight fails only on register items | **Not met** (9 static hits; launch scan not rerun) |
| Register complete | 126 rows; completeness not independently verified |
| Typecheck, tests, build and accessibility check pass | **Met at O2** (see section 9); the soft heading-order check fails on 14 pairs |
| Technology page stack table proven or `[CONFIRM]` | Open rows I3-02 and I3-03 |
| Founder switch removes the founder everywhere in WORK-ORDER 2.3 | Built in I2; not re-verified in O3; F1-04 is PARTIAL |
| Original clinic folder unchanged and no shared database | Cannot be checked from this repo (CLAUDE.md rule 2); Jamal to verify |
| No secrets in git, `.env.example` or `docs/` | `.env.example` holds names and two non-secret defaults; the docs written in O3 were scanned; git history was **not** scanned (register K2-06 notes no key scan was done) |
| Jamal reviewed every checkpoint | Only the Checkpoint 4 sign-off is recorded in FINDINGS (line 449) |

What stays with Jamal: WORK-ORDER section 9 (deploying, domain and DNS, the LINE Official Account, closing every CONFIRM item, written permissions, Haruka's Japanese review, professional legal review, the founder decision, the production AI provider, post-launch submissions, the old site's URL list).

## 9. Verification evidence

| Step | Result |
|---|---|
| O1 (`fface4f`) | Route fixes: `noindex` on clinic-era routes, `/blog` content from Spec §15.1, Contact link to `/about`, one stray control character removed from the case-study seed |
| O2 (`269b1ab`) | Typecheck pass (3 packages); unit tests pass (`techmirai-web` 48, `cms-core` 1,012, `reception-engine` 47); `next build` pass (105 pages); axe: 46 routes, 0 serious or critical; `seo.spec.ts` alone: 38 pass, 14 fail on heading order only |
| Reports | [O2-ACCESSIBILITY.md](O2-ACCESSIBILITY.md), [O2-QUALITY-GATE.md](O2-QUALITY-GATE.md) (the gate was not executed: no formatter in the repo), [O2-CODE-REVIEW.md](O2-CODE-REVIEW.md) (approve with comments) |

## 10. Stale or out-of-scope documents

- [../ARCHITECTURE.md](../ARCHITECTURE.md): **stale, untouched in O3.** A search found 52 clinic, Sakura or Bengali mentions and 5 references to the retired `seed:demo`.
- [online-reservation.md](online-reservation.md), [line-reservation.md](line-reservation.md), [ai-receptionist.md](ai-receptionist.md): feature notes from the clinic template; not reviewed in O3.
- [WORK-RESUME.md](WORK-RESUME.md): an old resume checkpoint (2026-10-15, M1); not current.
- [DEPLOY-NEW-CLIENT.md](DEPLOY-NEW-CLIENT.md): the template runbook below its TechMirai section; the LINE steps (9, 9b) were not reviewed.
- `scripts/create-client-app.mjs` and parts of `scripts/preflight-check.mjs` assume the generic template (FINDINGS 2026-10-04, D1).

## 11. Log index

Dated logs, one line per entry; the entry text is in the file at the line shown (lines as of 2026-10-20). The tag is the parenthetical in the heading, if any.

### `ENGINE-FIXES.md` (30 entries)

| Line | Date | Entry | Tag |
|---|---|---|---|
| 3 | 10-08 | H3: `process-steps` step title required | fix |
| 23 | 10-08 | H2: three blocks required a heading | fix |
| 42 | 10-11 | I1: scan `ROUTES` missed `security` | fix |
| 68 | 10-08 | H2: `bento-grid` card link | fix |
| 83 | 10-08 | H2: `page-hero` disclaimer line | fix |
| 98 | 10-08 | H1: `HeroButtons` crash on bracket hrefs | fix |
| 127 | 10-08 | H1: `withLocale()` crash on bracket hrefs | fix |
| 158 | 10-08 | H1: `page-hero` body and buttons never rendered | fix |
| 182 | 10-08 | H1: `process-steps` heading required | fix |
| 198 | 10-04 | `@next/env` v15 and tsx on Windows | fix |
| 213 | 10-04 | **Payload migration CLI broken** (see section 1) | known gap, not fixed |
| 233 | 10-04 | `.gitignore` missing media pattern | fix |
| 248 | 10-04 | D1: Footer fetched clinic-only global | fix |
| 265 | 10-04 | D1: `push: true` crashed once on a stale FK drop | resolved itself |
| 288 | 10-05 | D2: duplicate LINE-URL fallbacks | fix |
| 308 | 10-05 | E1: `updateGlobal` drops group sub-field | fix |
| 330 | 10-05 | F2: case-studies wired to wrong flag | fix |
| 349 | 10-06 | **F2: `push: true` interactive prompt** | expected, not fixed |
| 411 | 10-06 | **F2: interactive push hung; explicit migration script** | n/a |
| 442 | 10-06 | F3: seed media re-upload orphans | fix |
| 465 | 10-07 | G0: chat greeted in Japanese on every page | fix |
| 491 | 10-12 | I2: founder switch only worked on the homepage | fix |
| 516 | 10-12 | I2: `team-grid` `showBio` never rendered | fix |
| 536 | 10-12 | I2: `ceo-message` invented motto | fix |
| 554 | 10-12 | I2: required rich text fails merge write | fix |
| 575 | 10-12 | I4: page-level noindex | addition |
| 593 | 10-12 | I4: `page-hero` LINE-link injection | n/a |
| 614 | 10-13 | J2: `seed:booking` did nothing on Windows | fix |
| 628 | 10-13 | K1: choice buttons as links, host jump | engine addition |
| 641 | 10-19 | O2: catch-all prerendered pages with their own route | fix |

### `FINDINGS.md` (63 entries)

| Line | Date | Entry | Tag |
|---|---|---|---|
| 3 | 10-08 | H3: `/how-it-works` and `/integrations` static-stub case | n/a |
| 24 | 10-08 | H3: F1-12 step attribution was wrong | n/a |
| 36 | 10-08 | H3: two judgment calls | n/a |
| 55 | 10-08 | H2: note on shared static-stub problem corrected | n/a |
| 81 | 10-08 | H2: demo bracket reuses unregistered disclaimer | n/a |
| 95 | 10-08 | H2: closing call-to-action is an interpretation | n/a |
| 117 | 10-08 | H1 verification: `/ai-reception` still 500 | n/a |
| 173 | 10-08 | H1: seeded under wrong slug and shadowed | n/a |
| 186 | 10-08 | H1: catch-all missing `cta-banner` injection | n/a |
| 190 | 10-07 | G4: FAQ ownership handoff; Partner card question | n/a |
| 218 | 10-07 | G4: duplicate `FAQBlockProps` declarations | n/a |
| 230 | 10-07 | G3: seed dropped its Postgres connection | not reproduced |
| 245 | 10-07 | G3: blocks must be registered in a third place | n/a |
| 268 | 10-05 | F1: normal preflight already failing | n/a |
| 283 | 10-05 | F1: address wording differs from Spec | n/a |
| 294 | 10-05 | F1: later-section items not registered yet | n/a |
| 308 | 10-04 | D1: scripts assume the generic template | n/a |
| 332 | 10-05 | D2: leftover clinic logo assets | n/a |
| 344 | 10-05 | D2: `hours-location` day table vs one-line hours | n/a |
| 357 | 10-05 | D2: old clinic name in Hero logo alt | resolved in E1 |
| 368 | 10-05 | D2: stale colour comments | n/a |
| 380 | 10-05 | E2: chat greets in Japanese | found in checkpoint prep |
| 402 | 10-05 | D2/E1: leftover SEO title in `site.config.ts` | found in checkpoint prep |
| 423 | 10-05 | E1: nav label identical in both locales | found in checkpoint prep |
| 449 | 10-05 | Checkpoint 4: header behaviour signed off by Jamal | decision |
| 479 | 10-04 | D1: small doc inaccuracy fixed | n/a |
| 487 | 10-05 | F2: `company/page.tsx` expects missing global fields | n/a |
| 502 | 10-05 | F2: `test:integration` cannot run here | environment gap |
| 517 | 10-06 | F3: gaps deferred to Phase G | n/a |
| 540 | 10-07 | G2: QR generation already built | n/a |
| 553 | 10-11 | I1: `/pricing` static-stub defect | n/a |
| 580 | 10-11 | I1: Pricing FAQ cross-reference inaccurate | n/a |
| 603 | 10-11 | I1: tax-note wording differs between pages | n/a |
| 614 | 10-11 | I1: request-limits claim downgraded to CONFIRM | n/a |
| 635 | 10-12 | I2: `/about` static-stub defect | n/a |
| 653 | 10-12 | I2: `label-value-list` for company profile | n/a |
| 671 | 10-12 | I2: English glosses in some `team` JA titles | observation, not changed |
| 684 | 10-12 | I2: Sadiatec allowed-locations stub empty | n/a |
| 708 | 10-12 | I3: no Voice implementation exists | n/a |
| 725 | 10-12 | I3: R2 media storage is conditional | n/a |
| 736 | 10-12 | I3: `case-studies` fields do not fit the Sadiatec case | n/a |
| 754 | 10-12 | I3: `payload.find()` result can reach the response | n/a |
| 788 | 10-12 | I3: `/technology` static-stub defect | n/a |
| 809 | 10-12 | I4: `/thanks` omits the booking-call button | confirmed Spec deviation |
| 823 | 10-12 | I1-I3 pages never set meta from content | n/a |
| 842 | 10-12 | J1: `/contact` still clinic content | observation, not fixed |
| 859 | 10-12 | J1: honeypot never rendered | observation, not fixed |
| 869 | 10-12 | J1: `CONTACT_NOTIFICATION_EMAIL` never read | observation, not fixed |
| 881 | 10-12 | J1: two parallel Resend implementations | observation, not fixed |
| 895 | 10-12 | J2: consultation booking, what was and was not done | n/a |
| 964 | 10-12 | J2 follow-up: Jamal's decisions applied | n/a |
| 1009 | 10-12 | J2 follow-up 2: dev staff-email override, seed re-run | n/a |
| 1073 | 10-13 | J2 final review: security review and fixes | n/a |
| 1127 | 10-13 | J2: customer email fail-closed policy | n/a |
| 1173 | 10-13 | J2 batch 1: meeting-tool copy, reminder timing, `visit` deferral | n/a |
| 1181 | 10-13 | J2 batch 1: Windows booking seed script | n/a |
| 1188 | 10-13 | K1: TechMirai chat content | n/a |
| 1224 | 10-13 | K2: AI fallback, hand-off, out-of-hours | n/a |
| 1271 | 10-15 | L1: metadata and technical SEO, blockers and open items | n/a |
| 1336 | 10-15 | L2: structured data, GEO, share images | n/a |
| 1382 | 10-15 | M1: legal pages | n/a |
| 1434 | 10-19 | N1: image slots, alt text, launch-scan image rule | n/a |
| 1462 | 10-19 | O1 and O2: results and open items (15 numbered items) | n/a |

Open items from these logs are consolidated in sections 1 to 4 above; the numbered list in the last FINDINGS entry is the most recent one.
