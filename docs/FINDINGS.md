# Findings

## 2026-10-28 — /demo: the new "Demo Call" link to an external live AI call site sits beside notice text that says the demo never opens the microphone

The `/demo` consent notice says "It does not open your microphone and it records nothing from you", and the page keeps a disabled "Live AI call (integration required)" placeholder. The "Demo Call" button on the Reservation/ Booking scenario now opens `techmirai-voice-premium.vercel.app/talk/sakura-seikotsuin/{en,ja}` in a new tab. That site is outside this repo and may use the microphone and record the call. The notice wording, the disabled placeholder and the link now disagree. Not changed: the notice text is Spec-governed. Owner to decide whether to reword the notice (and the [TBD] retention fields in V1-03) or to remove the placeholder.

Also noted: `voice-pages.ts` has an unused `row` helper (TypeScript 6133 warning), present before this work.

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

## 2026-10-12 — Pack-3/I4: `/thanks` omits the Spec's booking-call CTA (confirmed Spec deviation)

Spec §12.3's thank-you body reads "Want to talk sooner? Book a 30-minute
call below or message us on LINE." Consultation booking is Pack 4/J2 scope
and doesn't exist yet, and this page is explicitly generic/reusable for any
form's success redirect, not specific to the assessment flow that section
was written for. Per the confirmed I4 plan review, only the clause
"Book a 30-minute call below or " is removed (the rest of the sentence,
both `[1 business day]`/`[3 business days]` brackets, and every other word
are unchanged) rather than inventing a booking URL or building booking
functionality prematurely. Whoever builds Pack 4/J2 should revisit this
page once a real booking destination exists — restoring the full sentence
with a working button is the natural follow-up, not a new decision.

## 2026-10-12 — Pack-3/I1-I3 pages never set `meta.title`/`meta.description`/`aiVisible` from their own content

While building `/thanks`'s seed file (the first one that needs to set
`meta.noindex`/`aiVisible` correctly, per Spec), checked whether any prior
page seed file (`pricing.ts`, `security.ts`, `about.ts`, `technology.ts`,
...) ever touches `meta` or `aiVisible` — none do. Every one of those pages
still carries whatever `plain-pages.ts`'s initial shell wrote: `meta.title`/
`meta.description` as the literal placeholder `[TBD: Spec <Page> page title
not yet seeded]` (visible as the actual `<title>` tag and meta description
on the live page, not just an admin-only field), and `aiVisible` at its
schema default of `true` (meaning every one of those pages is currently
included in the AI chat corpus, whether or not that's actually correct for
each). Not fixed here — out of scope for I4, and each page's correct
`meta`/`aiVisible` values are a judgment call for whoever owns that page,
not something to batch-guess. Flagging for a future pass (likely best done
right before the whole-site launch-scan sweep) to give every built page
real `meta.title`/`meta.description` and a deliberate `aiVisible` value
instead of the shell's placeholder.

## 2026-10-12 — Pack-4/J1: `/contact` is still substantially clinic-demo content (observation, not fixed)

While using `/contact/page.tsx` and its `_components/ContactForm.tsx` as the
architectural precedent for `/assessment` (both are hand-built dedicated
routes, not the generic catch-all), found that `/contact` itself is still
heavily clinic-demo-flavored despite being logged elsewhere as "already a
real, built page": its `inquiryType` options are clinic-specific ("About
Your First Visit", "Traffic Accident Treatment"), its hero CTA reads "About
the Clinic" linking to `/company` (a route that doesn't appear in this
site's Spec), it renders a multi-office grid with さくら接骨院 Japanese copy
and clinic-style fields (`legalName`, `nearestStations`), and it imports via
`getPayloadHMR`/`@payload-config`, an inconsistent style versus the
`getCachedPayload` convention every other recently-built page uses. Not
touched here — out of Pack-4/J1's scope (J1 is `/assessment` only) — but
flagging clearly since this is a real content-accuracy gap, not just a
style inconsistency, for whoever next works on `/contact`.

## 2026-10-12 — Pack-4/J1: `ContactForm.tsx`'s honeypot field is never rendered (observation, not fixed)

`/api/forms/[type]/route.ts`'s `hasHoneypot()` check reads a `_hp` field
from the submitted body, and `contactSchema` declares it — but
`ContactForm.tsx` never renders a hidden `_hp` input anywhere in its JSX, so
a bot that fills in every visible field (or scrapes the raw form markup for
inputs) would never trip it; this protection is effectively inert on the
real `/contact` form today. `/assessment`'s new `AssessmentForm.tsx` does
render one. Not fixed on `ContactForm.tsx` — out of J1's scope.

## 2026-10-12 — Pack-4/J1: `CONTACT_NOTIFICATION_EMAIL` is documented but never read by any code (observation, not fixed)

`.env.example` and `docs/DEPLOY-NEW-CLIENT.md` both document setting
`CONTACT_NOTIFICATION_EMAIL`, but no code anywhere reads that environment
variable — the real wiring for staff-notification recipients is
`site.config.ts`'s `forms.*Recipient` values, read directly by
`config-factory.ts`. A developer following `DEPLOY-NEW-CLIENT.md`'s own
instructions to "Set `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`"
would set an env var that has no effect. Not fixed here — out of J1's
scope — but worth reconciling in whichever step next touches the forms
email configuration.

## 2026-10-12 — Pack-4/J1: two parallel Resend-calling implementations exist side by side (observation, not fixed)

The forms pipeline (`packages/cms-core/src/payload/hooks/send-form-emails.ts`)
calls the Resend HTTP API directly via a raw `fetch()` in its own `dispatch()`
helper. The booking/notifications system (`packages/cms-core/src/notifications/
channels/email-resend.ts`) uses the typed `resend` SDK (`Resend.emails.send()`)
through the shared `NotificationChannel` abstraction. Both reach the same
Resend account, but neither shares code, retry/error handling, or logging
conventions with the other. `/assessment`'s new email logic extends the
forms pipeline's existing `dispatch()`, per J1's explicit "reuse the
existing forms pipeline" instruction — not consolidating the two systems,
which would be a much larger, unrelated change. Flagging in case a future
step wants one shared email-sending implementation.

## 2026-10-12 — Pack-4/J2: consultation booking — what was and was not done

Implemented the D2-independent scope (Spec §12.4): `company` + locale-dependent kana in
`booking/api/schemas.ts` / `reserve.ts` / `ContactFormStep` / `ConfirmationStep`; Spec labels in
`apps/techmirai-web/src/messages/{en,ja}.json`; the four email templates carrying the Spec sentences;
staff recipient `info@techmirai-ai.com`; the 4-service / 1-demo-resource seed (`visit` inactive); and the
production meeting-tool guard (`booking.meetingToolConfirmed`, default `false`; see register J2-01).
Open items, none of them resolved by guessing:

- **D2 (time zone) — real bug; FIXED later the same day, see the follow-up entry below.** Every booking screen and email formats times with
  `timeZone: 'UTC'` (`CalendarStep`, `ConfirmationStep`, `SuccessStep`, `ManageAppointmentView`,
  `LineManagePicker`, `notifications/templates/shared.ts`). The seed stores true JST instants (9:00 JST =
  00:00 UTC), so they display as 00:00, and the Spec's "(JST)" is not yet true. Needs Jamal's decision
  before an engine fix is logged in `ENGINE-FIXES.md` (standing rule 11).
- **D3 — the engine ignores service duration.** `create-booking.ts` claims one unit of capacity on one
  `slotId`; `duration_min` is never read. The 60-minute `visit` is therefore seeded inactive.
- **Booking seed: run successfully on 2026-10-12, after the remote database was confirmed to be a
  development database.** `apps/techmirai-web/.env.local` points at a *remote* Postgres; nothing in the repo
  says whether that is dev or production, so the seed was held until that was confirmed and its run approved.
  Verified before/after with read-only queries and the public API:
  - Before: 5 clinic services and 5 clinic resources, all active; 780 future slots.
  - The seed's own log: 10 legacy clinic rows deactivated, 4 services ready, 1 demo resource, 180 demo
    open slots over the next 14 days.
  - After: the five legacy clinic services (ids 1–5) and five clinic resources (ids 1–5) are
    **deactivated, not deleted**. Active: "Free online consultation" / 無料オンライン相談,
    "Live demo walkthrough" / デモのご案内, "AI受付 Voice demo" / AI受付（電話）のデモ (30 min each), and the
    resource `[Demo resource — CONFIRM]`. The `visit` service exists but is inactive (D3). Future slots
    total 180, all on the demo resource.
  - `GET /api/v1/booking/services?locale=en|ja` now returns exactly those three active services, and
    `/api/v1/booking/availability` returns open slots for the demo resource (first slot of the first date
    checked: `2026-10-14T00:00:00Z`, i.e. 9:00 JST stored; it still displays as 00:00 until D2 is resolved).
  - Still not tested: a full booking, reschedule and cancel against this data, and staff-email delivery.
- **`pnpm seed:booking` does not work on this Windows machine (observed; fix not applied).**
  - `pnpm --filter techmirai-web seed:booking` fails immediately with `'NODE_OPTIONS' is not recognized as an
    internal or external command`: the script is `NODE_OPTIONS="..." tsx ...`, and pnpm runs it through `cmd`.
    Nothing was executed.
  - Running the same command through Git Bash (`NODE_OPTIONS=... npx tsx --env-file=.env.local
    src/seed/booking.ts`) exits 0 but prints no log lines and changes no data (confirmed by the services API
    still returning the clinic services afterwards). The likely cause, not separately verified, is the
    "run only when executed directly" guard at the bottom of `src/seed/booking.ts`
    (`import.meta.url === \`file://${process.argv[1]}\``), which cannot match a Windows path.
  - An inline `tsx -e "..."` script that dynamically imported the app's `payload.config` also exited 0
    silently without seeding; the cause was not investigated.
  - **Workaround used (nothing in the repo changed):** a throwaway script kept outside the repo (in the
    session scratchpad, not committed) that resolves `payload` from `apps/techmirai-web`, loads
    `payload.config.ts`, and calls the repo's exported `seedBooking(payload)` unchanged, run as
    `NODE_OPTIONS="--require ./fix-next-env-interop.cjs" npx tsx --env-file=.env.local <script> seed`
    from `apps/techmirai-web`. It also has a read-only `check` mode that lists services, resources and the
    future-slot count. A later step could make the script cross-platform (e.g. `cross-env`) and the
    direct-run guard path-safe; that is a separate change.
- **Residual clinic / wrong-language text on the rendered `/en/booking` page.** The HTML still contained
  "clinic" (25×) and 初診 (2×) on the English page, and 初診 / 診療 on the Japanese one. The booking
  components and messages are clean (grep); the source was not traced. The likely causes are outside J2: the
  site-wide reception chat widget (K1/K2 replace the clinic flow) and clinic-leftover values in
  `site.config.ts` (`seo.titleTemplate`, `seo.defaultDescription`, and the `/booking` page metadata
  description, which interpolates `siteConfig.site.name`). Gate 4 is therefore not demonstrated for `/en/booking`.
- **Tests.** Unit: `@techmirai/cms-core` 57 files / 657 tests pass; `@techmirai/reception-engine` 40 pass;
  `pnpm typecheck` passes in all 3 packages. The integration suites (`reserve.integration.test.ts` incl. the one
  new company/no-kana case, `booking-notifications.integration.test.ts`) did NOT run: `psql` is not installed
  here (same gap as the 2026-10-05 F2 entry). `e2e/booking-journey.spec.ts` needed its expectations updated
  for the new Spec strings (it mocks the booking API) and passes 2/2. The root `package.json` has no `test` or
  `lint` script, and `techmirai-web` has no unit-test script — tests run per package.
