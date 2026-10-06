# Findings

## 2026-10-05 — F1: normal preflight was already FAILING before F1, not just launch mode

F1's own "Done when" line expects *"normal preflight passes"* (as the baseline, with only the
new `--launch` mode expected to fail). Verified otherwise: running the unmodified, currently
committed `scripts/preflight-check.mjs` (confirmed byte-identical output against the version
before F1's `--launch` dispatch was added) already fails with 33 pre-existing issues — leftover
`Sakura Osteopathic Clinic`/`さくら接骨院`/`sakura-sekkotsu`/`+81-3-5432-1188` strings scattered
across `site.config.ts`, several `[locale]` pages, `src/seed/**`, and three `packages/cms-core`
shared components (`hero/component.tsx`, `services-grid/component.tsx`,
`payload/globals/header.ts`, `verticals/clinic/reception/faq-content.ts`). This is unrelated to
F1's own changes (F1 only added the `--launch` code path; `runNormalChecks()` is byte-for-byte
the old `main()`) and is consistent with Pack-3/4 not having run yet — the site still has
extensive clinic seed content. No code change made — flagging only, per standing rule 13; F1's
own scope is building the gate, not fixing what it (or the pre-existing normal check) finds.

## 2026-10-05 — F1: `contact.address` wording doesn't match the Spec's literal bracket text

