# Engine fixes

## 2026-10-04 — `@next/env` v15 / tsx interop on Windows (fix)

**Symptom:** scripts that boot Payload directly via `tsx` (seed scripts, `db:apply-indexes`)
failed to load `.env.local` on Windows, because `@next/env` v15 sets `__esModule: true` but has
no `.default` export. Payload's `loadEnv.js` does `import x from '@next/env'`, which `tsx`
compiles to `require('@next/env').default` — `undefined` without a shim.

**Fix:** `apps/clinic-demo/fix-next-env-interop.cjs` patches `.default` onto the CJS export
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

**Current workaround (dev only):** `apps/clinic-demo/payload.config.ts` sets the Postgres
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
`apps/clinic-demo/public/media/` (50 demo seed images/PDFs from `pnpm seed:demo`) showed up as
untracked and would have been committed by accident.

**Fix:** added `apps/*/public/media/` under the existing comment. Scoped to `apps/*` (not a bare
`public/media/`) so it still only matches per-app media folders, and keeps working after D1
renames `apps/clinic-demo` to `apps/techmirai-web`.

**Status:** done.