- **Not done / out of J2:** `/thanks` still omits "Book a 30-minute call below or" (FINDINGS 2026-10-12 I4;
  needs a real destination and the K2 chat button). `SuccessStep`'s booking card does not show the company
  (only `ConfirmationStep` does). LINE booking stays off: `NEXT_PUBLIC_LIFF_ID` is blank in `.env.example`;
  `.env.local` was not inspected for it (it was parsed once, only to classify the database host as remote;
  no value was printed). The `packages/cms-core/src/i18n/messages/*.json` engine defaults and
  `VisitTypeStep`'s doc comment still carry clinic wording, but the app loads only its own `messages/`.

## 2026-10-12 — Pack-4/J2 follow-up: Jamal's decisions applied

Applied (approved by Jamal), nothing else:

- **D2 / A2 — Asia/Tokyo display, implemented as a separate engine change.** New `booking/time-zone.ts`
  (`BOOKING_TIME_ZONE`, `BOOKING_UTC_OFFSET`, `toBookingDate`, `toBookingTime`). Used by: availability
  grouping and range filter (`booking/api/availability.ts` — slots are now grouped under their Tokyo date),
  the calendar row times (`calendar-matrix.ts`), `ConfirmationStep`, `SuccessStep`, `ManageAppointmentView`,
  `LineManagePicker` and the email formatters in `notifications/templates/shared.ts`. Date-only week labels in
  `CalendarStep` / `ManageAppointmentView` correctly stay `timeZone: 'UTC'` (they format date-only values, not
  instants). Stored instants are unchanged. **Stored instants verified read-only** against the development
  database: 180 future slots, start times 09:00–17:30 JST (last slot ends 18:00), Monday–Friday only, 36 per
  weekday, all on one resource. **Not verified:** the calendar and emails as rendered for a real booking, and
  the new availability integration case (no `psql`). Times must not be called correct until that is done.
  Known minor gap, left alone: the "can't go to a past week" guard still derives "today" from the UTC date, so
  between 00:00 and 09:00 JST it is a day behind.
- **Reminder timing (A2) — left open on purpose** (`[CHOOSE …]`, register J2-09). `reminder-schedule.ts` only got
  a comment update.
- **B1 headings applied** (en + ja, plus the e2e spec). **A4:** the seed now creates one shared "TechMirai"
  resource and retires the first-run `[Demo resource — CONFIRM]` one. **(Superseded: the seed WAS re-run later the same day — see the next entry.) At this point the seed had NOT been re-run**, so the
  development database still has the old resource (id 6, 180 slots) and no "TechMirai" resource; re-running
  needs Jamal's separate approval. All seeded slots are demo availability — real availability is a launch blocker.
- **A1 — NOT fully applied.** The tool is not chosen. The supplied Japanese sentence was not applied because it
  duplicates the Spec's own JA sentence and 「ご予約前に」 means "before booking" (details in register J2-01).
  The production confirmation guard remains enabled.
- **C1 — Japanese drafts are in register J2-10 for review only**; `ja.json` still has `[JA TODO]` (CLAUDE.md rule 6).
- **A3** `visit` stays inactive; **A5** staff inbox still `[CONFIRM …]`, Resend domain verification is Jamal's.

Dependencies tracked (not changed):

- **SEO source of the clinic / Japanese text on English pages:** `apps/techmirai-web/site.config.ts` `seo.titleTemplate`
  (`'%s | さくら接骨院 Sakura Osteopathic Clinic'`) and `seo.defaultDescription` (clinic copy, en + ja). Because
  the template wraps every page title, an English page's `<title>` carries Japanese and the word "Clinic"
  (Gate 4). The CMS `seo-defaults` global (`payload/globals/seo-defaults.ts`) has the same localized fields;
  whether it is seeded from this config was not checked. The frontend layout also mounts the reception chat
  widget with `siteConfig.reception.clinicPhone` / `site.name`; its clinic flow is replaced in **K1/K2**. The
  exact split of the ~25 "clinic" and 2 初診 hits on `/en/booking` between these two sources was not measured.
- **`/thanks` booking call-to-action** stays omitted; restoring it is tracked under **K2**.

Validation for this change: `pnpm typecheck` passes (3 packages); `@techmirai/cms-core` unit tests 58 files / 663
tests pass (including the new `time-zone.test.ts`, the guard tests and the +9h display expectations);
`e2e/booking-journey.spec.ts` passes 2/2 after the visit-type heading change (it mocks the booking API).
**Not run:** the integration suites (no `psql`) and `e2e/manage-appointment.spec.ts` (its mock slot is 03:00Z; not
checked for time-label assertions). No real booking, reschedule or cancel was run and no email was sent.

## 2026-10-12 — Pack-4/J2 follow-up 2: dev-only staff-email override, seed re-run, A1/A2 decisions

**Decisions applied (Jamal):** A1 tool = Google Meet (staff create and email the link manually); the existing Spec
Japanese sentence is kept and not duplicated; `meetingToolConfirmed` stays `false`, so production still withholds
every customer confirmation (register J2-01). A3 `visit` stays inactive. A4 one shared "TechMirai" resource. A5 staff
inbox monitoring is still OPEN. C1 unreviewed Japanese stays out of shipped copy (drafts only in register J2-10).

**A2 reminder timing (24 h before) — NOT implemented, exact gap in register J2-09.** The only scheduler is one daily
Vercel cron (`vercel.json`: `0 0 * * *`). A reminder due at T−24h is only sent at the next 00:00 UTC run, 0–24 h late, so
"24 hours before" cannot be honoured without an at-least-hourly scheduler (a plan/service decision for Jamal) plus
`scheduledFor = scheduledAt − 24h`. Today's behaviour (day-before 00:00 UTC = 09:00 JST) is exactly 24 h before only for
a 09:00 JST appointment (~32.5 h for 17:30 JST). Reminders have never been sent or tested end to end; they must not be
described as working or as "24 hours before".

**Development-only staff-recipient override (new, register J2-11).** `notifications/staff-recipient.ts`
(`resolveStaffRecipient`, pure, unit-tested) is wired in `apps/techmirai-web/src/lib/notifications.ts`. Only when
`NODE_ENV === 'development'` is `DEV_STAFF_NOTIFICATION_RECIPIENT` used; without a valid value (empty, malformed, or equal to
the real inbox) staff booking emails are **withheld entirely** — the real `info@techmirai-ai.com` is never used in
development. Outside development the override is ignored. `NotificationRuntimeConfig.staffRecipient` is now
`string | null`; `service.ts` skips only the staff step (the cancelled path still voids the pending reminder) and logs a
note that never contains an address. The variable is documented, empty, in `.env.example`. **Limits:** it covers booking
staff mail only — the `/assessment` and contact forms use their own configured inboxes. The Resend account-owner address was
not used or set, because the key and sending mode are unverified (see below).