`site.config.ts`'s `contact.address` reads `[Address you may publish]` (en) / `[掲載可能な住所]`
(ja), set in Pack-2/D2. The Content Spec's literal wording (p.2-6, item 6) is `[one address you
are allowed to publish]`. `docs/WORK-ORDER.md` Appendix A paraphrases it the same way the code
does (`[address you may publish]`), which is likely where D2 got the wording from — but per
CLAUDE.md rule 5 the Spec's own bracket text is the source of truth, not Appendix A's summary.
Registered as `F1-06` in `docs/PLACEHOLDER-REGISTER.md` with this mismatch noted. No code
change made — flagging only, per standing rule 13; it's already-committed D2 content, not F1's
to rewrite unilaterally.

## 2026-10-05 — F1: Appendix A's "found in later sections" items deliberately not registered yet

`docs/WORK-ORDER.md` Appendix A lists 21 numbered items (Spec §1, pp.2-6) plus a "found in
later sections" bullet list (timelines, integrations detail, pricing detail, security, founder
message, team bios, company profile detail, technology table, booking, case-study detail, FAQ
items F19/F20/F24/F25, blog bylines, chat answer C09). F1 registered all 21 numbered items
(`F1-01`..`F1-21`) but deliberately did not add rows for the later-sections bullets: none of
that content exists in the repo yet (Pack-3/4 haven't built those pages), F1's own Read list
names only Spec p.2-6/p.11-14, and Appendix A itself frames that bullet list as "not
exhaustive; Step C1 builds the full list." Each Pack-3/4 step that builds a page should add its
own register row(s) when it creates the field — see the note left directly in
`docs/PLACEHOLDER-REGISTER.md` above the F1 rows. No code change made — flagging only, per
standing rule 13.

## 2026-10-04 — D1: `create-client-app.mjs` / `preflight-check.mjs` assume this repo is still the generic template

`scripts/create-client-app.mjs` scaffolds a brand-new client repo from this one (via `git
archive`) and replaces Sakura-clinic-specific values in `site.config.ts` with `__FILL_ME__`
sentinels. `scripts/preflight-check.mjs` is the matching CI gate that fails if a scaffolded
client repo still contains leftover Sakura content or unfilled sentinels. Both assume **this
repo is the generic clinic-demo template**, not a specific client's live site — which was true
before this project started (this repo itself was scaffolded that way) but stops being true as
Pack-2 replaces `site.config.ts`'s Sakura values with TechMirai's own.

D1 only updated the hardcoded `apps/clinic-demo/...` path constants in both scripts (now
`apps/techmirai-web/...`), per the approved D1 plan's narrow scope. Not addressed, and worth a
decision from Jamal later:
- Should these two scripts stay in the TechMirai repo at all, now that it's not a template?
- `create-client-app.mjs`'s `SITE_CONFIG_REPLACEMENTS` list includes several `bn:` (Bengali)
  entries for `site.config.ts` fields that D1 is removing. The script's own drift-detector will
  correctly fail loudly if anyone runs it against this repo post-D1 (by design — see its own
  comment), so this isn't a silent bug, but the list would need updating if the script is kept.
- Separately noticed: `preflight-check.mjs`'s header comment says it's "intended to run in CI
  ... see `.github/workflows/preflight.yml`," but no `.github/` directory exists anywhere in
  this repo — the referenced CI workflow was apparently never actually created.

No code change made for any of the above — flagging only, per standing rule 13.

## 2026-10-05 — D2: unused leftover clinic logo assets not cleaned up

`apps/techmirai-web/public/brand/` still has `logo2.png`, `logo3.png`, and
`Sakura-clinic-logo.png` left over from the clinic clone. Only `logo.svg` (now the TechMirai
text wordmark) is referenced by `site.config.ts`'s `brand.logoFile`; `Footer.tsx`'s own
hardcoded reference to `logo3.png` was fixed in D2 to use `siteConfig.brand.logoFile` instead.
D2 did not delete the other three files — removing unreferenced assets isn't named by D2's scope
and risks removing something another (unaudited) file still points at. Worth a cleanup pass
later. `favicon.ico` also still shows the old clinic icon — no safe ICO-generation tool was
available in this repo to regenerate it from the new wordmark; logged as `D2-02` in
`docs/PLACEHOLDER-REGISTER.md`.

## 2026-10-05 — D2: `hours-location` block's day-table UI won't fit the Spec's one-line hours

`site.config.ts`'s `contact.businessHours` changed from a clinic-style 7-day schedule object to
a single bracketed string (`{ weekdays: '[Weekdays 9:00–18:00]' }`), matching how the Content
Spec actually states TechMirai's hours (one phrase, not a day-by-day table). The
`hours-location` block (`packages/cms-core/src/blocks/hours-location/component.tsx`) expects
`monday`..`sunday` keys and renders a clinic-style ●/▲/休 table; with the new shape it would
render an empty-looking table (header row, no day columns) if ever placed on a page. No page
currently has a live instance of this block (`page.tsx`/`[slug]/page.tsx` only inject
`businessHours` into it conditionally), so nothing is visibly broken today. Flagging for
Pack-3 (content/pages), which will need to either redesign this block for a simple-hours
display or avoid placing it on TechMirai pages.

## 2026-10-05 — D2: hardcoded old clinic name in shared Hero block's logo alt text (resolved in E1)

`packages/cms-core/src/blocks/hero/component.tsx` hardcoded `alt="Sakura Osteopathic Clinic"`
and a `/brand/Sakura-clinic-logo.png` fallback on the hero logo image. Not fixed in D2 (flagged
here as needing a new prop). **Resolved in Pack-2/E1**, while already touching this file for its
nav-card icon maps: alt text changed to the generic `"Logo"` (no app-specific name, matching the
component's "pure function of raw block data" design — no `siteConfig` import), and the fallback
path changed to the generic `/brand/logo.svg` convention. `defaultNavItems` (which also
referenced clinic-only labels/icons) was emptied to `[]` for the same reason — a shared engine
component with no data renders nothing rather than another app's leftover pages.

## 2026-10-05 — D2: stale old-accent-color WCAG comments in shared Button/Badge components

`packages/cms-core/src/components/ui/Button.tsx:15-16` and `Badge.tsx:14-15` have comments
citing the pre-D2 accent hex (`#1D9E75`) to justify a hardcoded contrast-adjusted text color
(`#167758`) for their "secondary"/accent-on-tint variants. D2 changed the `accent` token to
orange (`#D97706`); these two components don't read `--color-accent` for this specific literal,
so nothing visually changed, but the comments' contrast-ratio math no longer describes the
actual current accent color. Not fixed in D2 — auditing every hardcoded arbitrary color across
the ~25 shared UI primitives for WCAG correctness against the new accent is a larger design-
system task than "a handful of files," per `docs/WORK-ORDER.md` §1.4. Flagging for a future
accessibility pass.

## 2026-10-05 — E2: reception chat widget always greets in Japanese, ignores page locale (found during Checkpoint 4 prep)

