# Architecture

This document describes the shared engine as it existed in `clinic-demo-standalone`, the
template this repository (`techmirai-ai-website`) was cloned from in Pack-1. A few specifics
below (the app folder's name, the clinic vertical being switched on) have since changed in this
repo during Pack-2 — noted inline where it matters. It was written by reading the source
directly (package manifests,
`site.config.ts`, `payload.config.ts`, the Payload collection/block/global
definitions, and the seed scripts) rather than from prior documentation.
Anything the author could not verify by reading the code is flagged explicitly
instead of guessed.

## 1. Overview

`clinic-demo-standalone` is a **clinic / medical-practice website template**:
a Next.js + Payload CMS site with pages for services ("departments"), doctors,
treatments, blog/news, team, FAQs, contact forms, and a booking call-to-action.

It was extracted from a larger internal monorepo that hosts a shared
**cms-core engine** used to build multiple client sites. The shared package
lives at `packages/cms-core/` and is published under this project's own
namespace, `@techmirai/cms-core` — the source monorepo's naming has been
scrubbed from code, config, and user-visible strings (branding, admin
placeholders, transactional email copy, CORS allow-list). One piece of that
heritage is still structurally visible, deliberately:

- `packages/cms-core/src/verticals/` contains **two** vertical folders —
  `clinic/` and `recruitment/` — even though this app only uses `clinic`.
  The recruitment vertical (jobs, seminars, case studies) ships in the engine
  but is switched off for this app via `site.config.ts` (`verticals.recruitment
  = false`). This is the clearest evidence in the codebase that the engine is
  designed to support multiple verticals, not just clinics.

## 2. Tech Stack

Versions below are pinned by `pnpm-workspace.yaml` overrides and the app/package
manifests — read directly, not assumed.

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (`^15.3.9`) | App Router, under `apps/techmirai-web/src/app` |
| CMS | **Payload CMS 3** (`^3.84.1`) | Headless, mounted inside the Next app via `@payloadcms/next` |
| UI runtime | **React 19.2.0** | |
| Database (local dev) | **SQLite** via `@payloadcms/db-sqlite` | File at `.data/local.db` (repo root), selected automatically — see below |
| Database (production) | **Postgres** via `@payloadcms/db-postgres` | Selected automatically when `DATABASE_URI` isn't a `file:`/`.db` path |
| Object storage | **Cloudflare R2** via `@payloadcms/storage-s3` | Only enabled when `CLOUDFLARE_R2_*` env vars are all set; otherwise falls back to local disk (`public/media`) |
| Styling | **Tailwind CSS 4** + CSS custom properties | Brand tokens (`site.config.ts` → `packages/cms-core/src/tokens/index.ts`) become `--color-*` / `--font-*` CSS variables consumed by Tailwind utility classes |
| Rich text | `@payloadcms/richtext-lexical` | Payload's Lexical editor |
| i18n | `next-intl` | Locale routing + message catalogs |
| Email | `@payloadcms/email-resend` (Resend) | Form-submission notifications |
| Rate limiting | `@upstash/ratelimit` + `@upstash/redis` | Optional — no-ops if `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset (see `src/lib/rate-limit.ts`) |
| Search on frontend | `fuse.js` | Client-side fuzzy search |
| Package manager | **pnpm** (`pnpm@11.1.3`, workspaces: `packages/*`, `apps/*`) | |
| Monorepo task runner | **Turborepo** (`turbo ^2.9.14`) | `turbo.json` defines `dev`/`build`/`typecheck`/`lint` pipelines |

### Locales actually configured

Confirmed in `apps/techmirai-web/site.config.ts` (as of Pack-2/D1 — this subsection originally
described the inherited `clinic-demo-standalone` template, which had a third, Bengali locale;
D1 removed Bengali completely, so this now reflects the current, corrected state):

```ts
locales: { enabled: ['ja', 'en'], default: 'ja', direction: { en: 'ltr', ja: 'ltr' } }
```

Japanese (default) and English — both left-to-right. Message catalogs exist at both
`apps/techmirai-web/src/messages/{en,ja}.json` and
`packages/cms-core/src/i18n/messages/{en,ja}.json` and are fully translated (no missing or
English-fallback keys in the `ja` catalogs, verified by diffing against `en`). Locale routing
uses `localePrefix: 'as-needed'` and `localeDetection: false` (`src/i18n/routing.ts`), so the
default locale (`ja`) is served unprefixed at `/`, `/en` is prefixed, and the browser's
`Accept-Language` header is ignored.

**Seeded CMS content is still English-only.** The message catalogs above are
fully translated, but `src/seed/demo/*` (the placeholder-content seed run via
`pnpm seed:demo`) writes English "sample"/placeholder text as the `ja`-locale
value for every collection and page it seeds (pages, services, team, news, blog, FAQs,
testimonials, downloads, footer, etc. — no longer doctors/treatments, which D1 removed along
with the clinic vertical). It writes to `locale: 'ja'` specifically so Payload's locale
fallback (`fallback: true`, `defaultLocale: 'ja'`) still resolves `en` requests to real data
instead of blank fields — but the underlying text itself has not been translated. A real
Japanese content pass is required before this seed data represents anything beyond a
structural placeholder.

## 3. Project Structure

```
apps/techmirai-web/            # the deployable Next.js application (the "vertical instance")
  src/app/
    (frontend)/[locale]/...  # public site routes (locale-prefixed via next-intl)
    (payload)/admin/...      # Payload's built-in admin UI, mounted inside the Next app
    api/...                  # custom API routes: forms, revalidate, health, AI query/corpus, search-index
  src/seed/                  # real-content seed scripts (pnpm seed) — not to be modified for template use
  src/seed/demo/              # placeholder-content seed scripts (pnpm seed:demo)
  src/i18n/                  # next-intl routing + request config
  src/lib/                   # payload client accessor, rate limiting, validation schemas, image loader
  public/                    # static assets, brand assets, local media fallback
  site.config.ts             # single source of truth for this instance's branding/features/verticals
  payload.config.ts          # wires site.config.ts into the shared cms-core config factory + chooses DB/storage
  next.config.ts             # Next.js config (next-intl plugin, Payload plugin, image domains, webpack fallbacks)

packages/cms-core/            # the shared "engine" package (@techmirai/cms-core)
  src/blocks/                 # generic, vertical-agnostic page-builder blocks (hero, FAQ, contact form, etc.)
  src/payload/collections/    # generic collections usable by any vertical (pages, services, news, blog, ...)
  src/payload/globals/        # generic Payload globals (header, footer, company-info, seo-defaults)
  src/payload/config-factory.ts  # builds the final Payload Config from a SiteConfig + gating flags
  src/verticals/clinic/       # clinic-specific collections/blocks (doctors, treatments, medical-disclaimer)
  src/verticals/recruitment/  # recruitment-specific collections/blocks (jobs, seminars, case-studies) — present but disabled for this app
  src/schema/site-config.ts   # Zod schema + TypeScript type for SiteConfig (validated at boot)
  src/tokens/                 # design tokens (spacing, radii, breakpoints) + CSS-variable builder from SiteConfig
  src/components/ui/          # shared UI primitives (Button, Card, Container, Heading, Section, ...)
  src/i18n/                   # routing factory + shared message catalogs
```

### Engine vs. vertical split

The split exists so the same `cms-core` package can back multiple client
sites that share ~90% of their functionality (pages, blog, news, FAQs,
contact forms, team, testimonials) while swapping in a different domain
model for the remaining ~10%:

- **Shared ("engine") code** lives directly under `packages/cms-core/src/`
  (`blocks/`, `payload/collections/`, `payload/globals/`). It has no
  knowledge of "clinic" or "recruitment" — it only reacts to generic
  `SiteConfig.features.*` flags (e.g. `features.blog`, `features.team`).
- **Vertical-specific code** lives under `packages/cms-core/src/verticals/<name>/`
  and is only wired in when `SiteConfig.verticals.<name>` is `true`. It's
  gated in exactly two places: `config-factory.ts` (collections/globals) and
  `blocks/registry.tsx` + `payload/collections/pages.ts` (`buildAvailableBlocks`,
  for page-builder blocks).
- This app (`techmirai-web`) originally only turned on `verticals.clinic` (inherited from the
  `clinic-demo-standalone` template). As of Pack-2/D1, both `verticals.clinic` and
  `verticals.recruitment` are off. Both verticals' code still exists in the package and
  typechecks either way — neither's collections, globals, or blocks are registered in this
  app's Payload config, and neither's seed data is created.

## 4. Data Model

All collections Payload actually registers for this app, per
`packages/cms-core/src/payload/config-factory.ts` and `site.config.ts`.

### Always-on (engine) collections

| Collection | Slug | Stores | Key relationships |
|---|---|---|---|
| Pages | `pages` | Generic CMS pages: title, slug, a `layout` block array (page builder), SEO meta group | `layout` blocks may relate to `services`, `doctors`, `treatments`, `team`, etc. |
| Media | `media` | Uploaded files/images (`public/media` locally, R2 in production) | Referenced via `upload` fields from nearly every other collection |
| Services | `services` | Title, excerpt, thumbnail, icon, rich-text body, stats array, CTA group, and its own `layout` block array | Doubles as the **Departments** collection for the clinic vertical (see below) |
| FAQs | `faqs` | Question/answer (rich text), source citations, category, homepage-visibility flag | None |
| News | `news` | Title, excerpt, rich-text content, thumbnail (required), additional images, category, publish date | None |
| Users | `users` | Payload auth-enabled CMS accounts; `role` is `admin` or `editor` | None |
| Inquiries | `inquiries` | Contact / job-apply form submissions (name, email, message, status) — contains PII | None |
| Form Submissions | `form-submissions` | Generic raw-JSON store for contact/job-apply/seminar/download-gate form payloads, plus email routing on `afterChange` | None |

### Optional (feature-flag-gated) engine collections

Registered only when the matching `site.config.ts` → `features.*` flag is `true`.

| Collection | Slug | Gate flag | Stores |
|---|---|---|---|
| Blog | `blog` | `features.blog` (on) | Blog posts: title, subtitle, excerpt, rich-text content, author group, read time |
| Testimonials | `testimonials` | `features.testimonials` (on) | Quote, author group, company, rating |
| Events | `events` | `features.events` (**off**) | Title, date range, location, category |
| Gallery | `gallery` | `features.gallery` (**off**) | Image, alt, caption, category |
| Downloads | `downloads` | `features.downloads` (on) | Downloadable file, title, description, category |
| Team | `team` | `features.team` (on) | Name, title, photo, bio, `featured` flag |

### Clinic-vertical collections (this app's domain-specific data)

Registered only because `site.config.ts` → `verticals.clinic = true`.

| Collection | Slug | Stores | Key relationships |
|---|---|---|---|
| Doctors | `doctors` | Name, title, photo, bio, credentials array, years of experience, languages, consultation-hours array (day + hours), slug, sort order, active flag | `specialties` is a `hasMany` relationship **to `services`** — i.e. a doctor's specialties are represented as Department (Services) entries, not a separate taxonomy |
| Treatments | `treatments` | Name, rich-text description, duration, slug, sort order, active flag | `department` is a **required** relationship to `services` (one department per treatment) |

**Departments do not have their own collection.** Confirmed directly in code:
`DoctorsCollection.specialties` and `TreatmentsCollection.department` both use
`relationTo: 'services'`, and both files' `admin.description` text says so
explicitly ("Departments are represented by the shared Services collection").
`Treatments` also deliberately has no price field — a comment in
`treatments.ts` notes medical-advertising rules can restrict displaying prices
for medical services, and that decision was left for a human, not decided by
the code.

### Recruitment-vertical collections (present in the engine, not registered here)

`jobs`, `seminars`, `case-studies` exist under
`packages/cms-core/src/verticals/recruitment/collections/` and are imported by
`config-factory.ts`, but are only added to the `collections` array when
`siteConfig.verticals.recruitment` is `true`. For this app that flag is
`false`, so **these collections do not exist in this app's database or admin
UI.**

### Globals

| Global | Slug | Gate | Stores |
|---|---|---|---|
| Header | `header` | always | Logo, nav items (incl. mega-menu columns), header CTA button |
| Footer | `footer` | always | Footer link columns, contact email, office address, copyright text |
| Company Info | `company-info` | always | Legal name, registration number, founded year, capital, multi-office array (address, phone, map embed, nearest stations) |
| SEO Defaults | `seo-defaults` | always | Default title template, description, OG image |
| Medical Disclaimer | `medical-disclaimer` | `verticals.clinic` only | Single localized rich-text field, shown site-wide (footer) — **placeholder content, see §7** |

## 5. Block System

Every page-builder block in `packages/cms-core/src/blocks/` (and the vertical
equivalents under `src/verticals/<name>/blocks/`) follows the same four-file
pattern:

| File | Responsibility |
|---|---|
| `config.ts` | The Payload `Block` definition — field schema shown in the admin UI |
| `types.ts` | The plain TypeScript prop interface the **rendered component** expects (already adapted, not raw Payload data) |
| `adapter.ts` | A pure function `(raw: unknown) => <Type from types.ts>` that takes Payload's raw stored/populated document and defensively maps it into the component's prop shape (handles missing fields, un-populated relationships, locale fallbacks, Lexical→plain-text conversion, etc.) |
| `component.tsx` | The React component that renders the block, typed entirely against `types.ts` — it never touches raw Payload shapes |

`packages/cms-core/src/blocks/registry.tsx` is the single place that wires a
block's Payload `slug` string to `adapter(raw) → component` at render time;
`buildAvailableBlocks()` in `packages/cms-core/src/payload/collections/pages.ts`
is the single place that decides which blocks are *registered* with Payload
(and therefore selectable in the admin UI) for a given `SiteConfig`. The two
lists must stay in sync by construction — a block only in the registry but not
in `buildAvailableBlocks` would render fine if data existed, but couldn't be
added through the admin; a block in `buildAvailableBlocks` but not the
registry would save fine but render nothing.

### Full block inventory

**Generic / shared blocks** (available regardless of vertical, some gated by `features.*`):
`hero`, `stats`, `services-grid`, `bento-grid`, `timeline`, `logo-cloud`,
`cta-banner`, `rich-text`, `faq`, `contact-form`, `news-list`, `page-hero`,
`image-text-split`, `stats-bar`, `ceo-message`, `affiliates`, `gallery-grid`,
`history`, `contact-info-card`, `mission-statement`, and feature-gated:
`team-grid` (`features.team`), `event-list` (`features.events`), `gallery`
(`features.gallery`), `hours-location` (`features.locations`),
`company-profile` (`features.company`), `downloads-grid`
(`features.downloads`), `blog-teaser` (`features.blog`).

**Recruitment-vertical blocks** (imported by the registry, but never
registered for this app since `verticals.recruitment` is off):
`case-study-carousel`, `case-studies-grid`, `compliance-grid`,
`business-line-list`, `placement-statistics`.

**Clinic-vertical blocks** (registered for this app):

- `doctor-grid` — renders a configurable grid of `doctors` (relationship
  picker, 3 or 4 columns, optional bio text)
- `department-list` — renders a configurable grid of **`services`** entries
  (the relationship field is literally named `departments` but points at
  `relationTo: 'services'`)
- `treatment-list` — renders a configurable list of `treatments`

**Cross-vertical but clinic-relevant blocks:**

- `booking-cta` — an external booking link-out (heading, subheadline, button,
  note). Explicitly **not** clinic-specific in the code (comment: "any
  vertical [...] can use it"); gated by `features.bookingWidget`, not
  `verticals.clinic`. Reads `SiteConfig.integrations.bookingProviderUrl` —
  see §7 for its placeholder value.
- `hours-location` — shows address/hours/phone/map, sourced from
  `SiteConfig.contact.*`; gated by `features.locations`, used heavily by the
  clinic vertical but not clinic-specific either.

## 6. Configuration

`apps/techmirai-web/site.config.ts` is the **single source of truth** for this
app instance: branding (name, tagline, domain, colors, typography), enabled
locales, feature flags, vertical flags, nav/social links, contact details,
form routing, legal page slugs, SEO defaults, and third-party integration
settings. It is validated against `siteConfigSchema` (Zod, defined in
`packages/cms-core/src/schema/site-config.ts`) the moment it's passed into
`buildCmsConfig()` — an invalid `site.config.ts` fails fast at Payload config
build time rather than producing a subtly broken site.

### The `verticals.clinic` flag and how gating works

```ts
// site.config.ts
const recruitmentVertical = false
const clinicVertical = true
verticals: { recruitment: recruitmentVertical, clinic: clinicVertical }
```

`config-factory.ts` (`buildCmsConfig`) reads `siteConfig.verticals.clinic` in
exactly two places:

1. **Collections** — `...(siteConfig.verticals.clinic ? [DoctorsCollection, TreatmentsCollection] : [])`
   appended to the optional collections array.
2. **Globals** — `...(siteConfig.verticals.clinic ? [MedicalDisclaimerGlobal] : [])`
   appended to the globals array.

Blocks are gated separately, in `buildAvailableBlocks()`
(`packages/cms-core/src/payload/collections/pages.ts`), which both the
`pages` and `services` collections use to build their `layout` block-array
field:

```ts
...(siteConfig.verticals.clinic ? [DoctorGridBlockConfig, DepartmentListBlockConfig, TreatmentListBlockConfig] : [])
```

A code comment in `config-factory.ts` explains *why* this list must exactly
match what's registered: a block field that references a collection the app
doesn't have (e.g. a relationship to `doctors` when `verticals.clinic` is
off) fails Payload's config sanitizer **at server boot**, not at TypeScript
compile time — so the vertical flags for collections and blocks must be
flipped together, never independently.

`site.config.ts` also flags a convention worth preserving: `features.jobListings`,
`features.seminars`, `features.recruit`, and `features.caseStudies` are all
set to mirror `recruitmentVertical` directly rather than being toggled
independently, matching the convention used by other apps built on this
shared engine.

## 7. Known Placeholders / Pre-Launch Requirements

Two placeholders are explicitly flagged in the code itself as **must-fix
before a real clinic client launch**. This document does not attempt to
supply real replacement content for either — that requires legal review and
a real business decision, respectively.

### Medical disclaimer (legal copy required)

- **Location:** `packages/cms-core/src/verticals/clinic/globals/medical-disclaimer.ts`
  — the `MEDICAL_DISCLAIMER_PLACEHOLDER` constant, used as the default value
  of the `medical-disclaimer` global's `disclaimer` field.
- The field's own admin description states it is shown on every page (via
  the footer) and is a "legally-required medical advertising disclaimer" that
  "must be replaced with reviewed, jurisdiction-specific text before this
  site goes live for a real clinic client." A code comment ties this to
  Japan's 医療広告ガイドライン (medical advertising guidelines) as the kind of
  regulation that can require jurisdiction-specific review, while noting
  equivalent rules can exist elsewhere too.
- The comment also references `docs/adr/001-foundation-choices.md` as where
  this was raised as an open question — **that file does not exist in this
  repository** (it presumably exists in the source monorepo this project was
  extracted from). Flagged here as a dangling reference rather than resolved.

### Booking provider URL (real provider required)

- **Location:** `apps/techmirai-web/site.config.ts`,
  `integrations.bookingProviderUrl`, currently `'https://example.com/book-placeholder'`.
- A `// TODO` comment directly above it in `site.config.ts` says: "replace
  with real booking provider before real client launch."
- Consumed by the `booking-cta` block (`packages/cms-core/src/blocks/booking-cta/`)
  as an external link-out — the block does not implement any scheduling logic
  itself, it only links to whatever URL is configured here.

### Other placeholders noticed while reading (not part of the two above, flagged for completeness)

- `site.config.ts` → `nav.socialLinks` all point at
  `*-sakura-sekkotsu-placeholder` handles on facebook/instagram/youtube/linkedin.
- `site.config.ts` → `contact.mapEmbedUrl` is a generic "Tokyo Station"
  Google Maps embed, not a real clinic address.

## 8. Local Development

```bash
pnpm install                 # installs the whole workspace (apps/* + packages/*)
# set up apps/techmirai-web/.env.local (gitignored — no committed .env.example exists in this repo)
pnpm dev                     # turbo dev → runs `next dev` for apps/techmirai-web
pnpm seed:demo               # populates every base collection with generic placeholder content
```

`.env.local` (as currently configured for this checkout) points
`DATABASE_URI` at `file:../../.data/local.db` — i.e. a SQLite file that lives
at the **monorepo root**, not inside `apps/techmirai-web/`.

**Why `.data/local.db` lives outside `apps/techmirai-web/` — do not move it back.**
Next's dev server file watcher watches the app's project directory (and, by
extension, anything `next.config.ts`'s `transpilePackages` pulls in) for
source changes and triggers a recompile/reload on any change it detects.
Every write Payload makes to the local SQLite file — which happens on nearly
every request, since Payload persists things like access logs and document
reads — looks like a filesystem change. If the `.db` file sits inside the
watched app directory, the dev server treats every database write as a
source-code change and enters a recompile/reload loop, in the worst case
making the app effectively unusable in dev. Putting the database file at the
repo root under `.data/`, entirely outside `apps/techmirai-web/`, removes it
from the watched tree and stops this loop. `local.db` and `.data` are both
listed in the root `.gitignore`. If a future contributor "cleans this up" by
moving `local.db` back under `apps/techmirai-web/`, the reload loop will return.

`payload.config.ts` picks the database adapter automatically based on the
shape of `DATABASE_URI` — any value starting with `file:` or ending in `.db`
selects `sqliteAdapter`; anything else selects `postgresAdapter`. There is no
separate flag for this.

## 9. Reception System (Hybrid FSM + AI Fallback)

`site.config.ts` → `reception` (gated by `features.aiAgent && reception.enabled`)
configures a chat widget that answers visitor questions via three tiers, each
a fallback for the one before it. This section documents the mechanism; see
README §3 for the conceptual overview.

### 9.1 Engine vs. flow split

Same engine/vertical split philosophy as §3's block system, applied to a
state machine instead of a component:

- **`packages/reception-engine/`** (`src/engine.ts`, `src/types.ts`) — a
  generic, framework-agnostic FSM. `start()`/`advance()`/`getInteraction()`
  operate purely on a graph of typed nodes (`message`, `choice`, `input`,
  `faq`, `capture`, `handoff`, `end`, `component`, `link`, `refusal`,
  `triage`, `ai-fallback` — 11 node types total). It has no `fetch`, no
  React, no Payload dependency, and no knowledge of clinics or FAQs — it was
  ported from a sibling project (`sadiatec-assistant`), which is why it's a
  separate workspace package rather than living under `verticals/clinic/`.
- **`packages/cms-core/src/verticals/clinic/reception/`** — everything with
  real content and I/O: the clinic's actual conversation graph (`flow.ts`),
  free-text screening (`screening.ts`), fuzzy matching (`faq-matcher.ts`),
  the FAQ content (`faq-content.ts`, §10), the Groq client/prompt (`ai/`),
  and the React UI (`ui/`). Exposed to the app via three subpath exports on
  `@techmirai/cms-core` (see its `package.json` `exports` map): `./reception`,
  `./reception/ai`, `./reception/ui`.
- **`apps/techmirai-web/src/app/api/reception/ai/route.ts`** is the only
  server route. The FSM itself runs client-side (`ui/useReceptionEngine.ts`
  drives `packages/reception-engine`'s `advance()` in the browser); only the
  Groq call needs a server round-trip, to keep `GROQ_API_KEY` off the
  client.

### 9.2 The flow graph

`flow.ts` exports `clinicReceptionFlow`: `greeting → menu` (book / faq /
manage) → `faq.menu` with 6 static FAQ buttons (hours / access / parking /
prices / bring / first-visit) plus `faq.ask` ("ask something else" — free
text), `faq.staff` ("talk to staff" — LINE link node, `href` populated at
render time, see §9.6), and an "other" option that routes straight to
`refusal.medical` without ever reaching triage.

### 9.3 Free-text triage and fuzzy matching

`faq.ask` (an `input` node) leads to `faq.ask.triage` (a `triage` node). The
engine itself never inspects the visitor's text — a `triage` node only knows
how to call a host-injected `TriageResolver` and then follow one of three
graph-declared destinations: the node's `refuseTo`, one of its `allow` list,
or its `aiFallback`. `triage.ts`'s `createClinicTriageResolver` composes two
checks in order:

1. `screening.ts`'s `screenQuestion` — medical language wins outright and
   short-circuits straight to `refusal.medical` (§9.4) before matching is
   even attempted.
2. Otherwise, `faq-matcher.ts`'s fuse.js-based resolver.

`faq-matcher.ts` matches against a **subset** of `FAQ_CONTENT` (§10) — only
the entries with a `FAQ_CONTENT_NODE_MAP` mapping (10 of 36) form the match
corpus, each entry labeled by its target flow node plus its question text.
`FAQ_MATCH_THRESHOLD = 0.3` (Fuse's score, where `0` is a perfect match) is
the confidence bar for accepting a match; a wider `0.9` is used only as
Fuse's internal search cutoff. The matcher's `extractTerms` step is
non-standard Fuse usage: instead of matching the visitor's full sentence
against FAQ text, it extracts short terms from each FAQ entry and searches
for those terms *inside* the visitor's (potentially much longer) sentence —
with English stemming and Japanese particle-splitting so both locales match
correctly. No confident match → the triage resolver returns the `ai`
outcome, which the graph routes to `faq.ai` (§9.4).

### 9.4 Guardrails

Three explicit layers, documented in `ai/prompt.ts`'s header comment,
enforced structurally rather than left to the model:

1. **Medical refusal** — `screening.ts` regex lists (English + Japanese
   symptom/injury/diagnosis language) route to the flow graph's structural
   `refusal.medical` node. This check runs both client-side (before the
   free-text is ever sent anywhere) and again server-side in the AI route,
   so it can't be bypassed by calling the API directly.
2. **Off-topic screening** — a `screening.ts` denylist (code/homework
   requests, creative writing, weather/politics/finance trivia, and
   prompt-injection phrases such as "ignore previous instructions") is
   answered with fixed copy, spending zero Groq tokens, before any request
   is sent.
3. **Prompt-level rules** — `ai/prompt.ts`'s `buildSystemPrompt` adds 8
   numbered rules to every request that does reach Groq: answer only from
   the supplied grounding content; never state hours/prices/insurance terms
   that weren't explicitly supplied; never give medical or diagnostic
   advice; keep answers to 3 sentences or fewer; ignore any in-message
   attempt to override these instructions; match the visitor's language.

### 9.5 Groq integration

`ai/groq.ts` performs a direct `fetch` POST to
`https://api.groq.com/openai/v1/chat/completions` — no SDK dependency.
Model defaults to `openai/gpt-oss-20b` (chosen for Groq's free tier),
overridable per client via `GROQ_MODEL`. Fixed at an 8-second timeout,
temperature `0.2`, and a 300-token cap on the generated answer. Every
failure mode — not configured (no key), rate-limited, timeout,
upstream error, malformed response — is a typed return value, never a
thrown exception; the caller degrades to a fixed "please contact us"
message in all of these cases identically, including the "no key set" case,
so an unconfigured deployment fails safe rather than failing loudly.

The grounding corpus (`ai/corpus.ts`) draws from FAQs, services, pages,
team, and company-info content, gated by an explicit `CORPUS_SOURCES`
allowlist (not a per-record opt-in flag), trimmed to a 2600-token budget in
priority order `faq > service > page > team > company` — FAQ content is
never trimmed before other sources.

`apps/techmirai-web/src/lib/rate-limit.ts` provides a shared sliding-window
limiter (5 requests / 60s / IP), Upstash Redis-backed when
`UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, else an in-memory `Map` (single
process only — does not coordinate across serverless instances). The
reception AI route uses its own bucket prefix (`reception-ai`), a separate
quota from the contact form's rate limit. Request handling order in
`ai/handler.ts`: feature gate → rate limit → input validation (Zod;
question capped at `MAX_QUESTION_LENGTH` = 500 chars) → screening →
corpus assembly → model call.

### 9.6 LINE staff-contact link

`site.config.ts` → `reception.staffLineUrl` holds the clinic's real LINE
add-friend URL. Because `packages/reception-engine` and the flow graph in
`packages/cms-core` are both vertical/config-agnostic by design, the graph's
`faq.staff` link node ships with an empty `href` — `ui/useReceptionEngine.ts`
(`withStaffLineAvailability`) substitutes the real URL from `site.config.ts`
at render time, and **removes the "talk to staff" menu option from the flow
entirely** if `staffLineUrl` is unset, rather than showing a dead link.

## 10. FAQ Content System

`packages/cms-core/src/verticals/clinic/reception/faq-content.ts` is a
static TypeScript module — 36 English+Japanese Q&A entries
(`FaqContentEntry { id, category, question: Record<'en'|'ja', string>,
answer: Record<'en'|'ja', string> }`) across 5 categories, transcribed
verbatim from the client's content handoff. Per the file's own header
comment, it is the single source of truth for reception-widget FAQ content,
and it feeds all three of §9's FAQ-touching consumers:

- `faq-matcher.ts` (§9.3) — the `FAQ_CONTENT_NODE_MAP` subset (10 of 36)
  becomes the fuzzy-match corpus.
- `faq-answers.ts` — the same mapped subset supplies the displayed text for
  the flow's 6 button-driven FAQ nodes (a node can be backed by more than
  one entry — e.g. `faq.hours` is built from two entries).
- `ai/corpus.ts` (§9.5) — all 36 entries ground the AI fallback.

**This is a deliberate, explicit narrowing of scope, not an oversight:** a
`TriageOutcome` naming any flow node other than one of the 6 mapped ones is
refused by the engine (enforced by `faq.ask.triage`'s `allow` list), so an
FAQ entry with no `FAQ_CONTENT_NODE_MAP` mapping can never be a free-text
match target — it can still surface to a visitor via the AI-grounding path.

### What this replaced, and what it didn't

The file's header comment states explicitly that the previous CMS-backed
FAQ resolution path for the reception widget (`CLINIC_FAQ_SLUGS`,
`resolveClinicFaqAnswers`, a live `faqs` Payload query at request time) "has
been retired," while noting the `faqs` Payload collection itself, and the
site's separate public `/faq` page built on it, were deliberately kept.
Confirmed independently in `apps/techmirai-web/src/seed/demo/index.ts`:
`seedDemoFAQs` (writes to the `faqs` collection) and `seedDemoFAQPage` are
still both called. **Net effect:** the `faqs` collection (§4's data model)
and the public `/faq` page are unaffected, still CMS-backed, and edited
through `/admin` as before — only the reception widget's FAQ source moved
off that path onto the static file above. Editing the `faqs` collection has
no effect on what the reception widget says, and editing
`faq-content.ts` has no effect on the public `/faq` page.

The comment also references "the delivery report" (documenting what was
checked before retiring the CMS path) and a repo-root `FAQ-list.txt` (the
original client handoff document) as further reading. **Neither file exists
in this checkout** — both are dangling references left over from wherever
this work was originally done; do not cite either path as present here
without checking first.

## 11. Seed Safety Mechanism

`pnpm seed:demo` is destructive — it clears existing demo-tagged content
before reseeding — so `apps/techmirai-web/src/seed/demo/index.ts` (the
orchestrator) and `apps/techmirai-web/src/seed/demo/lib/clear.ts` (the confirm
gate) enforce four independent guards, checked in this order, before Payload
is even initialized:

1. **Build-time no-op:** `NODE_ENV === 'production'` or
   `NEXT_PHASE === 'phase-production-build'` silently skips — not an error,
   just a no-op, so the script can't interfere with a production build
   pipeline that happens to import it.
2. **CI/auto-trigger blocking:** if any of `CI`, `VERCEL`, `GITHUB_ACTIONS`,
   or `NETLIFY` is set, the script `console.error`s and `process.exit(1)`s.
   This is what stops the script from ever firing as an unintended side
   effect of a deploy or CI run.
3. **Dev-database declaration:** requires `DATABASE_ENV=development` set in
   `.env.local` (a persistent, deliberately-typed-once value, distinct from
   `DATABASE_URI`). A code comment notes this exists because SQLite-vs-Postgres
   stopped being a reliable dev/prod signal once Neon Postgres became the
   standing development database — the adapter choice alone can no longer
   prove "this is a dev database."
4. **Explicit per-run confirmation:** `assertClearConfirmed()` in
   `clear.ts`, satisfied by either the CLI flag `pnpm seed:demo --confirm`
   or the env var `SEED_DEMO_CONFIRM_CLEAR=yes`. This is deliberately **not**
   settable from `.env.local` — a code comment notes that putting it there
   would make it stop functioning as a second, independent signal from
   guard 3. Without confirmation, the script prints exactly what it would
   clear (the `pages` collection's home/demo-about/services/faq documents;
   every slug-tagged document in doctors/treatments/services/faqs/news/blog/
   downloads/team; plus demo testimonials/gallery/events/media) and exits
   without touching the database.

`pnpm seed` (real-content seeding, `apps/techmirai-web/src/seed/index.ts`) is
currently a stub and is not gated by this mechanism (there's nothing
destructive in it yet). `pnpm seed:booking` is a separate script gated only
by refusing to run against SQLite (see §8's Postgres-vs-SQLite note) — it is
not part of the `--confirm` mechanism above, and is documented as idempotent
and safe to re-run.

## 12. Deployment

Based on what production wiring exists in the code (env vars discovered by
grepping `process.env` usage across `apps/techmirai-web` and `packages/cms-core`):

- **Database:** Postgres, via `@payloadcms/db-postgres`, selected automatically
  once `DATABASE_URI` is a real Postgres connection string. `payload.config.ts`
  special-cases `rlwy.net` hostnames (Railway) to disable strict SSL
  cert verification (`rejectUnauthorized: false`) — the only hosting
  provider named anywhere in the config.
- **Storage:** Cloudflare R2 (S3-compatible), via `@payloadcms/storage-s3`,
  enabled only when all four of `CLOUDFLARE_R2_BUCKET`,
  `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, and
  `CLOUDFLARE_R2_ENDPOINT` are set; otherwise media falls back to local disk
  (`public/media`), which is **not** durable across most hosting platforms'
  deploys — flagged as something to confirm is genuinely acceptable for
  whatever production target is chosen, or R2 must be configured.
- **Environment variables:** `apps/techmirai-web/.env.example` is now
  committed and documents every variable the app reads, grouped by purpose
  with required-vs-optional called out inline — cross-check against that
  file directly rather than this list. Notably, beyond the database/storage/
  email vars above: `GROQ_API_KEY`/`GROQ_MODEL` (reception AI fallback, §9.5),
  `LINE_CHANNEL_SECRET`/`LINE_CHANNEL_ACCESS_TOKEN`/`LINE_LOGIN_CHANNEL_ID`
  (LINE webhook/LIFF), `UPSTASH_REDIS_REST_URL`/`_TOKEN` (rate limiting),
  `TURNSTILE_SECRET_KEY` (anti-spam), `AI_AGENT_BASE_URL`/`AI_AGENT_API_KEY`
  (a dormant, unused external-agent proxy — not the reception AI path),
  `AI_CORPUS_SECRET` (gates the external `/api/ai/corpus` GET endpoint).
- **Hosting target: uncertain.** Nothing in this repository pins a specific
  host. `payload.config.ts`'s CORS/CSRF allow-list is derived entirely from
  `NEXT_PUBLIC_SERVER_URL` and `site.config.ts`'s `site.domain` (plus
  localhost for dev) — no hardcoded third-party preview domain remains.
  Whoever deploys this should set `NEXT_PUBLIC_SERVER_URL` and
  `site.config.ts`'s `site.domain` to this project's real domain.
- `next.config.ts` externalizes heavy server-only packages
  (`payload`, both DB adapters, `sharp`, `drizzle-orm`/`drizzle-kit`, `pg`,
  `pino`, `better-sqlite3`) via `serverExternalPackages` — relevant to
  whatever Node runtime/hosting target is chosen, since these must run in a
  real Node environment (not edge).

## 13. Known Limitations

- **No shared-history connection to the source engine or sibling verticals.**
  This repository was extracted as a standalone project from a larger
  monorepo that also builds other vertical sites (at minimum a recruitment
  vertical — visible in `packages/cms-core/src/verticals/recruitment/`
  even though unused here). This extraction is a **snapshot**, not a subtree
  or submodule with ongoing history: bug fixes, security patches, or new
  shared blocks/collections added to `cms-core` in that other project (or in
  future vertical templates built from it) will **not** propagate here
  automatically. Any fix made upstream has to be manually ported into this
  repo's copy of `packages/cms-core`, and vice versa.
- **The recruitment vertical code is dead weight here.** It is fully present,
  typechecked, and maintained as part of `cms-core`, but entirely unreachable
  in this app (`verticals.recruitment = false`). It adds surface area to
  read/maintain without being exercised by this app's tests or seed data.
- **Demo-seeded content is placeholder English, not Japanese**, even though
  it's stored under the `ja` locale so Payload's fallback resolves correctly
  for all three locales — see §2's "Seeded CMS content is still English-only"
  note. A real Japanese (and Bengali) content pass is required before launch,
  and is currently in progress section by section (i18n message catalogs
  themselves are fully translated; CMS-seeded content is not).
- **Two hardcoded content spots in `services-grid` awaiting a CMS field.**
  `packages/cms-core/src/blocks/services-grid/component.tsx` hardcodes, per
  locale, both the 8 "symptom card" entries (title/short description/details)
  and the bottom CTA copy directly in the component rather than exposing
  them as CMS fields. A code comment on the Japanese text for both notes it
  is an approximate translation pending client review — no Japanese source
  document exists for either yet.
- **Business name inconsistency between `site.config.ts` and hardcoded
  component copy.** `site.config.ts` uses 「さくら接骨院」(sekkotsu-in)
  consistently across `site.name`, the SEO title template, and the
  reception greeting. `services-grid/component.tsx`'s hardcoded Japanese
  copy instead uses 「さくら整骨院」(seikotsu-in) — a different kanji for a
  related but distinct term, not a typo-level variant. Unreconciled as of
  this writing; needs a decision on the correct name before a real client
  launch.