**Environment verification before seeding (nothing sensitive printed).** `.env.local`: `DATABASE_URI` set and remote
Postgres; `NEXT_PUBLIC_SERVER_URL` is localhost; **`RESEND_API_KEY` is not set** (so this environment cannot send email);
`CRON_SECRET` and `DEV_STAFF_NOTIFICATION_RECIPIENT` are not set; the configured sender is `onboarding@resend.dev`
(Resend's sandbox sender, delivering only to the account owner). The database host/name carries **no** dev/prod/staging
marker, so naming alone cannot identify it. Content evidence: 0 appointments, 0 customers, 0 notifications; 2 form
submissions, both from this session's J1 tests; oldest rows 2026-10-06. Together with Jamal's explicit confirmation earlier in
this session that it is a development database, the seed was run; the config-only check was inconclusive on its own.

**Seed re-run (dev DB), verified read-only.** Log: 11 legacy rows deactivated (5 clinic services, 5 clinic
resources, the first-run placeholder resource), 4 services ready, 1 resource "TechMirai", 180 demo slots. After: services
6/7/8 active (Free online consultation, Live demo walkthrough, AI受付 Voice demo), `visit` (id 9) and the 5 clinic services
inactive; resources: "TechMirai" (id 7) active, the 6 older ones inactive and **kept, not deleted**; 180 future slots, all on
"TechMirai", 09:00–17:30 JST starts, Monday–Friday only (36 per weekday). Data was not hand-deleted; the seed's normal
refresh removed the old placeholder resource's unbooked future slots.

**Windows seed issue (still present).** `pnpm seed:booking` fails on this machine (`'NODE_OPTIONS' is not recognized…` —
pnpm runs it through `cmd`), and the same command in Git Bash exits 0 doing nothing, probably because of the
direct-run guard in `seed/booking.ts` (unverified). No supported run path works here, so a throwaway script kept outside the
repo (session scratchpad) calls the unchanged exported `seedBooking()`; an inline `tsx -e` attempt also exited silently. A
cross-platform fix (e.g. `cross-env` + a path-safe guard) is a separate change, not made.

**Tests.** `pnpm typecheck` passes (3 packages). `@techmirai/cms-core` unit tests: 59 files / 672 tests pass (new:
`staff-recipient.test.ts`, three withheld-staff cases in `service.test.ts`). Playwright against a warmed dev server, API fully
mocked, no Resend key: `booking-journey.spec.ts` 2/2 passed; `manage-appointment.spec.ts` 3/4 passed. An earlier attempt on a
cold server failed 4 tests with click interception by the site's full-screen overlay and a page-load timeout; the final run used
a longer command-line timeout (`--timeout=90000`, no test changed). **The one remaining failure is pre-existing and unrelated:**
`manage-appointment.spec.ts` "shows the clinic phone number…" asserts `+81-3-5432-1188`, but the committed
`site.config.ts` phone is the placeholder `[080-7701-3004]` (register F1-01); both files are unchanged by J2. Left as is — it
needs a decision on the expected value. Integration suites still did not run (no `psql`).

**No real-world effect.** After the e2e runs the database still has 0 appointments, 0 customers and 0 notifications; no email
was sent (no Resend key) and no real booking, reschedule or cancellation was performed.

**Still not verified (do not report as passed):** rendered times on a real booking's screens and emails; any rendered email;
staff-email delivery to the override address; reminders end to end; the Google Meet workflow and wording; Resend key mode.
**Remaining blockers:** meeting workflow/copy verification (then flip `meetingToolConfirmed`); Jamal's answers on the English
Google Meet sentence and the JA bracket line; real availability instead of demo slots; Resend domain/key and staff-inbox
monitoring (A5); an at-least-hourly scheduler for the 24 h reminder; `visit` facts (area, staff, duration); approval of the
Japanese drafts (J2-10); K1/K2 clinic wording and the SEO title template; the stale phone assertion (fixed in the final-review entry below).

## 2026-10-13 — Pack-4/J2 final review: security review and regression fixes

Reviewed the whole J2 diff (44 modified + 4 new files): every file is inside J2 scope; no unrelated edits; the only env
file touched is `.env.example` (one empty, commented variable). Findings and what was done:

**Fixed**
- **Meeting-tool guard failed open (HIGH).** It withheld customer confirmations only when `NODE_ENV === 'production'`, so any
  other value (`test`, `staging`, unset) would have sent confirmations carrying the unresolved placeholder. Now fail closed:
  `NotificationRuntimeConfig.isProduction` became `isLocalDevelopment` (`NODE_ENV === 'development'` only), and the
  confirmation is withheld whenever `!meetingToolConfirmed && !isLocalDevelopment`. Tests updated accordingly.
- **Staff-recipient override plus-alias hole (MEDIUM).** `info+test@techmirai-ai.com` differs from the real inbox as a string
  but is delivered to the same mailbox, so the equality check missed it. The comparison now strips `+tag` from the local part
  (case-insensitive); multi-address values were already rejected. Tests added, including that a *different* address on the same
  domain is still allowed.
- **Availability query**: the date-range bounds are now converted to UTC ISO strings instead of passing a `+09:00` literal to the
  database layer (behaviour identical, format as before). Read-only check against the seeded dev data: 5 weekdays × 18 slots, first
  slot `…T00:00:00.000Z` = 09:00 JST, all on resource 7.
- **Stale e2e phone assertion** (`manage-appointment.spec.ts`): it hard-coded the old clinic number `+81-3-5432-1188`. It now reads
  `siteConfig.contact.phone` (today the approved placeholder, F1-01) and is scoped to the cutoff message because the number also
  appears in the footer. No contact detail was invented. `manage-appointment.spec.ts` 4/4 and `booking-journey.spec.ts` 2/2 pass
  against a warmed dev server with the API mocked. In one combined run the two reschedule tests failed while the page was still
  "Loading your appointment…" (dev-mode hydration timing); they passed on a re-run — treat these two as timing-sensitive in dev.

**Override verified (NODE_ENV, fail-closed):** active only when `NODE_ENV === 'development'`; missing, blank, malformed,
multi-address, equal-to-real-inbox or alias-of-real-inbox values all withhold staff booking email entirely; outside development
the variable is ignored, so it cannot act as a production override. It lives in `.env.local` only (the `.env.example` entry is
empty). Residual limits, unchanged: it covers booking staff mail only (the `/assessment` and contact forms use their own inboxes);
a bare `tsx` script that calls the notify functions with `NODE_ENV` unset would use the configured inbox — none exists today.

**Findings left for a decision (not changed)**
- **(RESOLVED 2026-10-13 — see the "customer email fail-closed policy" entry below.) Reminders and cancellations still go to real customers in production while the confirmation is withheld.** Neither contains the
  placeholder, so they do not break Jamal's rule, but a customer could get a reminder for a booking they were never confirmed.
  Recommend also withholding the reminder under the same guard; needs Jamal's OK because an earlier test asserts the reminder is
  still queued.
- **Development customer emails go to whatever address is typed in the form.** Today only the missing `RESEND_API_KEY` (and the
  sandbox sender) prevents a real send; there is no code-level dev guard for customer mail.
- **Resend key mode is unverified** (and the key is absent from the dev `.env.local`).

**Windows seed failure — root cause confirmed, nothing changed.** Two independent faults: (1) the `seed:booking` script starts with a
POSIX `NODE_OPTIONS="…"` prefix, which `cmd` (pnpm's script shell) rejects; (2) the "run only when executed directly" guard in
`seed/booking.ts` compares `import.meta.url` with `` `file://${process.argv[1]}` ``. A scratch check under `tsx` showed
`import.meta.url = file:///C:/…` against `argv[1] = C:\…`, so it is **false** on Windows while a `pathToFileURL(argv[1]).href`
comparison is **true** — hence exit 0 with no work. `cross-env` is not installed. Proposed fix, not applied (seed scripts were off
limits): make the guard path-safe with `pathToFileURL`, and drop the inline env prefix with `tsx --require
./fix-next-env-interop.cjs --env-file=.env.local …` (unverified). The seed was not re-run in this step.

**24-hour reminder scheduler gap — documented only** (register J2-09; above): one daily 00:00 UTC Vercel cron, so a reminder due at
T−24h is sent up to 24 h late; no scheduler was added and no email was sent.

**Validation.** `pnpm typecheck` passes (3 packages). `@techmirai/cms-core` 59 files / 675 tests pass; `@techmirai/reception-engine` 40
pass. Playwright (API mocked, no Resend key, no real actions): `booking-journey` 2/2, `manage-appointment` 4/4. Integration suites did
not run (no `psql`). **Not verified:** rendered times/emails for a real booking, staff-email delivery, reminders end to end, the Google
Meet workflow, Resend key mode.

## 2026-10-13 — Pack-4/J2: customer email fail-closed policy (confirmation, reminder, cancellation)

**Decision (Jamal):** withhold customer booking confirmations, reminders and cancellation emails unless
`NODE_ENV === 'development'`; staging, test, unset or any other value must not send them; booking, reschedule and
cancellation *data* operations must not be changed just to suppress email; reminders stay disabled until the 24-hour
scheduler exists and is verified.

**Paths inspected — each customer path is guarded on its own.** A guard on the confirmation did NOT cover the others:
before this change the reminder was queued `pending` and later sent by the cron, and the cancellation email was sent
immediately, in production.

| Path | Where | Before | Now (outside local development) |
|---|---|---|---|
| Confirmation (incl. reschedule), email and LINE copy | `notifications/service.ts` `notifyBookingCreated` | withheld only while `meetingToolConfirmed=false` | withheld regardless of `meetingToolConfirmed`; `skipped` audit row, no content |
| Reminder | same, reminder step | queued `pending`, sent by the cron | not queued; `skipped` audit row, no content |
| Cancellation | `sendCustomerCancellationNotification` | sent immediately | not sent; `skipped` audit row, no content |
| Cron batch (reminders, retries) | `apps/techmirai-web/src/app/api/cron/notifications/route.ts` | sent every due row | customer rows are marked `skipped`, only `staff-*` rows are sent; unknown/absent template key counts as customer (fail closed) |

The single decision lives in `notifications/customer-send-policy.ts` (`isLocalDevelopmentEnv`, `customerEmailsAllowed`,
`partitionDueNotifications`, `markNotificationsWithheld`). The due-notifications query now also selects `template_key`
so the cron can tell customer rows from staff rows. Staff booking emails are unaffected by this policy (they have their own
dev-only override, J2-11) and the staff email still says when the customer confirmation was not sent. Data operations are
untouched: a booking, reschedule or cancellation still happens and still notifies staff; only the customer email is withheld.
There is intentionally no env variable or config flag to re-enable it.

**Tests.** `customer-send-policy.test.ts` (env table: production, staging, test, preview, unset, empty, wrong-case and
padded values are all blocked; only exact `development` is allowed; partition and mark-skipped behaviour);
`service.test.ts` runs the full create + cancel flow for each of production, staging, test, unset, `""`, `Development`,
`DEVELOPMENT` (nothing reaches the customer; only the two staff emails are dispatched; confirmation, reminder and
cancellation are each `skipped` with no content) and for `development` (unchanged: confirmation and cancellation sent,
reminder queued `pending` and never sent immediately). The earlier tests that expected the reminder to be queued in
production and a confirmed meeting tool to re-open the gate were rewritten. `due-notifications.test.ts` covers the new
`templateKey` mapping. `integration-tests-no-real-email.test.ts` statically fails if any notification integration test
ever imports Resend/LINE channels, builds the real dispatcher, reads a provider credential or calls `fetch`; today they
use only `vi.fn` fake dispatchers.

**Validation.** `pnpm typecheck` passes (3 packages); `@techmirai/cms-core` 61 files / 709 tests pass;
`@techmirai/reception-engine` 40 pass. E2E was not re-run: nothing it covers (mocked booking/manage UI) changed. Integration
suites still do not run here (no `psql`).

**Not covered by this policy (unchanged, out of scope):** form auto-replies to submitters (`payload/hooks/send-form-emails.ts`,
e.g. the `/assessment` confirmation) and LINE webhook replies (LINE booking is off). `meetingToolConfirmed` stays `false`.
Open launch blockers are unchanged: meeting workflow/copy verification, Resend key mode and domain, staff-inbox monitoring,
Japanese draft approval (J2-10), real availability instead of demo slots, the 24-hour reminder scheduler, the `visit` facts,
K1/K2 clinic wording and the SEO title template.

## 2026-10-13 — Pack-4/J2 batch 1: meeting-tool copy, reminder timing, `visit` deferral

Applied exactly the approved scope (Jamal): D-2, C-1, D-4 Option B, D-5. `meetingToolConfirmed` stays `false`; customer email stays fail-closed (J2-12); no email was sent, no database was written, nothing was committed.

- **D-2 / C-1.** `notifications/templates/customer-confirmation.ts`: the Japanese bracket line is gone (the JA email keeps the Spec sentence 面談用のURLは、事前にメールでお送りします。 and never names a tool). English: with the flag `false` the Spec sentence plus the literal `[Meeting tool — CONFIRM: …]` line (unchanged); with the flag `true` the approved sentence "We will send the Google Meet link by email before the call." and no bracket. Tests updated and extended; none deleted or weakened. Register J2-01 updated.
- **D-4 Option B.** `reminder-schedule.ts` now takes the day before on the Tokyo calendar (`toBookingDate`), at 00:00 UTC = about 09:00 JST via the existing daily cron. It is not an exact 24-hour reminder; no paid plan or external scheduler. Previously the UTC calendar day was used (same result for 09:00–17:30 JST slots, wrong for an early-morning JST appointment). Comments in `reminder-schedule.ts`, `site.config.ts`, the cron route and `customer-send-policy.ts` rewritten. Register J2-09 and J2-12 updated. Reminders remain withheld outside local development and have never been observed end to end.
- **D-5.** `visit` stays inactive (already seeded so; register J2-02 now DEFERRED). No public in-person claim exists in the app code. The Spec's FAQ F25 and the chat answer F25 ("In-person visits: [area — CONFIRM]") must be omitted or kept bracketed by Pack-3/I4 (FAQ page, F25 not yet seeded) and K1 (chat).

## 2026-10-13 — Pack-4/J2 batch 1: Windows booking seed script (D-10)

Applied as approved by Jamal. Nothing was committed, no email was sent, and the live seed was **not run**.

- **D-10.** Windows `seed:booking` fix and a fail-closed guard, see docs/ENGINE-FIXES.md (2026-10-13). The direct-run check now uses `pathToFileURL`, the script no longer uses an inline `NODE_OPTIONS=` prefix, and `runStandalone()` now refuses unless `DATABASE_ENV=development` (the opt-in the unified `pnpm seed` already needs), before any database connection. **The live write remains UNVERIFIED**: the target is a remote Postgres whose name carries no dev/prod marker and Jamal has not confirmed it is the development database. The guard is an attestation, not proof of identity. A real run deactivates legacy rows and deletes then recreates future unbooked slots on the "TechMirai" resource.
- **Also noticed, not changed:** the `seed`, `db:apply-indexes` and `db:migrate-faq-keywords-category` scripts use the same inline `NODE_OPTIONS=` prefix and will fail under `cmd` on Windows the same way.

## 2026-10-13 — Pack-4/K1: TechMirai chat content (Spec §16.1–16.3, pp. 87–96)

Nothing was committed, no email was sent, no database was written, and the seed was not run.

**What changed.** The widget now runs a TechMirai flow instead of the clinic flow: greeting, "Automated assistant" tag, an always-visible "Talk to a person" link, the six menu buttons with B1a/B1b/B4 sub-buttons, and the 36 matched answers (F01–F26, C01–C10) with keywords. Typed questions are matched by exact FAQ question, then keywords, then the existing fuse matcher; symptom text goes to F09. Files: `cms-core/src/verticals/clinic/reception/techmirai-{chat-content,flow,triage}.ts` (+ tests), the hook, panel, widget, `[locale]/layout.tsx`, `seed/chat.ts`. Engine addition: `docs/ENGINE-FIXES.md` (2026-10-13, K1). Placeholders: register K1-01 to K1-07.

**Where the flow lives.** There is no `flows` folder. The clinic flow is `reception/flow.ts` in the cms-core package; the TechMirai flow is a sibling file, and the clinic files are left in place (not removed; removing them needs approval).

**Decisions applied (Jamal).** Engine fix approved. `/thanks` booking CTA (D-9) left for K2: `/thanks` is untouched. The two panel test files were rewritten for the TechMirai flow (below).

**Deviations from the plan, and why.**
- Chat text lives in one TypeScript module (`techmirai-chat-content.ts`) and the message tree is built from it, not copied into `en.json`/`ja.json`. One source avoids the same 36 answers existing twice.
- Typing is always available: the panel shows the question box on every screen except the booking form, and the hook jumps to a triage node. The Spec's "Or type your question below." is its placeholder. The old `faq.ask` input node is not used.
- "How it works (link) / 仕組み（リンク）" (B1a): the label is "How it works" / 仕組み; "(link)" is read as a note, not label text.
- B6 offers LINE, Call and Email form with no Menu button, exactly as the Spec lists. The panel's restart button and the "Talk to a person" link remain.
- `chat-answers` C01–C10 are seeded as editable records only. The widget does not read them at runtime.

**Test changes (rule 14 / WORK-ORDER Gate 2).** `ReceptionPanel.test.tsx` (30 tests) and `ReceptionPanel.booking-integration.test.tsx` (2) asserted the clinic menu and clinic FAQ content, so they could not pass against the new flow. Rewritten with the same intent, none dropped: inline booking, links, greeting override, locale switch, always-visible link, free-text outcomes (in flight, grounded answer, unavailable, off-topic, medical, empty submit), LINE/call/demo visibility, and "button and typed question give one answer". The clinic-specific FAQ-content assertions (hours/access/parking/prices/bring/first-visit text, the staff-LINE node, the refusal text with the phone number) were replaced by the Spec §16.2 answers; the clinic flow's own unit tests (`flow.test.ts`, `faq-*.test.ts`, `triage.test.ts`) are unchanged and pass.

**Verification (evidence).**
- `pnpm typecheck`: 3 of 3 packages pass.
- Tests: `@techmirai/reception-engine` 47 pass (7 new); `@techmirai/cms-core` 64 files / 896 tests pass (was 61 / 709). New: content parity (36 answers, EN and JA, brackets, `[JA TODO]` list), flow structure and behaviour in both languages, triage (each FAQ question in EN and JA, the first keyword of each of the 36 entries in EN and JA, Spec §16.7 rows 1, 2, 3, 4, 5, 8, 9, 12, 13 in EN and JA).
- `pnpm dev` booted after clearing `.next`. Every chat link target returns 200 in both languages (`/ja/...` takes one 307 hop to the unprefixed URL, since Japanese is the default locale; this was already how internal chat links behaved). In the browser (EN, narrow viewport): the first screen shows the tag, the "Talk to a person" link, the six buttons in order, and the typing box; pressing Pricing shows the Spec answer, "Pricing page" and "Free assessment" links (`/en/pricing`, `/en/assessment`) and a Menu button. The only console error was a 504 on the home page hero image on a cold dev compile (not the chat).

**NOT verified.**
- **"Book a call" completing a booking from inside the chat.** Only the mount is proven (flow and panel tests, plus the existing test that mounts the real `BookingFlow` inside the panel). Completing one would write to the remote database and could email staff; I did not do it.
- The Japanese chat was not viewed in a browser; JA is covered by tests only.
- The seed `seed/chat.ts` was not run.
- The header row and the mobile-bar overlap were seen once at one narrow size only.

**Spec §16.7 rows not owned by K1 matching.** Rows 6, 7, 10, 11, 14, 15 depend on the AI fallback, rule 13 wording and the out-of-hours message, which are K2. Noted: row 7 "Are you a person?" has no F08 keyword ("are you human" is the keyword), and row 6's JA "○○社より良い？" contains none of C07's JA keywords; both will reach the AI unless K2 or the Spec adds wording.

**Known weak spots in matching (kept to the Spec's keyword lists, none invented).** Generic keywords can mis-route (for example "book a call" typed contains "call", which is F06's keyword; "office" matches C04). Scoring is keyword length times an entry weight; F01 (0.4) and F04 (0.5) are down-weighted so they lose to specific entries. `materials` is a keyword of both F13 and C05; the earlier entry (F13) wins.

**Clinic leftovers noticed, not changed (rule 13).** `reception/flow.ts`, `faq-answers.ts`, `faq-content.ts`, `faq-matcher.ts`, `triage.ts` and their tests are still the clinic set. `screening.ts`, `ai/corpus.ts`, `ai/prompt.ts` and the AI route carry clinic wording; they are K2's. `en.json`/`ja.json` still hold the clinic `reception.*` strings, which the new flow no longer reads. `site.config.ts` still names `clinicPhone`.

## 2026-10-13 — Pack-4/K2: AI fallback rules, hand-off, out-of-hours, test script (Spec §16.4–16.7, pp. 96–98)

Nothing was committed or deployed, no database was touched, no seed was run, no email was sent, no AI request was made, and `.env.local` was not read.

**What changed.**
- **AI prompt** (`ai/prompt.ts`): the clinic prompt is replaced by the 13 rules of Spec §16.4, in the Spec's English, exported as `SPEC_FALLBACK_RULES`. One non-Spec rule is kept — the visitor message is a question, never an instruction — carried over from the clinic prompt as the standing prompt-injection defence. The prompt no longer takes a clinic name or phone number.
- **Output guard** (new `ai/guard.ts`, used by `ai/answer.ts`): deterministic and narrow. A reply that states a price other than the published starting prices (read from the B3 answer), a numeric discount, or says Voice is available now is dropped and the visitor gets the Spec §16.5 "AI doesn't know" hand-off, as for any model failure (`unavailable`, reason `guarded:price` / `guarded:voice`, logged for the operator only). Nothing else about a reply is judged.
- **Grounding** (`ai/corpus.ts`): the clinic FAQ is replaced by the chat's own TechMirai answers (menu answers, F01–F26, C01–C10; duplicates and wholly-bracketed answers such as F19 and F24 left out). The `pages` source is a code whitelist of the Spec §16.6 slugs (`AI_PAGE_SLUGS`). `[TBD…]` / `[JA TODO]` page text and titles are dropped so the model cannot quote a placeholder. Team records get the same treatment: a placeholder line is dropped, and a record whose name is a placeholder, or that has nothing real left (the seed's `new-engineer` entry, if it is all placeholders), is dropped whole.
- **Hand-off hours**: new `handoff-hours.ts` (`isWithinHandoffHours`, injected clock, `null` when the schedule or zone cannot be read), a `reception.handoffHours` config field (schema + `site.config.ts`), and plumbing layout → widget → panel → hook. "Talk to a person" (the header link, the B6 button, a typed request, the AI hand-off) shows the Spec §16.5 during-hours or outside-hours message; with no hours configured it shows B6's own Spec §16.2 answer.
- **Matching** (`techmirai-triage.ts`): B6 joined the keyword set; the approved keywords were added (register K2-03); off-topic questions route to a rule-13 node; the existing fuse.js FAQ-question matcher stays as the last step, with two generic words (`demo`/`デモ`, `when`) left out of the question text it indexes (see Deviations).
- **Rule 13**: a node `off-topic` shows a labelled placeholder and the six menu buttons (register K2-02).

**Decisions applied (Jamal).** Rewrite the four AI test files, keeping each test's intent. Rule-13 copy as `[TBD]` / `[JA TODO]`, registered. `handoffHours` configurable with `Asia/Tokyo`, **not treated as confirmed business hours** (K2-01, launch blocker). Keyword additions as proposed. Rule 9 left unchanged and recorded below. Sadiatec, `/privacy` and blog excluded; no seed. Output guard approved. Manual Groq run left to Jamal. `/thanks` CTA (D-9) deferred, untouched.

**Deviations and choices to know about.**
- **Corpus sources (corrected after review).** A first version switched off `services`, `team`, `seminars` and `company-info` without evidence about what they hold; that was outside Jamal's decisions and was reverted. They are back to their pre-K2 state, each still gated by its own `features.*` flag and `aiVisible`. Only `case-studies` is off in code, which implements Jamal's decision to exclude Sadiatec until approved (the seed is `aiVisible: false` on purpose; no seed was run). Blog and news stay off, as before. What `services` and `company-info` actually contain is UNVERIFIED (see Outstanding).
- **The fuse.js FAQ-question matcher is kept** (a first version replaced it with a two-shared-words rule; that was reverted, and the one-word `export` it needed in `faq-matcher.ts` was reverted too — that file has no K2 diff). Two Spec rows exposed the same weakness: a single generic word shared with one FAQ question pulled the question to that answer. "Do you have a restaurant demo?" (row 14) matched F26 on "demo"; "When can you start next month?" (row 10, EN) matched F10 on "when". The fix is narrow: `demo`/`デモ` and `when` are removed from the FAQ question text before it is indexed (`GENERIC_TOPIC_WORDS` in `techmirai-triage.ts`) — never from what the visitor types, the answers, the keywords, or the matcher's threshold and stopwords. F26 and F10 are still reached by their exact questions, their keywords and their other words. Rows 13 and 14 and row 10 pass in both languages. **Risk:** this is a list, not a rule — another generic word in a future question or phrasing could do the same, and would need adding the same way.
- **Order in the triage:** exact FAQ question, medical screen (F09), keywords, off-topic screen, fuse.js over the FAQ question text, AI. Keywords come before the off-topic screen so "Are you an AI?" is F08, not a deflection.
- **Hours-aware wording is chosen where the message is made** (the hook's resolver swaps the B6 answer key at that moment), not by a second flow node, so every route to B6 behaves the same.
- The prompt, handler and API route no longer pass a clinic name or phone.

**Test changes (rule 14; Jamal approved).** `ai/prompt.test.ts`, `ai/answer.test.ts`, `ai/corpus.test.ts` and `ai/handler.test.ts` were rewritten or updated from clinic fixtures to TechMirai ones, same intent each (token budget, screening before spend, upstream failures, rate limit, validation, corpus scope, locale). Cases that asserted the clinic prompt's wording (its phone-number and clinic-only rules) now assert the 13 Spec rules. `ReceptionPanel.test.tsx` (the off-topic case: now the placeholder plus the menu) and `techmirai-flow.test.ts` (the triage whitelist: the 36 answers plus B6 and `off-topic`) had one expectation updated each. New: `ai/guard.test.ts`, `handoff-hours.test.ts` (including 23:00 JST), `techmirai-test-script.test.tsx` (all 15 Spec §16.7 rows × EN and JA, structure only), extra triage cases. No test was deleted. Review of the edits beyond the four approved AI test files: `ReceptionPanel.test.tsx` (off-topic) and `techmirai-flow.test.ts` (triage whitelist) changed only because the behaviour they pinned was intentionally changed by Jamal's decisions (rule-13 placeholder with the menu; `b6` and `off-topic` allowed by triage); `techmirai-triage.test.ts` only gained cases, and two names were reworded when the matching rule was restored. `corpus.test.ts` was updated for the corrected source state and gained team-placeholder cases. Other K2 additions kept as justified: the output guard's numeric-discount pattern (Spec rule 2 names discounts; Jamal approved keeping it), the `[TBD]` filter and chat-answer dedupe in the corpus, and the prompt's injection and locale lines (carried over unchanged from the clinic prompt, not new).

**Verification (evidence).**
- `pnpm typecheck`: 3 of 3 packages pass.
- Tests: `@techmirai/reception-engine` 47 pass; `@techmirai/cms-core` 67 files / 1012 tests pass (was 64 / 896).
- The 15-row script: matched rows 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13 assert the matched answer id and buttons; row 11 asserts the redirect placeholder, the six menu buttons and no model call; rows 10 and 14 assert that the question reaches the (stubbed) model, which receives the rules and the grounding, and that the chat then ends at "Talk to a person"; row 15 renders the real panel with an injected clock: 23:00 JST on a Tuesday shows the §16.5 out-of-hours text, 10:30 the during-hours text, no configured hours shows B6's own answer.
- Dev boot: on a fresh server `/`, `/en` and `/en/pricing` return 200 with no errors in the log. An older process (PID 11556) still held port 3000 and answered 500 (stale code, not this change); the fresh server ran on 3001 and was stopped afterwards. Invalid-body handling (400, no model call) was checked through the handler's unit tests, not by calling the route.
- **Browser verification (Gates 3–4).** A second dev server on port 3002 (it shares the one `.next`), driven in a real browser with two simulations: the clock was set to 23:00 JST on a Tuesday (out of hours) and 10:30 JST (in hours), and the browser's call to `/api/reception/ai` was intercepted and answered with a labelled stub, so **no server or model call was made**. English: the first screen (title "TechMirai AI受付", "Automated assistant" tag, header "Talk to a person", six menu buttons, the Spec input hint); the out-of-hours text with the bracketed `[on weekdays 9:00–18:00]` and the buttons LINE (new tab), Call, Email form; the in-hours text; an off-topic question gave the `[TBD: polite redirect…]` placeholder plus the six menu buttons with 0 AI requests; an unmatched question sent `{question, locale}` once and showed the stub reply followed by LINE / Call / Email form. Japanese: the same first screen, the out-of-hours text with `[平日 9:00〜18:00]` and LINE / 電話 / メールフォーム, an off-topic question gave `[JA TODO]` plus the menu with 0 requests, and the AI path sent `locale: "ja"`. Pages `/`, `/en`, `/pricing`, `/en/pricing`, `/about`, `/en/about` returned 200. Language leakage in the chat panel: English only `受付` (inside "AI受付") and `日本語` (the switch label); Japanese only proper names, `EN`, the registered `[JA TODO]`, and the "PM" in message timestamps (the existing code formats them in the browser's locale; not K2). Screenshots are in the session scratchpad, not in the repo. **Console:** the only failing request was the home hero image, fetched from `localhost:3000` — the stale server (PID 11556) answers 500 for that file, the 3002 server answers 200 — so it is not K2. One "duplicate React key" warning appeared only under a frozen test clock (typed-question message ids are built from `Date.now()`); it did not reappear with a ticking clock. It is a latent weakness, not fixed. The **Call** button dials `tel:08077013004`, built from the site's configured phone, which is the Spec's bracketed placeholder (an existing launch fact, K1-05 / F1-01), not a K2 defect.
- **A secret scan was NOT run.** Attempts to run one were interrupted and were not retried, so nothing in this step has been checked for API keys, and the Spec's done-when line "no key is in the repo" is **unverified**. What is known by design: the tests stub the model behind the production `fetchImpl` seam, and `GROQ_API_KEY` is read from the environment in `ai/groq.ts` (unchanged). `.env.local` was not read.

**OUTSTANDING — not done, not verified.**
- **Manual Groq run (Jamal).** No request was made to a real model. Rows that depend on live output — 10 ("when can you start"), 14 ("restaurant demo"), and 6, 7 and 11 for phrasings the matcher does not catch — still need running by hand with a real key and the result recorded here. The tests prove the plumbing around the model (what it is told, what it is grounded on, what happens to its reply), not what it says. The guard covers prices and Voice only: a model that promises a start date or an integration is not caught by code.
- **Rule 9 gap.** Spec §16.4 rule 9 says to end with one relevant button. After an AI answer the chat shows the fixed B6 buttons (LINE, Call, Email form). A button chosen to fit the answer needs a change to the AI response shape; left unchanged by decision.
- **Business hours are unconfirmed (K2-01).** The configured schedule is a proposal. Until confirmed, the out-of-hours message is a statement about a schedule nobody has approved. Only the logic is tested, not the real hours.
- **Grounding budget not measured.** Thirty-odd chat answers plus up to 14 pages may exceed `MAX_CONTEXT_TOKENS` (2600); lower-priority documents (pages) are then dropped whole. Not measured against the real corpus (no database access), so which pages actually reach the model is unknown.
- Page `aiVisible` defaults and the real page text were not read from the database; the whitelist is by slug in code. **Corpus content is unverified:** what the `services` collection and the `company-info` global hold (no TechMirai seed writes `services`; the seed adds only the founder to `company-info`) — a leftover clinic record would be grounded; whether the seeded `new-engineer` team entry is all placeholders (it is dropped if so); and whether each §16.6 page's `aiVisible` is true. To be checked by hand in the admin.
- **Gate status (WORK-ORDER §1.3).** Gate 1 PASS (`pnpm typecheck` exit 0). Gate 2 PASS (`pnpm -r test` exit 0; whether a test was "weakened" is a judgement for Jamal's diff review). **Gate 3 BLOCKED on two literal clauses, with no K2-attributable failure found:** `.next` was not cleared (it is shared with the running stale server and was deliberately not deleted), and one console error remains, caused by that stale server. Closure: stop PID 11556, clear `.next`, restart on port 3000, load `/` and `/en`. Gate 4 PASS for the chat panel (not checked on whole pages; K2 did not change pages). Gate 5 PASS (no `.env*` in `git status`; `.gitignore` covers them; nothing outside the plan). Gate 6 PASS (every K2 placeholder is in register rows K2-01 to K2-06).
- **Lint was not run.**
- **Browser checks not done:** the in-hours message in Japanese (unit-tested only); the real clock and a real model reply (the clock was simulated and the AI answer stubbed); mobile-bar overlap and visual polish; and language leakage on whole pages beyond the chat panel.

**Remaining launch blockers (listed, not investigated in this step).** K2 done-when is not fully closed: Gate 3's two literal clauses (above); the secret scan ("no key is in the repo" is unverified — a names-only check such as `git grep -l --untracked -E 'gsk_[A-Za-z0-9]{8,}'` that Jamal can run); the manual Groq run on rows 10 and 14, and 6, 7 and 11 for phrasings the matcher does not catch (Jamal's step); the ★ report (no K2 commit yet, so no hash); lint. Launch facts and content, mostly already registered: the real hand-off hours and time zone (K2-01); EN and JA wording for rule 13 (K2-02); adding the K2 keywords to the Spec (K2-03); the sources and `aiVisible` decisions for Sadiatec, `/privacy` and blog (K2-04); the content of `services`, `company-info`, the `new-engineer` team entry and each page's `aiVisible`, and the grounding token budget (K2-05); the Spec's `[JA TODO]` button labels (K1-01); the real phone, LINE, demo and brochure URLs and address, including the `tel:` link built from the placeholder number (K1-03 to K1-05); the `voice-demo` booking service (K1-06). Not K2 and still open: rule 9 (one relevant button after an AI answer), the `/thanks` booking CTA (D-9), `reception@sakura-sekkotsu.example` as `forms.contactRecipient`, removal of the clinic flow, FAQ and matcher files and their tests (needs separate approval), the unused clinic `reception.*` strings in `en.json`/`ja.json`, and the stale dev server (PID 11556) on port 3000.

**Known weak spots (not changed, none invented).** `screening.ts` is untouched: its English `condition` and `recover`/`heal` patterns will send "terms and conditions" or a "recovery" question to F09. Generic keywords can mis-route ("book a call" contains "call", F06's keyword; "office" is C04's). Row 6 in English matches only when the question says "other company" or "compare with"; row 6 in Japanese now matches on 社より. Both ends of these are tests of the keyword lists, not of an understanding model. **F08's keyword `AI` is a false-positive risk:** a short keyword matched as a whole word, so an ordinary question that merely contains the word ("How does the AI work?") routes to F08 ("I’m an automated assistant…"), unless a longer keyword of another entry outscores it. **The output guard has blind spots by design:** prices written in words ("fifty thousand yen"), `半額`/half price, "free", other currencies' names, delivery dates and integration promises, and a Voice claim phrased without the words it looks for are not caught; it is a narrow last check, not a reviewer of the reply.

**Belongs to a later pack, not K2.** Real hours, phone, address, LINE and demo URLs (launch confirmations); real `/privacy` text and the legal pages; blog AI-visibility after Japanese review; the Sadiatec case study's `aiVisible` and its confirmation; the `/thanks` booking CTA (D-9); `reception@sakura-sekkotsu.example` as `forms.contactRecipient` in `site.config.ts` (a form setting, found while reading); removal of the clinic flow, FAQ and matcher files and their tests (needs separate approval); the unused clinic `reception.*` strings in `en.json`/`ja.json`; a runtime read of `chat-answers`; a `voice-demo` booking service with a preselect.

## 2026-10-15 — Pack-4/L1: metadata and technical SEO — decisions, blockers and open items

**Decisions applied (Jamal, 2026-10-14).**

1. **Japanese URLs stay unprefixed (Spec-vs-engine deviation).** The Spec (§4, §17.2) says "/ja" URLs and "x-default pointing to /ja". The site uses next-intl `localePrefix: 'as-needed'` with `ja` as the default, so `/ja/...` returns a 307 to the unprefixed URL. L1 treats the unprefixed URL as the Japanese one: JA canonical `https://techmirai-ai.com/pricing`, EN `https://techmirai-ai.com/en/pricing`, x-default = the JA URL. The JA home is the bare origin `https://techmirai-ai.com`, which is the form Next prints for a root canonical. Routing is unchanged. The single URL builder is `apps/techmirai-web/src/lib/seo/build-metadata.ts` `localizedUrl()`. The next-intl middleware's `Link` hreflang header (checked on `/en/pricing`) gives the same ja/en/x-default mapping.
2. **`/legal/tokutei.html` returns a 301 to `/legal-notice`, not the Spec's `/legal`.** `/legal` does not exist. The legal-notice route, the seed slug and the footer link all use `/legal-notice`. Whether to rename it to `/legal` is left to M1. The three legacy redirects are in `next.config.ts` with `statusCode: 301` (`permanent: true` would send 308).
3. **noindex on `/thanks` and `/booking/manage`** (both locales). `/thanks` already had `meta.noindex` saved (I4). `/booking/manage` already set `robots: noindex` in its own metadata. No code change was needed for either.

**Open items (not done in L1).**

1. **Old-site anchor redirects: BLOCKED.** The Spec (§17.2) asks for 301s from the old site's "anchors". A URL fragment (`#...`) never reaches the server, so it cannot be redirected. No anchor redirect was added and no target was invented. Needs the old techmirai-ai.com list of real URLs from Jamal (PACK-4 pre-flight item).
2. **Heading order: about 15 page/locale combinations go from h1 straight to h3.** Every crawled page has exactly one `<h1>`. The skip happens because shared blocks render card or section titles as `<h3>` with no `<h2>` above them:
   - card/item grids: `/solutions`, `/how-it-works`, `/integrations`
   - the `ceo-message` title: `/about`
   - the "お渡しするもの" box: `/assessment`
   - the clinic-era sidebar: `/blog`
   - `/` and `/ai-reception` also fail the check (the specific block was not traced)

   Fixing this means changing heading levels in several shared engine blocks, which affects every page that uses them. That is over L1's "handful of files" stop-and-ask limit. Not fixed; needs a decision. `e2e/seo.spec.ts` checks the order with a soft assertion, so these pages fail while their head checks still run.
3. **`/blog` renders an empty `<h1>`.** It is also still the clinic-era page: hero copy "ブログ・インサイト", Sakura sidebar and CTA text. L1 changed only its metadata, which now uses the Spec §17.1 Blog row.
4. **Engine bug: `updateLocalizedDoc` drops localized fields inside a `group` (not fixed).** Verified against this repo's database. A `locale: 'all'` update of `pages.meta` returned and kept the old `meta.title`/`meta.description`, and set `meta.image` to null. The non-localized `noindex` did save. Effect today: `/thanks` still has its seeded `[TBD: Spec Thank you page …]` / `[JA TODO]` meta title and description and no share image, even though `seed/pages/thanks.ts` writes "Thank you" / "送信完了". L1 works around it in `seed/pages/plain-pages.ts` `seedSpecMeta()` with one single-locale write per locale. That is safe because `meta` has no array/blocks fields. A generic fix belongs in `docs/ENGINE-FIXES.md` as its own small change (CLAUDE.md rule 11).
5. **Sadiatec case study gated in `/llms.txt` and the sitemap.** The Spec §17.4 `llms.txt` lists "Case study: Sadiatec". `/llms.txt` serves the Spec block word for word but leaves out that one line while the case study's `visible` switch is off (PLACEHOLDER-REGISTER F1-14). The sitemap omits the URL under the same condition. While the page is hidden it keeps its generic title ("導入事例" / "Case study"), because the Spec §17.1 title names Sadiatec.
6. **Routes left out of the sitemap (behaviour unchanged).** `/thanks`, `/booking`, `/booking/manage`, `/line/*` and the clinic-era routes (`/company`, `/gallery`, `/jobs`, `/news`, `/services`, `/team`, `/about/[slug]`) are not listed, because they are not public pages in Spec §4. Those routes still respond as before. `site.config.ts` `seo.sitemapIncludeCollections` is no longer read; the schema still requires it.
7. **Browser crawl (2026-10-15, final run).** Setup: `pnpm --filter techmirai-web typecheck` passed; `.next` was cleared, the dev server restarted, and all 46 routes warmed one at a time (all 200). `e2e/seo.spec.ts` was then run once: **36 passed, 16 failed.**
   - 15 failures are the known heading skips in item 2 (soft assertion). On those pages the title, description, canonical, hreflang, indexability and unique-title checks ran and passed. That includes `/`, which now has canonical `https://techmirai-ai.com`.
   - The 16th failure is `/en`, which returned 500 during the crawl (it returned 200 during warm-up). The dev log shows the same `SyntaxError: Unexpected end of JSON input` dev-server fault seen in the earlier runs, so this is an environment fault, not L1 code. It was not retried, by decision. `/en`'s head tags therefore have no browser evidence yet.
   - Also passed: noindex on `/thanks`, `/en/thanks`, `/booking/manage` and `/en/booking/manage`; the three legacy paths return 301 to targets that return 200; `/sitemap.xml` lists both locales of every public page with x-default and none of the excluded routes; `/llms.txt` serves the Spec block; in non-production, `robots.txt` gives `Disallow: /` and pages send `X-Robots-Tag: noindex`.
   - Unit tests: 12/12 pass.

**Decisions on the open items (Jamal, 2026-10-15).**
- Heading order (item 2): accepted as a **known L1 deviation** for now. Not fixed.
- Old-site anchor redirects (item 1): L1 ships **without** them. Still a blocker/deviation until the old techmirai-ai.com URL list is supplied.
- `updateLocalizedDoc` (item 4): **not changed in L1.** `/thanks` keeps its `[TBD]`/`[JA TODO]` meta title and description until a separate rule-11 engine fix is approved.
- `/legal` vs `/legal-notice` (decision 2): left to **M1**.

**Final L1 status (2026-10-15): PASS WITH APPROVED DEVIATIONS — not a clean PASS.**

| Done-when item | Result |
|---|---|
| Gate 1 typecheck | PASS |
| Gate 2 tests | PASS: SEO unit tests 12/12 (`pnpm --filter techmirai-web test`). The cms-core suite was not rerun; L1 made no cms-core changes |
| Unique title per page, Spec §17.1 copy | PASS on every crawled page and locale except `/en` (no browser evidence; see item 7) |
| Self-canonical + hreflang ja/en/x-default | PASS on every crawled page and locale except `/en` (no browser evidence) |
| Exactly one H1 per page | PASS wherever the page rendered (every page except `/en`, whose crawl request got a 500) |
| Headings in order | FAIL on 15 page/locale combinations: **approved known deviation** (item 2) |
| noindex on /thanks and the form-result page | PASS |
| Sitemap lists every public URL in both languages | PASS |
| Production robots.txt (D2-gated) | PASS (unit test, production branch); non-production branch PASS in the browser |
| /llms.txt | PASS |
| 301s for the three legacy legal paths | PASS |
| Old-site anchor redirects | NOT DONE: **approved deviation**, blocked on the old URL list (item 1) |
| Gate 5 git status | PASS: only planned files. The generated `apps/techmirai-web/test-results/` folder (Playwright output from the final crawl: `.last-run.json` and 16 `seo-head-headings-*` folders, 33 untracked files) was removed. It is now ignored by a single-path rule in the root `.gitignore` (`apps/techmirai-web/test-results/`), so future crawls do not leave untracked output |
| Gate 6 register | PASS: L1-01, L1-02 added |

**Remaining blockers / follow-ups:**
- the old-site URL list for anchor redirects
- heading-order fix in the shared blocks (needs approval)
- the `updateLocalizedDoc` group-localization engine fix (rule 11), which also fixes `/thanks`'s `[TBD]` meta
- `/en` browser verification, blocked by the intermittent dev-server JSON-parse fault (an environment problem)
- `/legal` path, in M1
- clinic-era `/blog` page content and its empty `<h1>`
- L1-01 legal-page meta descriptions

**Also noted.** `robots.txt` was already the Spec §17.2 text, gated by the D2 switch `SITE_ENV === 'production'`, and is unchanged. Two points follow from the Spec's text as written: `Disallow: /thanks` stops crawlers from ever seeing that page's noindex tag, and it does not cover `/en/thanks`, which relies on its own noindex tag. The leftover Sakura-clinic `seo.titleTemplate`/`defaultDescription` in `site.config.ts` (FINDINGS 2026-10-05) were replaced: the template is `'%s'` and the default description is the Spec §17.1 Home row. The full seed was **not** run, because it clears existing content and needs `--confirm`. Spec meta was applied to the 17 existing page shells with the non-destructive `seedSpecMeta()` only.

## 2026-10-15 — Pack-4/L2: structured data, GEO and share images (Spec §17.3–17.4, §19)

**Decisions applied (Jamal, 2026-10-15).**

1. **Share-image font:** Noto Sans JP Bold is bundled at `apps/techmirai-web/src/lib/seo/fonts/NotoSansJP-Bold.otf`, with its license as `OFL.txt` (SIL Open Font License 1.1). Both come from the official `notofonts/noto-cjk` repo (`Sans/SubsetOTF/JP`). Before copying, the file was checked: 4,656,448 bytes, `OTTO` OpenType signature, and the license text names SIL OFL 1.1. `/og` reads the file from disk and never fetches a font at runtime. `next.config.ts` adds an `outputFileTracingIncludes` entry for `/og` so the font ships with that route. Glyph coverage could not be checked with an installed font tool (none available); it was checked by rendering every Japanese share image instead (see "Verification" below).
2. **The Spec contradicts itself on the Organization `description`.** §17.3's JSON example gives "TechMirai builds AI受付, an AI reception system that turns small-business websites in Japan into 24/7 front desks for questions, reservations and LINE." §17.4 says to use its canonical company-facts sentences word for word in schema. L2 uses §17.4 sentences 1–2 in the page's language (`json-ld.ts` `ORGANIZATION_DESCRIPTION`). `json-ld.test.ts` checks them against the Spec file. §17.3's sentence is not used anywhere.
3. **Chat company answers unchanged.** §17.4 also asks for the canonical sentences in the chatbot. They were **not** added, because that would change K1's word-for-word Spec §16 answers and the K1/K2 tests. Open item for a later, separately approved change.
4. **Organization `logo` omitted.** The Spec's logo path is bracketed and the current logo is the placeholder wordmark (D2-02). Register row L2-01.

**What L2 added.**

- **JSON-LD.** `json-ld.ts` builds Organization, WebSite, Service, FAQPage, BlogPosting and BreadcrumbList. `JsonLd.tsx` renders them with `<` escaped. Every bracketed value is removed by `stripBracketed()`, so no JSON-LD output contains a bracket. Omissions are in register rows L2-01 to L2-03. Placement:
  - Organization and WebSite: every page, from `[locale]/layout.tsx`. The founder (`Person` "Jamal Shah", read in English from `company-info.founder.person`) is included only when `company-info.founder.visible` is exactly `true`; a read failure leaves it out.
  - Service: `/ai-reception` and `/pricing`, both locales, from the `[slug]` catch-all. `offers` is left out while the price is bracketed (L2-02).
  - BreadcrumbList: the four industry pages (Home › Solutions › industry); blog posts (Home › Insights › post); the case study (Home › case study), which renders only past the existing Sadiatec visibility gate. Names are the Spec §4 page titles.
  - BlogPosting: blog posts, in the Spec §17.3 shape. The old clinic-era BlogPosting/Breadcrumb code on that page was replaced.
- **Share images.** `/og?path=&locale=` draws a 1200×630 image with the page's Spec §17.1 title in the page's language. It serves only paths with a §17.1 or legal-page row and returns 404 for anything else. While the case study is hidden it uses the generic title ("Case study" / "導入事例"), the same gate as the page. Every page's `og:image` and `twitter:image` default to it, with `twitter:card` = `summary_large_image`. An editor-uploaded `meta.image` (or a post's featured image) still wins. The seeded `og-*.png` placeholders (English-only labels) are ignored (`isSeededPlaceholderImage`). Register row L2-05.
- **GEO.** The four §17.4 canonical sentences were already word for word on About (Pack-3/I2) and in the Organization description (sentences 1–2). The "direct one-sentence answer first" habit comes from the Spec copy already seeded in Pack 3; no page copy was changed in L2.

