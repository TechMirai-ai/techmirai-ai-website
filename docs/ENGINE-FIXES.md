# Engine fixes

## 2026-10-04 — `@next/env` v15 / tsx interop on Windows (fix)

**Symptom:** scripts that boot Payload directly via `tsx` (seed scripts, `db:apply-indexes`)
failed to load `.env.local` on Windows, because `@next/env` v15 sets `__esModule: true` but has
no `.default` export. Payload's `loadEnv.js` does `import x from '@next/env'`, which `tsx`
compiles to `require('@next/env').default` — `undefined` without a shim.

**Fix:** `apps/techmirai-web/fix-next-env-interop.cjs` patches `.default` onto the CJS export
whenever it's missing, loaded via `NODE_OPTIONS="--require ./fix-next-env-interop.cjs"` in the
`seed`, `seed:demo`, `seed:booking` and `db:apply-indexes` package.json scripts. `@next/env` was
also pinned as an explicit `dependencies` entry (previously only a transitive dep of `next`) so
pnpm resolves it reliably on Windows.

**Status:** done, keep as-is.

## 2026-10-04 — Payload migration CLI broken in this monorepo (known gap, not fixed)

**Symptom:** `payload migrate` / `payload migrate:status` fail outright. The bundled CLI
internally pins an older `tsx` that can't resolve this repo's cross-package extensionless
imports (e.g. `config-factory.ts`'s `../schema/site-config`). No `migrations/` directory has
ever been generated.

**Current workaround (dev only):** `apps/techmirai-web/payload.config.ts` sets the Postgres
adapter's `push: true` instead of the committed `push: false`, so Payload auto-syncs the schema
on boot. This is how the dev database got its tables.

**Why this isn't fixed here:** the `payload.config.ts` comment marks this as a known gap, with a
confirmed working alternative for one-off DDL (boot Payload directly via the same `tsx` +
`fix-next-env-interop.cjs` invocation the seed scripts use, and call `applyBookingIndexes()`
etc. directly). The comment explicitly says a production-safe automated migration path does not
exist yet and "must be fixed before WO-8" (production go-live) — i.e. it's a pre-launch
blocker, not a Pack-2 task.

**Status:** open. `push: true` stays for development. Revisit before WO-8.

## 2026-10-04 — `.gitignore` missing its own media-ignore pattern (fix)

**Symptom:** `.gitignore` has a comment (above the playwright section) explaining that
generated/uploaded media under `public/media/` "shouldn't be committed — R2 is the real storage
backend once configured," but no actual glob pattern was ever added underneath it. As a result
`apps/techmirai-web/public/media/` (50 demo seed images/PDFs from `pnpm seed:demo`) showed up as
untracked and would have been committed by accident.

**Fix:** added `apps/*/public/media/` under the existing comment. Scoped to `apps/*` (not a bare
`public/media/`) so it still only matches per-app media folders regardless of what the app
folder is named (it already survived D1's rename of `apps/clinic-demo` to `apps/techmirai-web`
unchanged, by design).

**Status:** done.

## 2026-10-04 — D1: `Footer.tsx` unconditionally fetched the clinic-only `medical-disclaimer` global (fix)

**Symptom:** found live while verifying D1's Gate 3 (clear `.next`, boot `pnpm dev`, check for
console errors). After turning off `verticals.clinic`, `/en` returned 200 but logged
`[Footer] medical-disclaimer global unavailable: Error [APIError]: The global with slug
medical-disclaimer can't be found` on every render — `Footer.tsx` called
`payload.findGlobal({ slug: 'medical-disclaimer' })` unconditionally and only caught the
resulting error, it never checked whether the global was actually registered.

**Fix:** guarded the fetch behind `siteConfig.verticals.clinic` (the same flag
`config-factory.ts` already uses to register `MedicalDisclaimerGlobal` in the first place), so
it's skipped entirely instead of fetched-then-caught every request.

**Status:** done. This was not caught by the earlier static-analysis risk review (which checked
seed scripts only) — a reminder that turning any vertical flag off needs an actual `pnpm dev`
boot check, not just a grep for the collection/block slugs.

## 2026-10-04 — D1: `push: true` crashed once on a stale FK-constraint-drop statement (resolved itself)

**Symptom:** the first `pnpm dev` boot after turning off `verticals.clinic` crashed with
`Failed query: ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_doctors_fk"` /
`constraint "pages_rels_doctors_fk" of relation "pages_rels" does not exist` (Postgres error
42704). Payload's `push: true` schema sync generates its DDL plan from one snapshot, but
dropping the `doctors` table in an earlier statement of the same plan appears to auto-drop the
dependent FK constraint on `pages_rels` as a side effect — so the plan's own later, explicit
`DROP CONSTRAINT` step for that same (already-gone) constraint then fails.

**Resolution:** restarting `pnpm dev` (which makes `push: true` recompute the diff against the
now-current schema) completed cleanly — the stale constraint-drop step was no longer in the
plan, and the two orphaned columns it needed to drop (`pages_rels.doctors_id`,
`pages_rels.services_id` — unused once `doctor-grid`/`department-list` were unregistered) were
removed successfully. Confirmed via a direct read-only query against `pages_rels` afterward.

**Status:** not a code fix — a one-time, self-resolving hiccup in `push: true`'s diffing on this
specific kind of structural change (dropping a whole collection that other tables have FKs
into). Logged here as a known quirk: if a future vertical-flag flip crashes the same way, a
`pnpm dev` restart is the fix, not a rollback. Related to the already-logged "migration CLI
broken" gap above — another data point that `push: true` is a dev-only stopgap, not production-
grade schema management.