Verified in-browser on `/en`: the chat widget's teaser/greeting bubble shows the Japanese
greeting (`こんにちは。TechMiraiのAI受付...`), not the English one defined in
`site.config.ts`'s `reception.greeting.en`. Root cause in
`packages/cms-core/src/verticals/clinic/reception/ui/ReceptionWidget.tsx:41`:
```
const initialLocale = locales[0] ?? 'ja'
```
`locales` here is the static `reception.locales` array from `site.config.ts` (`['ja', 'en']`,
line ~197) — not the current route's locale. So `initialLocale` is always `'ja'`, regardless of
whether the page is `/ja` or `/en`; `greeting[initialLocale]` (line 75) and the
`ReceptionPanel`'s `initialLocale` prop (line 92) inherit the same wrong value. This is the
exact failure mode `docs/packs/PACK-2-FOUNDATION.md`'s E2 step warned about by name: "Render it
inside the locale provider so anything it mounts... has translation context. The clinic
template once failed here." It has recurred — the widget is mounted without being passed (or
without using) the actual page locale from the locale provider/route params.
No code change made — flagging only, per standing rule 13; this is a generic engine bug in
`packages/cms-core` (shared by all verticals, not TechMirai-specific content), so per CLAUDE.md
rule 11 a fix belongs in `docs/ENGINE-FIXES.md` as its own small, separate change, not folded
into this finding.

## 2026-10-05 — D2/E1: leftover Sakura-clinic SEO title/description in `site.config.ts` (found during Checkpoint 4 prep)

While capturing Checkpoint 4 screenshots, the browser tab title on `/` (ja) still read
"さくら整骨院..." (old clinic name). Traced to `site.config.ts`:
- `seo.titleTemplate` (line 154): `'%s | さくら接骨院 Sakura Osteopathic Clinic'` — appears in
  every page's `<title>` tag via the template.
- `seo.defaultDescription.en`/`.ja` (lines 156-157): full old-clinic marketing copy
  ("Sakura Osteopathic Clinic is a neighborhood clinic in Setagaya, Tokyo...") used as the
  default meta description site-wide.
- Also noticed, lower severity: `forms.contactRecipient`/`forms.appointmentRecipient` (lines
  143, 145) are `reception@sakura-sekkotsu.example` — already marked `// TODO: replace with the
  client's real inbox before real client launch`, so this one is a known placeholder, not a
  missed rename.

Not caught by D1's "clinic-demo" string grep (different string: "さくら接骨院"/"Sakura
Osteopathic Clinic", not "clinic-demo") or by D2's identity-constants work, since `seo.*` isn't
one of the fields D2's plan named. No code change made — flagging only, per standing rule 13;
needs a decision on what TechMirai's actual SEO title/description copy should be (Spec doesn't
appear to give one directly), likely a `[TBD]`/placeholder-register entry rather than invented
copy, per CLAUDE.md rule 5.

## 2026-10-05 — E1: "AI受付" nav label identical in both locales — likely intentional, but inconsistent with the glossary (found during Checkpoint 4 prep)

Verified by loading `/en` in a browser while gathering Checkpoint 4 screenshots: the first
desktop nav item reads "AI受付" on both the Japanese and English header. Traced to
`apps/techmirai-web/src/seed/demo/globals-header.ts:35`:
```
{ label: { en: 'AI受付', ja: 'AI受付' }, href: '/ai-reception' },
```
Initially looked like a missed translation (every other `navItems` entry has a distinct
`en`/`ja` pair, e.g. `'Solutions'`/`'業種別'`), but `apps/techmirai-web/src/lib/glossary.ts:10`
shows this is TechMirai's actual bilingual product name: `productFamily: { en: 'AI受付 (AI
Reception)', ja: 'AI受付' }` — confirmed again by the chat-widget greeting
(`site.config.ts` `reception.greeting.en`), which is Spec-quoted verbatim (Pack-2/E2, Content
Spec §16.1) and also keeps "AI受付" untranslated inside the English sentence. So "AI受付" as a
bare term in English is Spec-sanctioned branding, not leakage — but the nav label doesn't
include the glossary's own `(AI Reception)` qualifier the way `productFamily` does, so the nav
and the glossary disagree on the term's exact EN rendering. Flagging the inconsistency for a
decision (should the EN nav show "AI受付" alone, or "AI受付 (AI Reception)" per the glossary?)
rather than guessing — per CLAUDE.md rule 5/6 this repo doesn't invent or correct Spec copy
unilaterally. No code change made — flagging only, per standing rule 13.

**2026-10-05 update — Jamal's decision**: use "AI受付" alone for the EN navigation label,
matching the actual Spec wording. Do not add "(AI Reception)" unless a later approved content
decision explicitly requires it. No code change needed — the current `globals-header.ts:35`
value (`en: 'AI受付'`) already matches this decision as-is.

## 2026-10-05 — Checkpoint 4: header-behaviour decision signed off by Jamal