**Blockers and open items (not done in L2).**

1. **FAQPage is disabled.** `/faq` is still a ComingSoonStub, and FAQ markup must match the questions shown on the page. The builder exists and is tested; enable it when the page displays the real FAQ (L2-04).
2. **BlogPosting has no live output.** No blog posts exist and none were invented (L2-03). The builder is unit-tested only.
3. **Case-study breadcrumb has no live output.** It waits for Sadiatec's written permission (F1-14). The visibility switch was not touched.
4. **Rich Results Test and validator.schema.org** need a deployed preview; to be run by Jamal or the developer. Not done.
5. **Chat answers lack the §17.4 sentences** (decision 3). Needs a separately approved K1/K2 change.
6. **Share-image branding** uses the temporary colours and the text wordmark (D2-01, D2-02) and updates automatically when those land.
7. **Clinic-era JSON-LD left unchanged** (outside L2's list): the BreadcrumbLists on `/blog`, `/contact`, `/company` and `/services`.
8. `.tmp-font-dl/` (the font download used for verification) is still in the repo root, untracked, per instruction. Remove it before committing.

**Verification (2026-10-15).**

- **Checks run:** `pnpm --filter techmirai-web exec tsc --noEmit` passed; the unit suite passed 28/28.
- **Rendered JSON-LD** on 12 pages: `/`, `/en`, `/ai-reception`, `/en/ai-reception`, `/pricing`, `/en/pricing`, `/solutions/hotel`, `/en/solutions/clinic`, `/faq`, `/en/faq`, `/case-studies/sadiatec`, `/en/about`. Every page returned 200, and every block was valid JSON with `@context` schema.org and no bracket.
  - Each page had exactly the expected types: Organization + WebSite everywhere; Service on the four product/pricing URLs; BreadcrumbList on the industry pages; no FAQPage on `/faq`; no breadcrumb on the hidden case study.
  - The Organization description was in the page's language. `logo`, `telephone` and `sameAs` were absent.
  - **Founder:** present on all 12 pages, which matches `founder.visible` seeded `true` (F1-04). The check could not read `company-info` over REST (request timed out), so that match is inferred. The founder-hidden case is covered by `json-ld.test.ts`.
- **Bug found and fixed (L2):** `/og` returned an HTML 404 for every request. The next-intl middleware matcher caught `/og` (no dot, no excluded prefix) and rewrote it to `/ja/og`, which the `[slug]` catch-all 404s. `src/middleware.ts` now excludes exactly `og$|og/`; nothing else in the matcher changed. After the fix:
  - all 21 JA share images return `200 image/png`, 1200×630
  - unknown paths or locales get the route's own 404
  - `/` and `/en/pricing` still route normally
- **Glyphs:** all 21 JA share images (every §17.1 and legal page) were viewed. Every Japanese character rendered in Noto Sans JP Bold, with no missing-glyph boxes, including full-width （）, ・ and ｜, kana with dakuten/handakuten, and the 24/7 digits. The hidden case study shows the generic 導入事例.
  - Cosmetic only: long titles wrap at any character, so a line can break inside a word (e.g. 連｜携, 車｜検). Not a glyph issue; not changed.

**L1 deviations unchanged:** heading order, old-site anchor redirects, `/thanks` `[TBD]` meta (`updateLocalizedDoc`), `/legal` vs `/legal-notice` (M1).

## 2026-10-15 — Pack-4/M1: legal pages (Spec §18, pp.107–111)

**Decisions (Jamal, 2026-10-15).**

1. **Placeholders.** Every Spec §18 heading carries exactly:
   - EN: `[PLACEHOLDER: wording to be written by a professional. Do not launch with this text.]`
   - JA: `専門家による文案作成が必要です。この文章のまま公開しないでください。`

   The JA string was supplied by Jamal, not written or translated by ECC.
2. **Phone:** placeholder only. The configured `[080-7701-3004]` is unconfirmed and is not shown on any legal page.
3. **URL:** the page stays at `/legal-notice`. New 301s in `next.config.ts`: `/legal` → `/legal-notice` and `/en/legal` → `/en/legal-notice`. L1's three `/legal/*.html` 301s are unchanged.

**Changes.**

- **Headings:** `apps/techmirai-web/src/lib/legal-headings.ts` holds the Spec §18 headings word for word (privacy 9, terms 6, legal notice 10, EN and JA; the bracketed English glosses after the JA cells are not headings).
- **Page component:** `_components/LegalPage.tsx` renders the §4 title as the only H1, an H2 per heading, and the placeholder. It replaces `_components/LegalPlaceholder.tsx` (deleted).
- **Confirmed facts shown alongside the placeholder:**
  - "TechMirai" under Business information / 事業者情報 and Seller / 販売事業者
  - info@techmirai-ai.com under Contact / お問い合わせ窓口 and Email / メールアドレス
- **Consent-link fix:** the assessment form's consent link (the Spec's only consent field, §12.2) was a plain `<a href="/privacy">`, so `/en/assessment` linked to the Japanese policy. It is now the locale-aware `Link`. Footer links were already locale-aware and are unchanged.
- **Register:** E2-01 closed; M1-01 to M1-03 added.

