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

Current routes under `apps/clinic-demo/src/app/(frontend)/[locale]/`:
`/`, `/[slug]`, `/about/[slug]`, `/blog`, `/blog/[slug]`, `/booking`, `/booking/manage`,
`/company`, `/contact`, `/gallery`, `/jobs`, `/jobs/[slug]`, `/news`, `/news/[slug]`,
`/services`, `/services/[slug]`, `/team`, `/team/[slug]`.

`[INCOMPLETE]` — matching these against the Spec's 20 public + 3 legal routes and redirects
(Spec 17.2) needs the full Spec read (C1 item 3).

## 4. Schema changes

Pack-2/F2 will add new collections/fields (team members, founder-visibility switch, FAQ,
chat-only Q&A, bookable services, blog metadata — see `docs/packs/PACK-2-FOUNDATION.md` F2 for
the candidate list). All additive, applied to the new database only, via `push: true` for now
(see `docs/ENGINE-FIXES.md` — real migrations are broken here). Exact final field list decided
at F2 planning time, not here.

## 5. Leftover inventory (quick grep counts, apps/ + packages/, excluding node_modules)

- "sakura" (case-insensitive): 22 file hits
- "sadiatec" (case-insensitive): 4 file hits
- "clinic-demo" (code references, not the folder path itself): 24 file hits
- `'bn'` (Bengali locale key): 4 file hits

`[INCOMPLETE]` — exact file-by-file list and disposition (delete vs. rename vs. intentional)
belongs to D1 (rename/locale cleanup), which will grep these again and resolve each hit.

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