Per `docs/packs/PACK-2-FOUNDATION.md` E1 ("Put this in the plan as a decision for Jamal and the
Director, and wait for the answer") and the Checkpoint 4 requirement ("the header-behaviour
decision"), Jamal has signed off the following as the approved Option A behavior for Pack-2:

- The header remains visible/sticky/always available while scrolling (not "hidden until
  scroll") — matching what `HeaderClient.tsx` (~line 169) already implements (`fixed`,
  `translate-y-0 opacity-100`, no scroll listener).
- Desktop navigation and the Solutions dropdown remain accessible at all times.
- Mobile uses the sticky bottom action bar (`MobileMenu.tsx`), as already implemented.

No code change required — the implementation already matched this decision; this entry is the
recorded sign-off that `docs/packs/PACK-2-FOUNDATION.md`'s E1 "Done when" and Checkpoint 4
both required. The dead `scrolled` prop in `MobileMenu.tsx` (declared, never used) remains a
minor cleanup item, not addressed here since it isn't a correctness issue.

**Other Checkpoint 4 open items — Jamal's decision**: the chat-widget locale bug (greeting
always in Japanese, see the "E2: reception chat widget always greets in Japanese" entry below)
and the leftover Sakura-clinic SEO title/description (see the "D2/E1: leftover Sakura-clinic
SEO title/description" entry below) are **not** Pack-2 blockers. Both stay documented here and
carry forward to the future step where they're in scope (the chat-widget bug to a
`docs/ENGINE-FIXES.md` fix per CLAUDE.md rule 11; the SEO copy to Pack-3 content work). No
unrelated fixes were made to close Pack-2.

**Checkpoint 4 is signed off as of 2026-10-05.** Pack 2 is finished per
`docs/packs/PACK-2-FOUNDATION.md`'s own closing line ("Pack 2 is finished when Checkpoint 4
(after E2) is signed off and F3 is committed") once F3 is also committed — F1-F3 remain to be
planned and executed.

## 2026-10-04 — D1: small pre-existing doc inaccuracy fixed in passing

While re-running the "clinic-demo" grep sweep required by D1, found `ARCHITECTURE.md` claiming
`site.config.ts`'s `nav.socialLinks` point at `*-clinic-demo-placeholder` handles — the real
code uses `*-sakura-sekkotsu-placeholder` (confirmed by reading `site.config.ts` directly).
Pre-existing inaccuracy, unrelated to the rename; corrected the string since it was a one-line
fix encountered directly in the course of D1's own required grep check.

## 2026-10-05 — F2: `company/page.tsx` already expects global fields that have never existed in the schema

Found while planning Pack-2/F2's `company-info` global additions.
`apps/techmirai-web/src/app/(frontend)/[locale]/company/page.tsx` casts the `company-info`
global to a local `CompanyInfoDoc` type that expects `mission`, `vision`, `executives`, and
`timeline` fields — none of which have ever existed in `globals/company-info.ts`'s field config,
in this repo or evidently in whatever it was ported from. None of these four names appear
anywhere in the Content Spec's §10.6 (Company profile) either, so F2 did not add them: building
schema for fields the Spec never asked for would be guessing, not implementing. F2 added the
fields Spec §10.6 and §2.3 actually call for (`founder`, `businessForm`, `address`,
`businessHours`, `mainClient` — see `docs/CLONE-PLAN.md` §4). This page is rebuilt from the Spec
in Pack-3/I2 (About), so whoever plans I2 should either drop the `mission`/`vision`/`executives`/
`timeline` reads or decide they're genuinely needed and add them additively then — not carried
forward as an assumption.

## 2026-10-05 — F2: `test:integration` cannot run on this developer machine (environment gap, not an F2 regression)

While verifying F2's Gate 2 ("existing booking tests still pass"), `pnpm --filter @techmirai/cms-core test`
(the unit suite, 51 files / 594 tests, including every customers/booking-touching file) passed
cleanly with no changes needed. `pnpm --filter @techmirai/cms-core test:integration` failed before
running a single test: `src/booking/test/global-setup.ts` shells out to a `psql` binary to create
a throwaway test database, and `psql` is not installed/on `PATH` on this Windows machine (`which
psql` / `command -v psql` both return nothing). This is a pre-existing environment gap — it would
fail identically on `main` before any F2 change, since it's a missing local tool, not a code path
F2 touched. Flagging per standing rule 12: F2's booking-schema changes (`customers.company`, the
conditional kana `validate`) are verified correct by typecheck + the full unit suite + a `pnpm dev`
admin-UI check, but the specific `*.integration.test.ts` files this plan named could not actually
be executed and re-confirmed green in this environment. Installing a local PostgreSQL client (or
running these in CI/WSL where `psql` exists) would close this gap.