**Compliance items (checked, no code change).**

- **Item 8:** the chat panel shows "Automated assistant" / 自動応答 on every page.
- **Item 7:** the fictional-demo sentence is rendered on `/solutions/clinic` and `/en/solutions/clinic` (the demo clinic name is still bracketed, F1-19).
- **Item 11:** no analytics code; no `Set-Cookie` header on `/`, `/en` or `/en/privacy`; nothing was added.

**Verification.**

- **Gates 1 and 2:** typecheck passed; web unit suite 36/36 (new `legal-headings.test.ts` re-reads the Spec rows); cms-core unit suite 1012/1012.
- **Gate 3:** `.next` cleared and the dev server restarted. Privacy, terms, legal-notice and assessment return 200 in `/ja/…` and `/en/…`. No browser console errors or warnings on those 8 pages.
- **Gate 4:** JA pages show only the approved JA placeholder and Japanese headings.
- **Gate 6:** register updated.
- **Rendered check, all 6 legal pages:** one H1; H2s equal to the Spec rows; one placeholder per heading; no other text in `<main>`.
- **Redirects:** `/legal` and `/en/legal` return 301 to the right targets; the L1 legacy 301s still work.

**Launch-scan gap: resolved (option 1, chosen by Jamal 2026-10-15).** Rule B6 only matched `[bracketed]` text, so the approved JA placeholder was not flagged (0 hits). `scripts/launch-scan-rules.mjs` now has `B6_UNBRACKETED_PLACEHOLDERS` holding the exact approved JA string; `checkB6BracketPlaceholders` reports it under rule ID `B6_BRACKET_PLACEHOLDERS`. Legal-page content and approved wording are unchanged. New test: `src/lib/launch-scan-placeholder.test.ts`.

