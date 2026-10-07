# TechMirai Web

A Payload CMS + Next.js site built on the shared `cms-core` engine. Originally cloned from a
clinic-vertical demo (`clinic-demo-standalone`) — the clinic vertical was switched off in
Pack-2/D1.

## Seeding

This app ships one real-content seed script (`pnpm seed`) plus a separate
booking-infrastructure seed (`pnpm seed:booking`). Neither runs
automatically — each is a standalone script you invoke explicitly. The
former clinic-demo seed (`pnpm seed:demo`) was retired in Pack-2/F3.

| Script | Command | Content |
|---|---|---|
| Real content | `pnpm seed` | Page-group scaffolding and structural placeholders (`src/seed/*.ts`, `src/seed/pages/*.ts`). Guarded by `RUN_SEED=true`. |
| Booking infrastructure | `pnpm seed:booking` | `bookable-services`/`resources`/`slots` (`src/seed/booking.ts`). Postgres only. |

### Real Seed

**What it's for.** `src/seed/index.ts` orchestrates one module per page
group — home, product, solutions, how-it-works, integrations, pricing,
security, about, technology, assessment, faq, blog, contact, legal, chat,
booking — writing real-but-empty `pages` collection shells (`layout: []`,
`[TBD: ...]`/`[JA TODO]` meta placeholders per `docs/WORK-ORDER.md` §5) plus
real header/footer nav content (`src/seed/globals.ts`) and Spec-sized
labelled placeholder images (`src/seed/media.ts`). It does **not** write
final Spec marketing copy — that's Phase G/Pack-3's job; see
`docs/packs/PACK-2-FOUNDATION.md`'s F3 step and `docs/SEEDING.md` for the
full guide.

**How to run it.**

```bash
pnpm seed --confirm
# or: SEED_CONFIRM_CLEAR=yes pnpm seed
```

**It never runs on its own.** There is no `postinstall`, `predev` or
`prebuild` hook in any `package.json` in this repo, no CI workflow, no
`buildCommand`/`installCommand` override in `vercel.json` (its only entry is
the `/api/cron/notifications` cron), no `turbo.json` task that depends on it,
no git hook. The only way to run it is to type the command above.

**Five guards, checked in this order**, before anything is read or written:

1. **Not a production build.** Refuses if `NODE_ENV=production` or
   `NEXT_PHASE=phase-production-build`.
2. **Not an automated environment.** Refuses if `CI`, `VERCEL`,
   `GITHUB_ACTIONS` or `NETLIFY` is set.
3. **`RUN_SEED=true`.** The `pnpm seed` script sets this for you; guards
   against invoking `tsx src/seed/index.ts` directly.
4. **A database explicitly declared as a dev database.** Refuses unless
   `DATABASE_ENV=development` is set in `.env.local`.
5. **Explicit confirmation of the destructive step.** The seed *deletes*
   leftover legacy content before it writes (see `lib/clear.ts`), so
   `clearLegacyContent()` additionally requires a `--confirm` flag or
   `SEED_CONFIRM_CLEAR=yes`, typed per invocation.

**Idempotency.** Safe to re-run. Every run first fully clears the named
legacy collections (`doctors`, `treatments`, `services`, `faqs`, `news`,
`blog`, `downloads`, `team`, `testimonials`, demo-prefixed `media`) and the
legacy `pages` slugs, then every page-group module upserts by slug
(create-if-missing, never overwrites) — so content later edited through
`/admin` for Phase G survives future `pnpm seed` runs untouched.

**Orphan-media safe.** `media.ts` reuses an existing `media` doc by
filename instead of re-uploading, so a stable filename never gets
silently suffixed (`-1.png`) on a later run — see `docs/ENGINE-FIXES.md`'s
Pack-2/F3 entry.
