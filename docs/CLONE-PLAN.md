# Clone plan (light version — see note below)

> **Scope note:** this is a *lighter* pass than the full C1 recon the rulebook describes
> (`docs/packs/PACK-1-CLONE.md`, step C1), which calls for reading the entire 113-page Content
> Spec and the whole codebase in depth, producing all 10 listed deliverables, and waiting for
> Jamal to answer the open questions before this file is saved. That full pass has **not** been
> done. This light version covers what a quick codebase scan can establish, so Pack-2 isn't
> blocked waiting on it. **The full C1 recon should still be done properly before pages are
> built in Pack-3** — several items below are flagged `[INCOMPLETE]` for that reason.

## 1. Block inventory

34 blocks are registered in `packages/cms-core/src/blocks/index.ts`:

- **Shared (26, usable for any vertical):** Hero, Stats, ServicesGrid, BentoGrid, LogoCloud,
  CTABanner, RichText, FAQ, ContactForm, TeamGrid, EventList, Gallery, HoursLocation,
  CompanyProfile, DownloadsGrid, BlogTeaser, NewsList, PageHero, ImageTextSplit, StatsBar,
  CEOMessage, Affiliates, GalleryGrid, History, ContactInfoCard, MissionStatement, BookingCta.
- **Clinic-vertical-gated (3):** DoctorGrid, DepartmentList, TreatmentList
  (`packages/cms-core/src/verticals/clinic/blocks/`).
- **Recruitment-vertical-gated (5):** CaseStudyCarousel, CaseStudiesGrid, ComplianceGrid,
  BusinessLineList, PlacementStatistics (`packages/cms-core/src/verticals/recruitment/blocks/`).

`[INCOMPLETE]` — mapping each block to which Spec section it could serve needs the full Spec
read (C1 item 1).

## 2. Section map

`[INCOMPLETE]` — needs the full Spec read (C1 item 2). Not attempted here.

## 3. Route map

Current routes under `apps/techmirai-web/src/app/(frontend)/[locale]/`:
`/`, `/[slug]`, `/about/[slug]`, `/blog`, `/blog/[slug]`, `/booking`, `/booking/manage`,
`/company`, `/contact`, `/gallery`, `/jobs`, `/jobs/[slug]`, `/news`, `/news/[slug]`,
`/services`, `/services/[slug]`, `/team`, `/team/[slug]`.

`[INCOMPLETE]` — matching these against the Spec's 20 public + 3 legal routes and redirects
(Spec 17.2) needs the full Spec read (C1 item 3).

## 4. Schema changes

Pack-2/F2 is done. Every change below is additive by construction and applied via `push: true`
(real `payload migrate` is broken — see `docs/ENGINE-FIXES.md`), **except `faqs`/`faqs_locales`**,
corrected below.