Observed on a rerun of `launch-scan-pages.ts` against the dev server (all 1162 hits parsed; split by route, locale and scope):

| Route | JA text scope | JA markup scope | EN text scope | EN markup scope |
|---|---|---|---|---|
| `/legal-notice` | 10 | 1 | 10 | 10 |
| `/privacy` | 9 | 1 | 9 | 9 |
| `/terms` | 6 | 1 | 6 | 6 |

- Text-scope JA hits equal the Spec heading counts (10 / 9 / 6), so every section is flagged in rendered text.
- The JA string appears on no route other than these three.
- Tests after the change: web unit suite 36/36; typecheck printed no errors.
- The placeholders must still be replaced with professionally written text before launch.

## 2026-10-19 — Pack-4/N1: image slots, alt text, launch-scan image rule (Spec §19, pp.111–113)

**What N1 did.**

- **`docs/IMAGE-SLOTS.md`** lists every Spec §19 slot (23 rows) with size, page, file, status, EN and JA alt, supplier and register ID. Its code twin is `apps/techmirai-web/src/lib/image-slots.ts`.
- **QR code:** already built in G2 and not touched. It encodes `siteConfig.integrations.demoUrl`; its empty alt is documented as decorative.
- **Share images:** the generated `/og` route (L2-05) stays the answer. The seeded `og-*.png` files are listed as superseded.
- **Spec p.113 alt text** is now seeded word for word for the hero (`media.ts`), Jamal (`team.ts`, `about.ts`, EN and JA) and Haruka (`team.ts`). The layers-diagram sentence is recorded as data only (see below).
- **Launch scan (B7):** new `checkB7Images` in `scripts/launch-scan-rules.mjs`, used by `launch-scan-pages.ts`. It fails a missing `alt` attribute and any file whose name contains `placeholder`; it accepts an empty `alt` as decorative and skips `data:` images. Before, an empty alt was reported as "missing" and placeholder images were not reported at all.
- **Register:** N1-01 to N1-09 added.
- **Tests:** `image-slots.test.ts` and `launch-scan-images.test.ts`.

