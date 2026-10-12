# Findings

## 2026-10-08 — Pack-3/H3: `/how-it-works`/`/integrations` confirmed as the `/ai-reception`-style static-stub case, not the `/solutions` case

H1's finding (below) flagged that `/how-it-works` and `/integrations` share
the same "static stub shadows the dynamic catch-all" defect H1 fixed for
`/ai-reception`, and H2's finding (below) warned that the simple
"just delete the stub" fix doesn't universally hold — it broke for
`/solutions`, which needed a nested `[slug]` route for 4 industry pages.

Confirmed before deleting anything: neither `/how-it-works` nor
`/integrations` has any sub-route in the Spec (§8) — both are flat pages.
So the `/ai-reception`-style fix applies directly here: both stub
directories (`apps/techmirai-web/src/app/(frontend)/[locale]/how-it-works/`,
`.../integrations/`) were deleted outright, with no replacement file
needed, since the sibling `[locale]/[slug]/page.tsx` catch-all already
handles both slugs once seeded (the `pages` collection already had shells
for both slugs, from `plain-pages.ts`'s Pack-2/F3 scaffolding).

Re-verified after the fix: `/how-it-works`, `/en/how-it-works`,
`/ja/how-it-works`, `/integrations`, `/en/integrations`, `/ja/integrations`
all return 200.

## 2026-10-08 — Pack-3/H3: `F1-12`'s original step attribution was wrong, and undercounted the status table's statuses

`docs/PLACEHOLDER-REGISTER.md` row `F1-12` said the Integrations page was
"NOT YET BUILT — registered by the Pack-3/I1 step." I1 was never the step
that builds `/integrations` — `docs/packs/PACK-3-PAGES.md` and
`docs/WORK-ORDER.md` Appendix C both assign it to H3. The row also listed
only 3 statuses ("works now / case by case / not offered"); the Spec's
actual §8.2 table uses 4 ("Available / Case by case / In development /
Not offered" — the 4th appears once, for "Phone line"). Corrected in place
rather than leaving a second, duplicate row, since F1-12 was always meant
to be this exact field.

## 2026-10-08 — Pack-3/H3: two judgment calls made where the Spec gives no explicit instruction

Logged for visibility rather than asserted as fact, per the same practice
H2 used for its own closing-CTA judgment call (below):

- **No closing CTA** on either `/how-it-works` or `/integrations`. Spec §6
  explicitly ties `/ai-reception` to the 5.14 CTA block; Spec §8 gives no
  equivalent instruction for either page here, and neither page's own
  closing line ("the under-table line" / "the bottom line") reads as an
  invitation to add a CTA banner underneath it. Confirmed with Jamal before
  seeding — both pages end on their literal Spec text instead.
- **The diagram's "talk to a person" route label** reuses the Spec's own
  already-approved "Talk to a person" / "スタッフと話す" pair (used
  elsewhere in the Spec for the same affordance — the always-visible header
  link, Appendix-listed around line 1480, and chatbot button B6 around line
  1498) rather than the 4th answer-layer's "A person"/"スタッフ", since the
  Spec's own diagram brief (p.50-51) uses the phrase "Talk to a person" by
  name for this exact dashed route, not "A person."

## 2026-10-08 — Pack-3/H2: H1's note on `/solutions`/`/how-it-works`/`/pricing` sharing the static-stub problem needed a correction once `/solutions/[slug]` existed

H1's own FINDINGS.md entry (below) assumed the fix for `/solutions` would be
identical to `/ai-reception`'s: delete the static stub, let the sibling
`[locale]/[slug]/page.tsx` catch-all take over. That assumption turned out
to be wrong once H2 actually needed to serve the four nested industry
pages too.

Once `solutions/[slug]/page.tsx` exists as a sibling of `solutions/page.tsx`
(needed for `/solutions/{clinic,beauty,automobile,hotel}` — no `[...slug]`
catch-all exists anywhere in the app, and the one-level-deep
`X/[slug]/page.tsx` pattern used by `about/[slug]`, `blog/[slug]`, etc. was
the only existing precedent for this shape), Next's router always resolves
the literal `solutions` segment locally. A `/solutions` request with no
local `page.tsx` there would 404, not fall through to the one-level-up
`[locale]/[slug]/page.tsx` catch-all the way `/ai-reception` did. So
`solutions/page.tsx` could not simply be deleted — it was instead replaced
with a real `pages`-collection fetch for slug `'solutions'` (same shape as
the generic catch-all, fixed to one slug), while the four industry stub
folders (`solutions/{clinic,beauty,automobile,hotel}/page.tsx`) were
deleted outright, since `solutions/[slug]/page.tsx` now serves them.

Re-verified after the fix: `/solutions`, `/en/solutions`,
`/solutions/clinic`, `/en/solutions/clinic` (and the other 3 industries)
all return 200.

## 2026-10-08 — Pack-3/H2: the clinic page's fictional-demo bracket reuses a disclaimer that's been live, unregistered, on the homepage since G2-G3

`[Demo clinic name]` / `[医院名]` (`"[Demo clinic name] is a fictional
clinic created for this demo."` / `"デモに登場する[医院名]は、デモ用の架空の
医院です。"`) has rendered on the homepage's `live-demo.smallPrint` since
Pack-3/G2-G3 (`apps/techmirai-web/src/seed/pages/home.ts` lines 221, 557),
but was never added to `docs/PLACEHOLDER-REGISTER.md` — not an H2 defect,
but H2 is the first step to notice it, because H2 is the first to reuse
the same bracket elsewhere (the clinic page's new `page-hero.smallPrint`
field, added this step). Registered now as `H2-03`, which also retroactively
covers the original homepage usage. `F1-19` (the related `demoUrl` bracket
itself) was already registered; this is the separate "fictional clinic"
disclaimer text, not the URL.

## 2026-10-08 — Pack-3/H2: closing-CTA copy for Section 7 is an interpretation call, not an explicit Spec instruction

Spec Section 6 explicitly says to end `/ai-reception` with "the final call
to action block from 5.14" — H1 followed that instruction directly. Section
7 gives no equivalent explicit instruction for either the hub or the four
industry pages; the step text just says "call to action" as the last
element of the shared template, with no copy of its own.

Two different calls were made here, both logged for visibility rather than
asserted as fact:
- The **4 industry pages** reuse 5.14's CTA verbatim (same heading/body/
  buttons as `/ai-reception`'s own closing CTA), matching H1's precedent
  for "no page-specific copy given → reuse the shared one."
- The **hub** instead uses its own Spec-given "Bottom line" sentence
  ("Don't see your industry?...") as the closing `cta-banner`'s `heading`,
  because the Spec actually gives the hub a dedicated one-sentence
  invitation that reads as a closing CTA in its own right — reusing 5.14's
  "Transform your website..." heading verbatim there as well would have
  buried the Spec's own, more contextually relevant sentence. The
  button/secondary-button/text-link/`showContactStrip` structure underneath
  is still the same site-wide pattern every other closing CTA uses.

## 2026-10-08 — Pack-3/H1 verification: `/ai-reception`'s Gate 3 still 500s — the `withLocale()` bracket fix in ENGINE-FIXES.md did not actually resolve the crash

While running H1's remaining verification gates, `/en/ai-reception` and the
default-locale `/ai-reception` both return **500**, not 200:

```
⨯ Error: Dynamic href `[demo.techmirai-ai.com]` found in <Link> while using
the `/app` router, this is not supported.
```

`docs/ENGINE-FIXES.md`'s 2026-10-08 "Pack-3/H1: `withLocale()` crashed on
bracketed placeholder hrefs" entry already describes this exact symptom and
is marked **Status: done** — but the fix (adding
`|| href.startsWith('[')` to all 10 duplicated `withLocale()` copies, so a
bracketed value passes through unchanged instead of getting
locale-prefixed) does not fix the actual crash. Next.js's app-router
`<Link>` rejects **any** href containing square brackets outright, whether
or not it carries a locale prefix — the bug was never the double-bracketing
(`/en/[demo.techmirai-ai.com]`), it's that `<Link href="[...]">` is rejected
unconditionally.

Confirmed by reading the code: `hero/component.tsx` (line ~440) and
`live-demo/component.tsx` (line ~53) already both render their
`demoUrl`-fed button as a **plain `<a href={...}>`**, not `next/link`'s
`<Link>`, with an explicit comment that `<Link>` rejects bracketed hrefs —
this was the real, working fix, done for those two blocks back in
Pack-3/G1-G2. The ENGINE-FIXES.md entry itself even says this plain-`<a>`
pattern is "a hand-avoided case, not a real fix" and predicts "every other
block built since (`cta-banner`, `team-grid`, `product-edition`,
`page-hero`) would crash the same way" — which is exactly what happened:
`page-hero`'s `HeroButtons` (`packages/cms-core/src/blocks/page-hero/component.tsx`,
~line 73-79) renders `secondaryButton` through `<Link href={withLocale(...)}>`,
and H1's own `ai-reception.ts` seed feeds that exact block
`secondaryButton: { label: 'Try the live demo', href: demoUrl }` (and the JA
equivalent), so the crash was predictable and should have been caught by
actually loading the page after the "fix," not just by re-reading the diff.

**Fixed during this verification pass, with explicit approval** (this
verification plan was otherwise read-only; the user was asked and chose to
have this specific fix applied rather than just reporting the gate
failure): `page-hero`'s `HeroButtons` now renders `secondaryButton`/
`primaryButton` as a plain `<a>` when the href is a bracketed placeholder,
matching the pattern already proven in `hero`/`live-demo`, instead of
relying on `withLocale()` alone. See `docs/ENGINE-FIXES.md`'s new entry for
the actual diff. Re-verified: `/en/ai-reception` → 200,
`/ai-reception` (default locale) → 200, `/ja/ai-reception` → 307 to
`/ai-reception` as expected.

**Still open**: the homepage's own `secondaryButton`/`buttonHref` uses of
`demoUrl` (`apps/techmirai-web/src/seed/pages/home.ts` lines 49, 219, 407,
555) were not re-checked against whichever block renders them — `home.ts`'s
`buttonHref: demoUrl` instances feed `live-demo`, which already uses the
`<a>` pattern, but this was not independently re-verified end-to-end here
since it's outside H1's own page. Worth a quick check next time the
homepage is touched.

## 2026-10-08 — Pack-3/H1: `/ai-reception` was seeded under the wrong slug, and shadowed by a static stub anyway

While planning H1, found two compounding gaps that would have made `/ai-reception` unreachable with real content even after writing it:

1. `apps/techmirai-web/src/seed/pages/plain-pages.ts` seeded this page's shell with `slug: 'product'`, not `'ai-reception'` — despite every forward-link already written in Pack-3/G1-G4 (the homepage hero's nav cards, the footer's PRODUCT section) pointing at `/ai-reception`. `scripts/launch-scan-pages.ts`'s own route list already expected `'ai-reception'`, confirming this was the intended slug all along, not a judgment call.
2. `apps/techmirai-web/src/app/(frontend)/[locale]/ai-reception/page.tsx` was a **static** Next.js route rendering a hardcoded `ComingSoonStub` (added in the `3002481 "E2 Complete."` commit). Static route segments always win over the sibling `[slug]/page.tsx` catch-all that queries the `pages` collection generically, so even fixing the slug alone would never have made `/ai-reception` show real content — the static file had to go too.

H1 fixed both (renamed the seed slug, deleted the static stub, and added a one-time cleanup in `plain-pages.ts` to delete the now-orphaned pre-rename `'product'` doc from any database that already ran a seed before this fix, guarded on an empty `layout` so nothing a human built there is silently destroyed).

**`/solutions`, `/how-it-works`, and `/pricing` have the identical shadowing static-stub pattern** (same E2 commit) and are NOT fixed here — out of H1's own scope (this step only touches `/ai-reception`). Flagging for whoever plans Pack-3/H2 (`/solutions`) and H3 (`/how-it-works`, `/integrations`) — each of those stubs will need the same delete-the-static-file treatment before real content can go live at those routes.

No code change made beyond H1's own scope for the 3 other pages — flagging only, per standing rule 13.

## 2026-10-08 — Pack-3/H1: the catch-all `[slug]/page.tsx` was missing the `cta-banner`/`showContactStrip` injection

`apps/techmirai-web/src/app/(frontend)/[locale]/[slug]/page.tsx` already mirrors home's siteConfig-injection switch for `booking-cta`/`hours-location`/`news-list`, but Pack-3/G4's `cta-banner`→`showContactStrip` injection (LINE-URL + phone/email/hours strip) was only ever added to the home route (`[locale]/page.tsx`). Since the Spec's final call-to-action (§5.14) is explicitly meant to be reused verbatim on other pages ("End with the final call to action block from 5.14" — H1's own instruction for §6's closing CTA), any page reusing that block needs the same injection. H1 added the identical branch to the catch-all. Whoever plans a future page reusing `cta-banner` with `showContactStrip` should find it already works via the catch-all now — this isn't a per-page thing to re-add.

## 2026-10-07 — Pack-3/G4: FAQ-doc ownership handoff to Pack-3/I4, and the Partner card's open visibility question

G4 seeds 6 real `faqs` docs (faqId F01, F03, F07, F14, F17, F22; `homepage:
true`; `sortOrder` 1-6 matching Spec §5.13's own display order) because the
homepage's FAQ section needs real working content today, even though the
full 26-question page (Pack-3/I4) hasn't been built yet. **Whoever plans I4
must reuse these 6 docs by `faqId`** (upsert-by-faqId, not a fresh create)
and add the remaining 20 — never duplicate or change F01/F03/F07/F14/F17/
F22's `faqId` values (the future chatbot-matching layer, Pack-4/K1-K2, also
keys off `faqId` being stable, per the field's own admin description in
`packages/cms-core/src/payload/collections/faqs.ts`). The homepage's `faq`
block resolves its 6 items dynamically at render time (`payload.find` where
`homepage: true`, sorted by `sortOrder` — see `page.tsx`) rather than storing
a relationship, so I4 changing these 6 docs' `category`/`sortOrder`/content
later will not require any homepage reseed.

Also flagging: the Partner card (Sadiatec Co., Ltd. / Md. Sanaul Haque) is a
named individual whose katakana reading and photo consent is, by the same
logic as register row F1-15, arguably required before publish — but Spec
§5.11 lists this card unconditionally (no "behind a switch" wording, unlike
§5.8's case study), and G4's own done-when criteria only test the founder
switch. G4 ships it ungated (registered as G4-01). A later step should
decide whether it needs its own visibility switch, the same shape as G3's
`caseStudyTeaser`.

No code change made beyond G4's own scope — flagging only, per standing
rule 13.

## 2026-10-07 — Pack-3/G4: pre-existing duplicate `FAQBlockProps`/`FAQItem` declarations

While adding the `textLink` field to the `faq` block, found that
`packages/cms-core/src/blocks/faq/component.tsx` declares its own local
`FAQBlockProps`/`FAQItem` interfaces, duplicating (and, until this change,
slightly diverging from) the ones already exported from
`packages/cms-core/src/blocks/faq/types.ts` that `adapter.ts` and
`blocks/index.ts` actually use. Not caused by G4 — pre-existing. G4 updated
both declarations in parallel to add `textLink` consistently, rather than
collapsing the duplication (a generic engine cleanup, out of this step's
scope). Flagging per standing rule 13 for a future pass.

## 2026-10-07 — Pack-3/G3: `pnpm seed` dropped its Postgres connection during booking-slot generation (unrelated to G3, not reproduced)

While re-running `pnpm seed` to verify G3's homepage content, the run crashed
with `Error: Connection terminated unexpectedly` (node-postgres) partway
through `seedBooking`'s slot generation for the second staff member (after
successfully seeding ~156 slots for the first). This happened well after the
homepage seed step itself had already logged `🏠 Homepage content seeded
(Spec §5.1-5.10)` successfully, so the home page's layout (including this
step's 5 new blocks) was written before the crash — not caused by, or a
blocker for, G3's own content. Looks like a transient Neon/network timeout
under the sustained slot-generation loop, not a code regression; not
reproduced on a second check since the homepage content was already
confirmed present by then. Flagging only, per standing rule 13 — no code
change made, and this is pre-existing `seedBooking` behavior, not G3's scope.

## 2026-10-07 — Pack-3/G3: new blocks must be registered in a THIRD place, `pages.ts`'s `buildAvailableBlocks`, not just `blocks/index.ts`/`registry.tsx`

While seeding G3's five new homepage blocks, `pnpm seed` failed with
`mergeLocales: unknown blockType "tools-compatibility" at layout position 5`.
Root cause: `packages/cms-core/src/payload/collections/pages.ts` has its own
separate, hand-maintained `buildAvailableBlocks(siteConfig)` function with its
own import list and block array — a near-duplicate of
`packages/cms-core/src/blocks/index.ts`'s `allBlockConfigs`, not a consumer of
it. `buildAvailableBlocks` is what actually becomes the live `pages`
collection's `layout` field schema (`fields: [..., { name: 'layout', type:
'blocks', blocks: buildAvailableBlocks(siteConfig) }, ...]`), so a block only
registered in `blocks/index.ts`/`registry.tsx` renders fine once seeded, but
can never BE seeded (`updateLocalizedDoc`'s `mergeLocales` looks up each
block's field schema from the collection's actual config to decide how to
merge locale data, and throws on a slug it can't find there).

G3 added the five new blocks to `pages.ts`'s list too (import + array entry),
matching this file's existing pattern — not refactoring the duplication away,
since collapsing it into a single source of truth is a generic engine
cleanup, not G3's own scope. Flagging per standing rule 13 so whoever adds the
next new block type knows to update three places (`registry.tsx`, `index.ts`,
`pages.ts`), not two.

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

## 2026-10-06 — F3: gaps deferred to Pack-3/Phase-G, flagged only

While implementing Pack-2/F3's seed scaffolding, four pre-existing or newly-visible gaps were
noticed but are explicitly out of F3's own scope (seed/data layer only, not frontend routing or
Spec content). No code change made for any of these — flagging only, per standing rule 13:

1. **`downloads` collection has no real use yet.** `features.downloads` is on and the collection
   exists, but nothing in F3's 16 page-groups links to a downloadable asset, so it was left empty
   after clinic-demo removal rather than seeding speculative placeholder PDFs nothing references.
   Revisit once a real download (e.g. a brochure PDF) has an actual home on a page.
2. **`privacy`/`terms`/`legal-notice` and `product`/`security` routes are not `pages`-collection-driven
   yet.** F3 created the `pages` docs for all five slugs (seed/data layer), but
   `apps/techmirai-web/src/app/(frontend)/[locale]/{privacy,terms,legal-notice}/page.tsx` still
   render via the static `LegalPlaceholder` component, and `product`/`security` have no route file
   at all. Wiring these routes to query `pages` is Pack-3/Phase-G frontend work.
3. **Product-visual placeholders with no Spec size** (phone mockup, admin-panel screenshot,
   layered-answers diagram, sample assessment report — Spec §19) were deliberately not generated;
   see `docs/PLACEHOLDER-REGISTER.md`'s note after row F3-16.
4. **`site.config.ts`'s `seo.titleTemplate`/`defaultDescription`/`sitemapIncludeCollections` still
   read clinic content** (`さくら接骨院`/`Sakura Osteopathic Clinic`) even with `verticals.clinic`
   off — unrelated to the seed folder F3 touched, but a real leftover a launch-scan (`docs/WORK-ORDER.md`
   rule B1) will catch before go-live.

## 2026-10-07 — Pack-3/G2: QR-code generation already built, overlaps with Pack-4/N1's own scope

While planning G2 (homepage live-demo block, Spec §5.5), `docs/packs/PACK-4-FORMS-CHAT-LAUNCH.md`'s
N1 step ("Image slots, alt text, QR code") was found to also separately list "QR code" in its own
scope ("The QR code is generated from the demo URL in config"). G2 already implements this in
full: `apps/techmirai-web/src/lib/qr-code.ts`'s `generateQrCodeDataUrl()` (using the new `qrcode`
npm dependency) generates the live-demo block's QR code at render time in
`apps/techmirai-web/src/app/(frontend)/[locale]/page.tsx`, encoding
`siteConfig.integrations.demoUrl` fresh on every render — satisfying N1's own "the QR code is
generated from the config URL" wording, not just G2's. Flagging only, per standing rule 13:
whoever plans Pack-4/N1 should confirm the QR-code item there is already done (reusing this same
helper for any other page that needs it) rather than building a second QR-generation path.

## 2026-10-11 — Pack-3/I1: `/pricing` had the same static-stub-shadows-catch-all defect already fixed for `/how-it-works`/`/integrations`/`/ai-reception`

While verifying Gate 3 (every page returns 200 with real content), `/pricing`
returned 200 but rendered none of the seeded block content — only the
site-wide header/footer. Direct DB inspection confirmed the `pages` doc's
`layout` was correctly seeded (6 blocks, both locales). The actual cause:
`apps/techmirai-web/src/app/(frontend)/[locale]/pricing/page.tsx` was a
leftover static "Coming Soon" stub (`ComingSoonStub`) pre-dating I1, which
Next.js's file-based routing matches before the sibling
`[locale]/[slug]/page.tsx` catch-all ever runs — the exact defect shape
already documented and fixed in the 2026-10-08 Pack-3/H3 entry above for
`/how-it-works`/`/integrations`, and in H1's finding before that for
`/ai-reception`. `/security` had no such stub and rendered correctly from
the start.

Fixed the same way as those precedents: deleted
`apps/techmirai-web/src/app/(frontend)/[locale]/pricing/` outright, no
replacement needed, since the catch-all already handles the `pricing` slug
once seeded. Re-verified after the fix: `/pricing`, `/en/pricing` both
return 200 with the seeded content actually present (confirmed via direct
`fetch()`, not just status code).

This is the fourth page-group to hit this exact pattern (`/ai-reception`,
`/how-it-works`, `/integrations`, now `/pricing`) — worth a quick check of
remaining not-yet-built page-groups' stub directories before their own
content-seeding steps, rather than rediscovering this per page.

## 2026-10-11 — Pack-3/I1: Spec §9.1's "Pricing FAQ" cross-reference to Section 14 (F17/F18/F19) is inaccurate

Spec §9.1 labels its 3-row Pricing FAQ table "(also in Section 14: F17, F18,
F19)". Checked against Section 14's actual F01-F26 list (lines 1207-1209 of
`docs/_inputs/TechMirai Website — Full Content Spec (EN JA).md`): only F19's
question ("Is there a minimum contract period?") matches. The other two
rows directly under §9.1's heading — "How do I pay?" and "What if I stop
the service?" — do not exist anywhere in the stable F01-F26 list, which
§14's own intro says must stay fixed at 26 questions (reused by the
homepage and chatbot). F17 ("How much does it cost?") and F18 ("Are there
other costs?") are also not the same questions as §9.1's own payment/
cancellation rows — they're already covered elsewhere on `/pricing` (the
package card and the "Not included" table respectively).

Resolved per a plan-review judgment call (confirmed with Jamal via
AskUserQuestion before implementation): `/pricing`'s FAQ section renders
§9.1's own 3-row table as plain page content via the new `label-value-list`
block, not through the relationship-based `faq` block (which would have
required inventing new F27/28 ids, breaking the "stays fixed at 26"
constraint, or dropping two of the three rows). The cross-reference note
itself is treated as a stale/incorrect artifact of the Spec's authoring,
not corrected in the Spec file. See `docs/PLACEHOLDER-REGISTER.md` row I1-04.

## 2026-10-11 — Pack-3/I1: homepage §5.9 and `/pricing` §9.1 give different bracket wording for the same tax-note fact

Spec §5.9 (homepage `pricing-teaser`) gives the tax-note placeholder as
`[Tax wording]`; Spec §9.1 (`/pricing`'s own package card) gives the same
underlying fact as `[Wording from your accountant]`. Both are copied
verbatim per CLAUDE.md rule 5 rather than reconciled, since neither page's
instance is "wrong" — they're just two different bracket phrasings the
Spec itself uses for the same not-yet-provided fact. Flagged in
`docs/PLACEHOLDER-REGISTER.md` row F1-20 for whoever eventually fills in
the real wording to update both.

## 2026-10-11 — Pack-3/I1: `/security`'s "request limits" claim downgraded to `[CONFIRM]` after reading the booking API's rate limiter

The I1 step prompt itself flagged this as likely, given "project notes"
about an in-memory rate limiter — confirmed by reading the actual code
rather than assuming. `packages/cms-core/src/booking/api/rate-limit.ts`'s
own doc comment states its limiter is process-local only ("does not share
counts across serverless instances or horizontally-scaled processes"),
explicitly deferred to a future "WO-8 production hardening pass". The
contact-form limiter (`apps/techmirai-web/src/lib/rate-limit.ts`) upgrades
to an Upstash Redis-backed limiter when configured; the booking API's does
not have an equivalent fallback. Every other "Accurate answers"/"Bookings"
statement on `/security` was verified against real evidence and left as
the Spec states it (no double bookings: atomic slot-capacity claim in
`booking/api/reserve.ts`; private manage link: HMAC-derived, 30-day-TTL,
timing-safe-verified token in `booking/api/tokens.ts`; AI only from
published content: `reception/ai/prompt.ts`'s system prompt plus
`corpus.ts`'s AI-visible filter; automated-assistant label: site-wide
mandated tag in `reception/ui/ReceptionPanel.tsx`). Only the request-limits
bullet got a `[CONFIRM]` appended — see
`docs/PLACEHOLDER-REGISTER.md` row I1-06.

## 2026-10-12 — Pack-3/I2: `/about` had the same static-stub-shadows-the-catch-all defect (6th instance)

`apps/techmirai-web/src/app/(frontend)/[locale]/about/page.tsx` was a
static `ComingSoonStub` route that would have shadowed the dynamic
`[locale]/[slug]/page.tsx` catch-all exactly like the `/ai-reception`,
`/how-it-works`, `/integrations` and `/pricing` stubs before it — the 6th
instance of this pattern counting I1's own note that it was already the
4th. Deleted the stub file (confirmed clean/tracked via `git status`
first, recoverable via `git checkout --`). Unlike the earlier four cases,
only the `page.tsx` file was removed, not the whole `about/` directory —
`about/[slug]/page.tsx` is a separate, legitimate dynamic route for
`/about/*` sub-pages (driven by `apps/techmirai-web/src/lib/about-slugs.ts`'s
`ABOUT_PAGE_SLUGS`) and stays untouched. Given how consistently this exact
defect keeps recurring, it's probably worth a repo-wide one-time sweep for
any other `(frontend)/[locale]/<slug>/page.tsx` stub still shadowing the
catch-all, rather than continuing to discover them one Pack-3 step at a
time — not something I expanded this step's scope to do myself.

## 2026-10-12 — Pack-3/I2: chose `label-value-list` over the existing `company-profile` block for the Company profile table

`packages/cms-core/src/blocks/company-profile` is wired into the block
registry and `buildAvailableBlocks()` but has never actually been seeded
anywhere in this repo (confirmed via grep). Its row labels are a hardcoded
8-key EN/JA dictionary baked directly into `component.tsx` (companyName,
founded, ceo, address, capital, licenseNumber, headcount,
businessDescription), which doesn't match Spec §10.6's actual 10 rows
(trade name, representative, business form, established, address,
business, partner, main client, phone, email — Spec's own "Item (EN)" /
"項目 (JA)" columns). Rather than rewrite that hardcoded dictionary to fit
a different field set it was never designed for, `/about`'s Company
profile table reuses the I1 `label-value-list` block instead, whose
localized `label`+`detail` rows map onto Spec's own two columns directly.
`company-profile` is left as-is and still unused — a decision for whoever
eventually needs its photo/years-badge/CTA-button shape (which Spec §10.6
doesn't call for) to pick it up or remove it.

## 2026-10-12 — Pack-3/I2: pre-existing English glosses inside some `team` JA title fields (observation, not changed)

While reusing the `team` collection's existing JA `title` fields for
`/about`'s Team section, noticed several carry an English parenthetical
baked into the JA string itself — e.g. `代表 (representative)`, `共同創業
者 (co-founder)`, `営業・お客様窓口 (sales and client contact)` — whereas
Spec §5.11/§10.4 gives plain JA-only terms with no English gloss, and
Nahida's `エンジニア` has no gloss at all, making the pattern inconsistent
even within the same collection. These were seeded in Pack-3/G4, before
this step. Per CLAUDE.md rule 6 ("Japanese text is... never edited by the
developer or by ECC"), not changed here — flagging for Haruka's review
pass rather than fixing it myself.

## 2026-10-12 — Pack-3/I2: launch-scan's `B1_ALLOWED_SADIATEC_LOCATIONS` is still the original empty stub, now flagging both `/` and `/about`

Ran `launch-scan-pages.ts` against `/about` as due diligence (not itself one
of I2's "six common gates" — Appendix B's launch scan is a separate,
whole-project gate). `scripts/launch-scan-rules.mjs`'s own comment already
documents this: `B1_ALLOWED_SADIATEC_LOCATIONS = []` is "a stub — see note
above," left empty because "none of those pages exist in the repo yet,"
with an explicit instruction to "refine with real route/file patterns once
Pack-3/4 builds those pages." Both now exist — the homepage (Pack-3/G3-G4)
and `/about` (Pack-3/I2) legitimately name "Sadiatec" exactly where
`docs/WORK-ORDER.md` Appendix B1 says it's allowed — but the stub was never
filled in, so the scan flags every single mention on both pages (confirmed
via the raw JSON hit log: 1 hit on `/`, 2 on `/en`, 6 each on `/about` and
`/en/about`). Not something this step introduced — the homepage hits prove
it's been silently failing since G3/G4. Not fixed here: filling in the
real allow-list needs care (the function is shared between the rendered
pass, keyed on route paths like `/about`/`/en/about`, and the static
source-file pass in `preflight-check.mjs`, keyed on file paths like
`apps/techmirai-web/src/seed/pages/about.ts` — a correct fix likely needs
different matching logic for each, and Appendix B1 also names the
not-yet-built case-study/FAQ/chat-answer locations), and it isn't required
by I2's own Done-when list. Logging for whoever closes out the launch gate
before go-live (I3's case study and I4's FAQ will hit the same stub).

## 2026-10-12 — Pack-3/I3: the Voice stack is not just "changed recently" — there is no implementation at all

Spec §11.5's own note on the stack table says "CONFIRM the AI and voice
rows: your voice stack changed recently," which reads as if a previous
voice stack was swapped for a new one. The I3 truth-check (required by this
step's own prompt — every stack row must be proven from package.json/env
usage) found no Azure Speech code, no other speech-to-text/text-to-speech
code, and no voice-related env var anywhere in the repo. Every "AI受付
Voice" reference site-wide (`pages/pricing.ts`, `pages/integrations.ts`,
`blocks/product-edition/config.ts`) independently says "in development."
By contrast, the AI row's `[Groq — CONFIRM]` bracket, also kept per this
step's instruction, IS backed by a real implementation
(`GROQ_API_KEY` + `packages/cms-core/src/verticals/clinic/reception/ai/groq.ts`).
Not fixed here — both brackets are kept exactly as the Spec gives them
(docs/PLACEHOLDER-REGISTER.md I3-02/I3-03) — but worth flagging that the
Voice gap is "no stack exists yet," not "the stack recently changed."

## 2026-10-12 — Pack-3/I3: media storage (Cloudflare R2) is conditional, not unconditional

Spec §11.5 states "Media: Cloudflare R2" as a flat fact. Reading
`apps/techmirai-web/payload.config.ts` found the real behavior is
conditional: `s3Storage` is only wired up when all four
`CLOUDFLARE_R2_*` env vars are set; otherwise the code falls back to local
disk storage and logs a warning. The stack-table row still says "Cloudflare
R2" (not bracketed — the code path genuinely exists and is the intended
production configuration), but this nuance is recorded here rather than
silently treating "the code can do this" as "this is always active."

## 2026-10-12 — Pack-3/I3: `case-studies` collection's pre-existing fields don't fit the Sadiatec case study's shape

The `case-studies` collection (`packages/cms-core/src/verticals/recruitment/
collections/case-studies.ts`) was built for a single-metric testimonial
card (`metricValue`/`metricCaption`, numeric `results[]`, `challenge`/
`solution`/`outcome` richText) — a recruitment-vertical shape reused
generically. Spec §13's Sadiatec case study has a different structure (an
at-a-glance table, before/what-we-built/what-it-means lists, an empty
client-comment slot) and explicitly bans inventing metrics for this page.
Rather than force content into the existing fields, Pack-3/I3 added one
additive `layout` blocks field (reusing `page-hero`/`label-value-list`/
`security-points`/`cta-banner`, the same block types already used on
`pages.layout` elsewhere) and left the metric-shaped fields unset. No
existing field, type or row was changed — the collection had zero seeded
docs before this step. Flagging in case a future case study (a second
client, if ever added) is better served by picking one shape consistently
rather than every case study choosing block-vs-field for itself.

## 2026-10-12 — Pack-3/I3: a `payload.find()` call's full result can reach the HTTP response even when never rendered into JSX

While verifying the case-study route actually keeps Sadiatec content hidden
(gate: `visible: false`), curling the raw HTML of `/case-studies/sadiatec`
found the FULL Sadiatec doc (title, clientName, every `layout` block's text)
embedded in a Next.js RSC flight chunk (`self.__next_f.push([1,"<id>:{"docs":
[...]}"])`), even though the only thing actually rendered on the page was
`ComingSoonStub` — the `doc` value returned by `findVisibleCaseStudy()` was
awaited, checked, and discarded (`return null`) without ever touching JSX.

Comparing against `/about`'s raw HTML confirmed this isn't new or specific
to this route: `/about`'s own flight output embeds the exact same shape of
orphaned chunk, holding `/about`'s own `pages` doc (id 12, title "会社紹介")
— i.e., every page on this site that calls `payload.find()` from an async
Server Component page/metadata function appears to get that call's full
result embedded in the response as an unreferenced flight chunk, regardless
of whether the result is actually rendered. For `/about` this is harmless
by coincidence (the embedded doc is exactly what's already public on that
page). It would NOT be harmless for any page gating not-yet-public content
behind a runtime check in application code rather than at the query level.

Not fixed site-wide here — that would mean auditing every `payload.find()`
call across the catch-all and every dedicated route, well beyond I3's
scope. Fixed only where it mattered for this step:
`[locale]/case-studies/sadiatec/page.tsx` now does a `select`-limited
`{ visible }`-only lookup first, and only runs the full-content
`payload.find()` if that comes back `true` — so while `visible` is false,
the only thing that could ever be serialized anywhere is `{ visible: false }`,
never the gated content. Flagging for whoever next builds a page with a
runtime (not query-level) visibility gate — the founder-visibility switch
in the `[locale]/[slug]/page.tsx` catch-all (Pack-3/I2) likely has the same
exposure, since it also fetches `company-info` unconditionally and only
filters blocks afterward in JS, not in the query.

## 2026-10-12 — Pack-3/I3: `/technology` had the same static-stub-shadows-catch-all defect already fixed for `/how-it-works`/`/integrations`

After seeding `/technology`'s real content and confirming the seed log
reported success, the rendered page still showed only the bare page title
("Technology"/"AI開発"), none of the seeded hero/stack-table content. Cause:
`apps/techmirai-web/src/app/(frontend)/[locale]/technology/page.tsx` was a
leftover static `ComingSoonStub` route, intercepting `/technology` before
the dynamic `[locale]/[slug]/page.tsx` catch-all (which reads `pages.layout`
from the database) ever ran — the exact same defect documented in this
file's 2026-10-08 entry for `/ai-reception`/`/how-it-works`/`/integrations`.
Spec §11 has no sub-routes under `/technology`, so the same fix applies:
the stub directory was deleted outright, with no replacement file, letting
the catch-all serve it. Not caught earlier because I3 is the first step to
seed real content for this slug — the stub rendered "successfully" (200,
plausible-looking page) the whole time, which is exactly why this class of
bug is easy to miss without comparing rendered content against the seeded
data, not just the HTTP status code. Flagging in case any other
not-yet-built Pack-3/4 slug (case-study was checked and does NOT have this
problem — it already uses a dedicated route, not a stub+catch-all pair)
still has its own leftover stub.