**Correction (2026-10-06):** this section originally claimed the new database had zero rows in
every collection F2 touched. That's false for `faqs` specifically — a read-only query found 9
existing FAQ documents (18 `faqs_locales` rows), leftover clinic-demo content from an earlier
`pnpm seed:demo` run (`apps/techmirai-web/src/seed/demo/faqs.ts`), already flagged for removal in
Pack-3/F3. See the corresponding `docs/ENGINE-FIXES.md` entry (2026-10-06, "`push: true` asks a
one-time interactive question...") for what this meant for the `category`/`keywords` push and why
it was still safe to proceed. Every other collection/global F2 touched (`team`, `company-info`,
`case-studies`, `customers`, `services`, `blog`, `form-submissions`, the new `chat-answers`) was
confirmed empty at F2 planning time and is unaffected by this correction.

**Further correction (2026-10-06):** the interactive `push: true` prompt for this exact column
pair hung even after the correct answer was chosen, so the `faqs`/`faqs_locales` change was
applied via a hand-written DDL migration instead —
`packages/cms-core/src/payload/collections/migrations/faq-keywords-category.ts`, run once via
`pnpm --filter techmirai-web run db:migrate-faq-keywords-category`. See the
`docs/ENGINE-FIXES.md` entry "the interactive push hung even after picking the correct answer"
for why, and why its `DROP COLUMN category` step is safe only for this disposable demo data.

- `team.ts`: added `visible` (checkbox, default true) — per-person public-visibility switch,
  distinct from the existing `aiVisible` (AI-corpus-only gate).
- `globals/company-info.ts`: added `founder` group (`visible`, `person` relationship → team,
  `yearsInJapan`, `companyFactsSentence`) — single source of truth for Spec §2.3's founder
  propagation points. Also added `businessForm`, `address`, `businessHours`, `mainClient` for
  the Spec 10.6 company-profile fields that didn't exist yet.
- `faqs.ts`: added `faqId` (unique text, stable F01–F26), changed `category` from free text to a
  six-option `select` (Spec §14's six categories), added `keywords` (localized textarea). The
  `category` type change does touch existing rows — 9 leftover clinic-demo FAQ documents, not
  TechMirai content (see the correction note above and the `docs/ENGINE-FIXES.md` entry); safe
  because that data is disposable and already scheduled for removal in Pack-3/F3.
- New collection `chat-answers.ts`: `answerId`, `topic`, `keywords`, `answer`, `nextButtons`,
  `sortOrder`, `active` — holds Spec §16.3's C01–C10 chat-only answers (F01–F26 reuse the FAQ
  fields above instead). Registered unconditionally in `config-factory.ts`.
- `booking/customers.ts`: added optional `company` (Spec 12.4); changed `familyNameKana`/
  `givenNameKana` from static `required: true` to a conditional `validate` (required unless
  `locale === 'en'`) — app-level validation only, no DDL.
- `verticals/recruitment/collections/case-studies.ts`: added `visible` (checkbox, default false)
  — Sadiatec case-study visibility, separate from the generic `active` flag, pending written
  permission (Spec §1 item 14).
- `services.ts`: added `status` (new shared field `fields/status-badge.ts`, select
  available/inDevelopment, default available) — wires the existing `StatusBadge.tsx` component to
  content for the first time.
- `blog.ts`: added `reviewer` group (mirrors `author`) and `contentUpdatedAt` (date). The Spec's
  "AI may read" flag is **not** a new field — it's the existing `aiVisible` field, documented as
  that mapping rather than duplicated.
- `form-submissions.ts`: added one `formType` option, `assessment` — the existing generic
  `payload: json` field already captures the Spec 12.2 form's fields, same as `contact`/`job-apply`.
- `site.config.ts` + `config-factory.ts`: decoupled `features.caseStudies` from
  `recruitmentVertical` (was always `false` since D1 turned recruitment off, which would have
  silently broken Pack-3's Sadiatec case-study page). Logged in `docs/ENGINE-FIXES.md`.
- No schema change: `bookable-services.ts` (the four services are F3 seed data, not a schema
  concern) and `appointments.ts` (`visitType` first/return already matches the Spec).

## 5. Leftover inventory (quick grep counts, apps/ + packages/, excluding node_modules)

- "sakura" (case-insensitive): 22 file hits — `[INCOMPLETE]`, not yet resolved; belongs to a
  later content pack, not D1.
- "sadiatec" (case-insensitive): 4 file hits — `[INCOMPLETE]`, not yet resolved.
- "clinic-demo": resolved by D1 — the app folder was renamed to `apps/techmirai-web` and every
  path/comment reference updated; the handful of remaining hits (in `docs/WORK-ORDER.md`,
  `docs/packs/PACK-1-CLONE.md`, `CLAUDE.md`, and some `*.example` test-fixture domains) are
  intentionally out of scope — see D1's own report for the full justification.
- `'bn'` (Bengali locale key): corrected count was 16 files (this note's original "4 file
  hits" was an undercount from a quick grep, not the real scope) — all resolved by D1; Bengali
  is now removed everywhere as a locale.

## 6. Placeholder register skeleton

Not yet seeded — `docs/PLACEHOLDER-REGISTER.md` was created as an empty header per B6. Appendix
A's 21 starting items (from `docs/WORK-ORDER.md`) plus anything found scanning the Spec for `[`
and `CONFIRM` should be filled in at Pack-2/F1, which is explicitly the step responsible for
this (`docs/packs/PACK-2-FOUNDATION.md`, F1).

## 7. Truth check (Spec 11.5 technology table)

`[INCOMPLETE]` — needs the full Spec read (C1 item 7).

## 8. Chat engine check

`[INCOMPLETE]` — needs a dedicated read of `packages/reception-engine` against Spec section 16
(C1 item 8). Not attempted here.

## 9. Risks and questions for Jamal

Carried over from the Pack-2 investigation already done:

1. Payload's migration CLI is confirmed broken in this monorepo (see `docs/ENGINE-FIXES.md`) —
   `push: true` is the dev workaround; a real migration path is needed before production
   go-live (WO-8), not necessarily before Pack-2.
2. No TechMirai brand assets exist yet: no `TECHMIRAI_BROCHURE.html`, no logo SVG, no favicon
   source anywhere in the repo (checked `docs/_inputs` and the whole tree). D2 (branding) will
   have to use placeholder tokens/logo until these are supplied.
3. R2/Cloudflare storage isn't configured in `.env.local` — fine for local dev, but worth
   confirming before any step that depends on persistent media storage.
4. The full C1 recon (reading the whole Spec + whole codebase) has not been done. Sections 1, 2,
   3, 7, 8 above are incomplete. Recommend doing it properly before Pack-3 (page content) starts,
   since that's where section-by-section Spec mapping actually matters most.

## 10. Step list

No changes recommended to the D1→O3 step list in `docs/WORK-ORDER.md` at this time — nothing
found here suggests splitting or merging steps.