**Rendered audit (dev server, `sitemap.xml`, 40 routes, 154 `<img>` tags).** No tag lacks `alt`. Empty alt: the QR code (`/`, `/en`) and `/hero-placeholder.jpg` (`/blog`, `/en/blog`).

**Deviations from the approved plan.**

1. **No new placeholder image files were generated** for the three-step strip, before/after, layers diagram, admin screenshot and sample report. The Spec gives no size for them, and a made-up size would break rule 5 (the F3 note says the same). Each is a documented slot with a register row instead. The three-step strip is text pills in the live-demo block and the layers diagram is an inline SVG block, so neither needs a file.
2. **The seed alt fixes need a reseed** to reach the local database: `upsertMedia` reuses an existing media doc and `upsertTeamMember` returns early for an existing person. The rendered audit above ran before the fix, so `/about` (JA) still showed `[JA TODO]` for Jamal's portrait alt. Not reseeded here.

**Observations, not changed (rule 13).**

1. **Team cards use `alt={name}`.** `packages/cms-core/src/blocks/team-grid/component.tsx` ignores the media alt, so the page shows "Jamal Shah" and not the Spec's "Jamal Shah, founder of TechMirai". Fixing it is an engine change (rule 11).
2. **Layers diagram:** the SVG is `aria-hidden` with a screen-reader list; the Spec's alt sentence is not on the page. Same engine block.
3. **Placeholder portraits are 1200×1200**, the Spec says 1200×1500 (N1-08).
4. **Favicon** is still the old clinic icon (D2-02).
5. **`/blog` hero** still uses the clinic `hero-placeholder.jpg` (N1-01).
6. **Dev server:** started once for the audit and still running on port 3000.

## 2026-10-19 — Pack-4/O1 and O2: sweep, tests, accessibility, build — results and open items

**O2 results (final tree).** `pnpm typecheck` pass (3/3). Unit tests pass: `techmirai-web` 48/48, `cms-core` 1,012/1,012 (67 files, integration tests excluded), `reception-engine` 47/47. `pnpm build` pass (105/105 pages, no errors). `pnpm a11y` pass: 46 routes (23 x ja/en), 0 serious/critical, 0 moderate/minor, exit 0. Details: `docs/O2-ACCESSIBILITY.md`, `docs/O2-QUALITY-GATE.md`, `docs/O2-CODE-REVIEW.md` (APPROVE with comments: 0 critical, 0 high, 2 medium, 3 low).

**Found and fixed in O2.** The production build served `/assessment` and `/en/assessment` from the generic catch-all as an empty page with a placeholder title (the first axe run was therefore vacuous for those two routes). Fixed in `[locale]/[slug]/page.tsx`; see `docs/ENGINE-FIXES.md` (2026-10-19).

**Unresolved, not fixed (each needs a decision or is out of scope):**
1. **Heading order: 14 route/locale combinations** fail the soft assertion in `e2e/seo.spec.ts` (`h1 -> h3`): `/`, `/ai-reception`, `/solutions`, `/how-it-works`, `/integrations`, `/about`, `/assessment`, each in ja and en. Same cause as L1 item 2 (shared engine blocks render card titles as `<h3>` with no `<h2>`). The brief said 12; L1's list already included `/assessment`. Tests unchanged. Fix = change shared blocks (needs a decision).
2. **`<html lang="ja">` in server-rendered HTML on `/en` pages** (O1 "Option C"). `(frontend)/layout.tsx:22` uses the default locale; `HtmlLangSetter` corrects it after hydration, so axe cannot see it. Fix when approved: move `<html>` into `[locale]/layout.tsx` (watch the `notFound()` and invalid-locale 404 behaviour).
3. **`/quality-gate` was not executed.** The repo has no formatter (no Biome or Prettier config or dependency) and the gate script is not in the repo. No formatter was added, as decided. See `docs/O2-QUALITY-GATE.md`.
4. **`apps/techmirai-web/scripts/` is outside `tsconfig` `include`**, so `a11y-check.ts` and the other scripts are not type-checked by `pnpm typecheck`.
5. **Three E2E suites not run** (`booking-journey`, `manage-appointment`, `reception-journey`): they write to the database or call the booking and chat APIs.
6. **Production-mode checks not done:** `SITE_ENV=production` (robots allow-indexing, no `X-Robots-Tag`, `/thanks` noindex under the production header logic) still needs its own approved pass. The a11y and `seo.spec` runs used `next start` with `SITE_ENV` unset.
7. **`blog/[slug]/page.tsx` lines 102-107** still show the recruitment CTA ("Stay informed on Japan's employment landscape" / "Talk to Our Experts"); the same strings sit unused in `src/messages/en.json` and `ja.json` (lines 161-162). Outside the O1 route fixes.
8. **`/contact`** is still clinic-flavoured (inquiry types, offices grid, さくら接骨院 copy); only its hero button was changed in `fface4f` (FINDINGS J1 stands).
9. **Nine static preflight hits remain** (O1 scope closed): `site.config.ts` lines 131-134 and 161 (placeholder social URLs, `.example` recipient) and four engine files: `hero/component.tsx:113`, `services-grid/component.tsx:210`, `payload/globals/header.ts:102`, `clinic/reception/faq-content.ts:389`.
10. **Launch-scan items still open:** scanner `ROUTES` lacks `case-studies/sadiatec` and `booking/manage`; `/news` and `/team` have no canonical/hreflang and `/company` and `/services` have no `<h1>` (noindex routes the scan still checks); `B1_ALLOWED_SADIATEC_LOCATIONS` is an empty stub; the 完全 allow-list entry is still marked not applicable; B4 static scanning matches code comments and CSS `100%`; B5 flags "Available now" on the Web edition (false positives). No allow-list or scanner change was made.
11. **`case-studies.ts` stray `\u0096`** (O1): the seed source is fixed and now equals Spec §13 exactly, but the `case-studies` document already in the database still holds the old string until a reseed. Check `/ja/case-studies/sadiatec` after the next reseed.
12. **The `catch-all` fix list is hand-maintained** (`DEDICATED_ROUTE_SLUGS`); a future dedicated route with a same-slug `pages` document would repeat the production-only empty-page bug (`docs/O2-CODE-REVIEW.md`, medium 1).
13. **Axe limits:** temporary brand colours (D2-01) need a contrast recheck when real colours arrive; placeholder images and `[JA TODO]` alt text; no manual keyboard or screen-reader pass; WCAG 2.1 AA tags only.
14. **Build notes:** `getPayloadHMR` deprecation warnings (known, J1) and "R2 not configured, using local file storage" appear during `next build`.
15. **Stale note:** the N1 entry above ("Dev server: started once for the audit and still running on port 3000") is out of date. The dev server was stopped for the production build and the production server is stopped at the end of O2.

