# TechMirai Web

A Payload CMS + Next.js site built on the shared `cms-core` engine. Originally cloned from a
clinic-vertical demo (`clinic-demo-standalone`) — the clinic vertical was switched off in
Pack-2/D1.

## Seeding

This app ships two independent seed scripts. They never run automatically —
each is a standalone script you invoke explicitly.

| Script | Command | Content |
|---|---|---|
| Real content | `pnpm seed` | This app's actual production content (`src/seed/*.ts`). Guarded by `RUN_SEED=true`. Do not modify for demo/template purposes. |
| Demo / placeholder | `pnpm seed:demo` | Generic, obviously-fake placeholder content for a fresh clone of this template (`src/seed/demo/`). |

### Demo Seed

**What it's for.** `src/seed/demo/` populates every base ("ENGINE-layer")
collection — pages, media, services, faqs, news, blog, testimonials,
downloads, team, and (when enabled) events/gallery — with generic,
clearly-fake placeholder content: "Demo Company Ltd", "This is a sample
services page — replace with real content", programmatically-generated
solid-color placeholder images/PDFs (no real client photography, no
external network calls). It exists so a fresh clone of this template renders
every block variant with realistic density (6-8 FAQs, 6 team members, 5 news
posts, etc.) without needing real client content or manual data entry first.

It deliberately does **not** seed the recruitment vertical (jobs, seminars,
case-studies) — that's vertical-specific, not part of the base template.

**How to run it.**

```bash
pnpm seed:demo --confirm
# or: SEED_DEMO_CONFIRM_CLEAR=yes pnpm seed:demo
```

**It never runs on its own.** There is no `postinstall`, `predev` or
`prebuild` hook in any `package.json` in this repo, no CI workflow, no
`buildCommand`/`installCommand` override in `vercel.json` (its only entry is
the `/api/cron/notifications` cron), no `turbo.json` task that depends on it,
no git hook, and nothing outside `src/seed/` that imports either seed
entrypoint. The only way to run it is to type the command above. Keep it that
way — wiring a content seed into an install or build step is how a live
homepage gets wiped.

**Four guards, checked in this order**, before anything is read or written:

1. **Not a production build.** Refuses if `NODE_ENV=production` or
   `NEXT_PHASE=phase-production-build`.
2. **Not an automated environment.** Refuses if `CI`, `VERCEL`,
   `GITHUB_ACTIONS` or `NETLIFY` is set — belt-and-braces for the point above,
   so a lifecycle hook added by accident later still can't seed anything.
3. **A database explicitly declared as a dev database.** Refuses unless
   `DATABASE_ENV=development` is set in `.env.local`. This is a persistent
   declaration about `DATABASE_URI`, set once — a real production connection
   string would never carry it, so production can't be seeded by accident.
4. **Explicit confirmation of the destructive step.** The seed *deletes*
   before it writes (see `lib/clear.ts`), so `clearDemoContent()` additionally
   requires a `--confirm` flag or `SEED_DEMO_CONFIRM_CLEAR=yes`, typed per
   invocation. Deliberately **not** satisfiable from `.env.local` — a signal
   you can set once and forget is not a second signal. Without it the script
   exits before Payload is even initialised, having touched nothing.

**Which database it expects.** The Neon Postgres dev database named by
`DATABASE_URI` in `apps/techmirai-web/.env.local`, which must also carry
`DATABASE_ENV=development`. (SQLite is retired as an option and is no longer
a usable dev-vs-prod signal.)

**Idempotency.** Safe to re-run. Every run first clears what the seed
previously created — the pages listed in `DEMO_PAGE_SLUGS` (`home`,
`demo-about`, `services`, `faq`); collection docs whose `slug` contains
`demo-`; testimonials tagged `company: "Demo Company Ltd"`; media whose
filename contains `demo-` — then recreates it.

Two collections are the exception: `news` and `services` are **upserted onto
their existing, hand-authored slugs** (`holiday`/`reservation`/`line` and
`Experienced-Professional-Care`/`Treatment-Recovery`/`Easy-Convenient-Visits`)
rather than created fresh. Those docs already existed in the CMS, so creating
new ones would leave the site showing two of every announcement and every
clinic feature. Because they carry no `demo-` prefix, the clear step leaves
them alone and the seed rewrites their fields in place; images attached to
them by hand in the admin are never overwritten.

**Preview URLs** (after running): `/demo-home`, `/demo-about`,
`/demo-services` (also under `/en/...`, though locale text is intentionally
identical across en/ja since it's placeholder-only content — Payload's
locale fallback, enabled in `site.config.ts`, fills in en from the ja
values written by the seed).

**Feature-gated collections.** `events` and `gallery` only exist as Payload
collections when `siteConfig.features.events` / `.gallery` are `true`. The
demo seed checks these flags at runtime and skips those collections (with a
log message) if disabled for this app instance — it will pick them up
automatically once you flip the flag on in `site.config.ts`.

**Adapting for a new vertical.** When cloning this template for a new
client/vertical:

1. Update `site.config.ts` (brand, locales, `features`, `verticals`) for the
   new site first.
2. Run `pnpm seed:demo` to get a fully-populated preview of the base template
   against the new config.
3. Replace placeholder content collection-by-collection through the Payload
   admin UI, or fork `src/seed/demo/*.ts` into your own real-content seed
   (following the pattern in `src/seed/*.ts`) once real content is ready.
4. If the new vertical needs its own collections/blocks (like this repo's
   recruitment vertical under `packages/cms-core/src/verticals/recruitment/`),
   add a sibling `src/seed/demo/<vertical>.ts` module and wire it into
   `src/seed/demo/index.ts` behind its own feature flag, mirroring how
   `events`/`gallery` are gated here.