**Rules kept.** No database change or reseed, no test deleted or weakened, no commit, push or deploy. O2 edits remain uncommitted: `apps/techmirai-web/scripts/a11y-check.ts`, `[locale]/[slug]/page.tsx`, root `package.json`, and the docs.

## 2026-10-20 — Button label overflow fix: results and observations

**Done.** Button labels no longer extend outside their buttons. Root causes were fixed heights (`h-12`/`h-14`) with wrapping Japanese labels, `whitespace-nowrap` inside narrow pills, and side-by-side buttons in the hero's ~30%-wide right column at `lg`/`xl`. Changes are className-only in `hero/component.tsx`, `HeaderClient.tsx`, `MobileMenu.tsx`, `ui/Button.tsx`, `booking/ui/shared/BookingButton.tsx` and `case-studies-grid/component.tsx`. At `lg`+ the hero Call/LINE pills and the two main buttons now stack at full width (Call/LINE go two-up again at `2xl`).

**Evidence.** A headless-browser check (button text box vs. button box) over 12 routes (ja/en home, services, company, contact, news, team, blog, assessment, pricing) at 375/768/1280px found 0 overflowing buttons. The check was confirmed to fire on the old fixed-height pattern. `pnpm typecheck` passes; `techmirai-web` tests 48/48. Not run: `cms-core` tests, `pnpm build`, `pnpm a11y`, Playwright E2E.

**Observed, not changed:**
1. At 375px the floating chat button covers the right end of the hero primary button when scrolled to it; the label itself is inside the button.
2. The mobile bottom bar (`HeaderClient.tsx`) is fixed and covers content near the page bottom; no bottom padding was checked.
3. During this check a dev server was already running on port 3000 and returned HTTP 500 for every page, so checks ran on port 3001. The 500s were not investigated. One transient 500 on `/ja/news` at 1280px came from a dev webpack-cache error (`__webpack_modules__[moduleId] is not a function`) and did not recur.
4. The hero `placeholder-hero-phone-mockup.png` image request timed out in dev (`upstream image response timed out`).

## 2026-10-20 — Content hidden under the fixed header: fix and observations

**Cause.** `HeaderClient.tsx` renders a `fixed top-0` header (73/81/89px at base/md/lg including its border) but `<main>` had no top offset, so the first 73-89px of every page sat under it. Pages and blocks each guessed their own top padding; the home hero (lg+) and `/team` were hidden (first content at y=43 and y=5).

**Fix.** One variable, `--header-h` (73/81/89px at base/768/1024), in `apps/techmirai-web/src/app/globals.css`; `<main>` is padded by it in `[locale]/layout.tsx`; `html` gets `scroll-padding-top` so anchors land below the header. The per-page header compensation was removed or reduced so gaps do not double: `page-hero` (both text and image variants, now `pt-6 md:pt-10`), `news/page.tsx` (`pt-8`), `team/page.tsx` (padding added), and in `hero/component.tsx` the `pt-4`, the headline `mt-15 sm:mt-12`, the logo's negative top margin, and `lg:min-h-screen` (now viewport minus `--header-h`). If the header height changes, update `--header-h`.

**Evidence.** Browser measurement (header bottom vs. top of first text in `<main>`) over 14 routes at 375/768/1024/1280/1600px: before, home (lg+) and `/ja/team` were hidden; after, 0 hidden, gap below header 17-43px. One transient evaluate error (`/ja/pricing` at 375px) passes at the other widths. `pnpm typecheck` passes; `techmirai-web` tests 48/48. Not run: `cms-core` tests, `pnpm build`, `pnpm a11y`, E2E.

**Observed, not changed:**
1. The mobile bottom bar (`fixed bottom-0`, ~56px) covers the end of the footer on phones; `<main>`/footer have no bottom offset.
2. `/ja/services`, `/en/services` and `/ja/company` render no text inside `<main>` in the dev server (measured as empty); not investigated.
3. Several route files render their own `<main>` inside the layout's `<main>` (nested `main`, invalid HTML), e.g. `team/page.tsx`, `news/page.tsx`.
4. Other blocks with a large first-section top padding (`py-16 md:py-24` etc.) now have that padding in addition to the header offset when they come first on a page; looks fine but is extra whitespace.
5. Dev-server note: two `next dev` servers sharing one `.next` folder made routes return 404 until restarted; the server on port 3000 (pid 4092) is not mine and was left running.

---

## 2026-10-20 — Images missing after deployment: causes and open items

1. Media uploads go to `public/media` (`packages/cms-core/src/payload/collections/media.ts:10`), which `.gitignore` excludes. R2 storage only activates when all four `CLOUDFLARE_R2_*` variables are set (`apps/techmirai-web/payload.config.ts:91-116`). Host setting, not code: set them plus `NEXT_PUBLIC_R2_PUBLIC_URL`, redeploy, and re-upload/re-seed the media.
2. `NEXT_PUBLIC_SERVER_URL` falls back to `http://localhost:3000` if unset at build time (`payload.config.ts:72`, `config-factory.ts:119,159`). Set it to the live URL in the build environment.
3. Referenced static files that do not exist in `public/`: `/CEO.png` (`CeoWelcomePopup.tsx:14`), `/hero-placeholder.jpg` (`src/lib/image-slots.ts:303`), `/images/company-placeholder.jpg` (`packages/cms-core/src/blocks/company-profile/component.tsx:111`). Broken locally too. Need the real files from the developer; not invented.
4. The allow-list fix is logged in ENGINE-FIXES.md.

---

## 2026-10-21 — Build fails with ETIMEDOUT while prerendering (database unreachable at build time)

**Symptom.** Deploy build: `Error occurred prerendering page "/ja/about/business-contents"` with `Failed query: select count(*) from "pages" where "pages"."slug" = $1`, cause `ETIMEDOUT`. The build host could not connect to Postgres.

**Root fix (host setting, not code).** `DATABASE_URI` (read in `packages/cms-core/src/payload/config-factory.ts:144`, empty string if unset) must be set for the Build environment, point at a database reachable from the build host (firewall/IP allow-list, pooled URL and `sslmode=require` where the provider needs them, serverless DB awake).

**Code change (resilience).**
- `src/lib/static-params.ts` adds `staticParamsOrEmpty()`: runs a DB-backed `generateStaticParams` loader and returns `[]` (with a `console.warn`) if the database is unreachable.
- Wrapped the DB-querying `generateStaticParams` in `[slug]`, `blog/[slug]`, `news/[slug]` and `services/[slug]`. Behaviour is unchanged when the database is reachable.
- `about/[slug]` `generateStaticParams` now returns `[]` (its page render reads the database), so those pages render on first request (`dynamicParams = true`, `revalidate = 3600`).

**All `[locale]` pages made dynamic.** The `[locale]` layout, header, footer and nearly every page read the database, so `export const dynamic = 'force-dynamic'` was added to `src/app/(frontend)/[locale]/layout.tsx`. Every page under it now renders per request; the per-page `revalidate = 3600` exports no longer take effect (no ISR cache), so each request queries the database. To get caching back, remove that line once `DATABASE_URI` is reachable at build time.

**Update 2026-10-25 (performance fix).** The line is removed; `DATABASE_URI` was reachable and `next build` prerenders all `[locale]` pages (`●`, 1h revalidate). Also changed: layout awaits run in parallel; the home page shares one `pages` query between `generateMetadata` and the body (depth 1); Footer `findGlobal` uses depth 1; `push` is now `NODE_ENV === 'development'` only (production no longer auto-pushes schema, and there is still no migrations folder, so schema changes need `db:apply-*` scripts or a one-off push); `vercel.json` pins `regions: ["sin1"]` next to the Neon Singapore DB; the reception widget loads via `next/dynamic`; `dev` uses `--turbopack`. If a build host ever cannot reach the DB again, builds will fail on prerender. Unused `public/brand/Sakura-clinic-logo.png` (1.4 MB, clinic-demo leftover) is left in place for the developer to delete.

**Evidence.** `pnpm build` with `DATABASE_URI=postgres://u:p@127.0.0.1:1/none` (unreachable) exits 0; the four wrapped `generateStaticParams` log `[static-params] ... skipping prerender`. Only `/{ja,en}/line/booking`, `/{ja,en}/line/manage` and `_not-found` are prerendered (none read the database). In the route table `●` on `[locale]` routes only marks that they have `generateStaticParams`; no HTML was generated for them. `tsc --noEmit` passes. Not run: tests, a build against a reachable database, a deployed-site check.

## 2026-10-21 — Voice pivot (ECC Master Prompt v2)

- **/company sitemap blocked:** `seo.test.ts` asserts `/company` is excluded from the sitemap; the new brief wants it listed. Not changed (rule 14, stop trigger). Needs Jamal's approval to update that test.
- **Email "or" phone:** the form requires email (the form-submissions collection and notification hook key on it); phone is optional.
- **send-form-emails.ts** interpolates submitted values into HTML unescaped (HTML injection into staff emails). Not fixed here; fix before enabling emails.
- **CSP is Report-Only** until reviewed in a browser; then enforce.
- **site.config.ts** still has clinic-era tagline, social placeholders, contact recipient and a bracketed phone; footer displays the tagline. Replace once confirmed.
- **Windows seed scripts:** `RUN_SEED=true ...` in package.json scripts fails under the Windows script shell; run from Git Bash (as done for seed:voice).
- **Old pages kept:** `/ai-reception`, `/solutions/*`, `/pricing` etc. still carry the earlier product copy and prices; they are unlinked from main nav only. `/pricing` shows bracketed prices.
- **FAQPage JSON-LD** still emitted on kept pages with FAQ content; prompt says none until that content exists. Owner decision.
- **Unverified:** `pnpm build`, e2e, axe, Lighthouse, reduced-motion visual check, end-to-end successful submission.

- **(2026-10-21, second pass)** Fixed: unescaped HTML in the form emails; PII in email logs. Found: the 2 s splash hid the site; Japanese font swap delayed LCP. Still open: pages are all `force-dynamic` (LCP/TTFB); the chatbot still answers about the old AI受付 product and its content is locked by tests; AIRI, Callix, KARAKURI and AI Worker were not researched (no results retrieved); dev database now contains two test form submissions named "automated check".

- **(2026-10-21, Japanese pass)** Owner explicitly asked for Japanese to be written for every `[JA TODO]`, overriding CLAUDE.md rule 6 for this task; it is marked DRAFT everywhere it matters (needs native review). Also found: a combined `locale:'all'` update kept the old Japanese `pages.title` while updating English; titles are now set per locale in `seed/pages/voice-pivot.ts`.

- **(2026-10-21, screenshot restyle)** Differences from `docs/screenshots/screenshot.jpeg`, all because the ECC prompt wins: header nav kept as Demo / Partners / Company / Contact (screenshot has Home, case studies, engineering track, download); supporting line and secondary button keep the prompt's exact Japanese; the demo is described as a scripted simulation (screenshot says "real call"); "current phone environment" wording dropped; routing list carries a "consultation option" badge because transfer-to-person and routing rules are not built; photos/illustrations of people replaced by icons (rule 8). Illustrations in the screenshot are not reproduced pixel-for-pixel.

- **(2026-10-25, logo green theme)** The site green changed from #0F6E56 to the logo's #47A35A. Because #47A35A is 3.2:1 on white, text on green fills is navy (`--color-on-primary`) and green text on light backgrounds uses `--color-brand-primary-dark` (#2A783D). Not changed: the pie-chart greens in `verticals/recruitment/blocks/placement-statistics/component.tsx` (code comment says keep as-is; recruitment vertical is off); the LINE button green #06C755; pink/coral `#EE7A93` accents in hero, treatment-list and news-list; the amber/pink tones in clinic blocks. Still open: the clinic-vertical blocks (doctor-grid, department-list, treatment-list) carry leftover clinic colours; `booking/ui/tokens.css` uses its own navy accent `#1b3a5c`. Not verified: visual screenshots (chrome-devtools MCP failed to connect), e2e, axe.
