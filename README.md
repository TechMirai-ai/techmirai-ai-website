# TechMirai AI Reception website

The bilingual (Japanese default, English under `/en`) marketing and lead site for TechMirai's **AI Reception** product, built from the Content Spec. It is a Next.js 15 (App Router) site on Payload CMS v3, in a pnpm and Turborepo monorepo.

**Status at handoff (2026-10-20, commit `269b1ab`): not ready to launch.** One **hard blocker** (production database schema, section 5) needs a decision from Jamal before any deploy. The full list of open items is in [docs/HANDOFF.md](docs/HANDOFF.md).

---

## 1. Requirements

| Item | Value |
|---|---|
| Node.js | Not pinned in the repo (no `engines` field, no `.nvmrc`). Everything here was run on **Node v24.21.0**. |
| pnpm | **11.1.3**, fixed by `packageManager` in the root `package.json` |
| Database | Postgres for anything beyond a quick look (the booking engine needs real transactions). SQLite (`file:` URI) works for local development only; `seed:booking` and `db:apply-indexes` refuse it. The development database used so far is a separate Neon Postgres database. |
| Main versions | Next 15.5, Payload ^3.84, React 19, Tailwind 4, next-intl 3 |

## 2. Run it locally

```bash
pnpm install
cp apps/techmirai-web/.env.example apps/techmirai-web/.env.local   # then fill in values
pnpm dev                                                            # http://localhost:3000, CMS at /admin
```

At minimum set `DATABASE_URI`, `PAYLOAD_SECRET` and `NEXT_PUBLIC_SERVER_URL`. In dev, the first boot against an empty database creates its tables (section 5 explains why this does **not** happen in production).

## 3. Environment variables

Names only. Values go in `apps/techmirai-web/.env.local` (git-ignored) or the host's settings, **never** in git or in docs. [apps/techmirai-web/.env.example](apps/techmirai-web/.env.example) documents each one (30 names).

| Group | Names | Notes |
|---|---|---|
| Required | `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` | `.env.example` marks these required |
| Environment guards | `SITE_ENV`, `DATABASE_ENV` | `SITE_ENV` must be exactly `production` for crawlable `robots.txt` and no `X-Robots-Tag: noindex`; anything else fails safe to "do not index". `DATABASE_ENV=development` is required by the seed scripts (section 4). |
| Media (R2) | `CLOUDFLARE_R2_BUCKET`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_ENDPOINT`, `NEXT_PUBLIC_R2_PUBLIC_URL` | Without all four storage values the app uses local disk |
| Email | `RESEND_API_KEY`, `FROM_EMAIL`, `CONTACT_NOTIFICATION_EMAIL`, `DEV_STAFF_NOTIFICATION_RECIPIENT` | Resend's sandbox sender only delivers to the account owner until a sending domain is verified |
| Booking | `BOOKING_TOKEN_SECRET`, `CRON_SECRET` | `CRON_SECRET` guards the daily cron |
| LINE | `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_LOGIN_CHANNEL_ID`, `LINE_LOGIN_CHANNEL_SECRET`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_LIFF_MANAGE_ID` | LINE booking is off; no TechMirai LINE account exists yet |
| Anti-spam | `TURNSTILE_SECRET_KEY` | Optional |
| Reception AI | `GROQ_API_KEY`, `GROQ_MODEL` | Without a key the chat still works; AI-tier questions get a fixed "please contact us" reply |
| Dormant | `AI_AGENT_BASE_URL`, `AI_AGENT_API_KEY`, `AI_CORPUS_SECRET` | `.env.example` says the first two belong to an unused proxy |
| Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional |

The only entries in `.env.example` that carry a value are `DATABASE_URI` (a local SQLite path) and `NEXT_PUBLIC_SERVER_URL` (`http://localhost:3000`); neither is a secret.

## 4. Seeding

`pnpm seed` is **destructive** and a hands-on developer command. Do not interrupt a run once it starts; if one is cut off, run it again to completion. It only runs when all of these hold:

1. not a production build;
2. none of `CI`, `VERCEL`, `GITHUB_ACTIONS`, `NETLIFY` is set;
3. `RUN_SEED=true` (set by the `pnpm seed` script);
4. `DATABASE_ENV=development` is set for the target database;
5. confirmation on every run: `--confirm` or `SEED_CONFIRM_CLEAR=yes`.

```bash
pnpm seed --confirm            # page shells, header and footer, content, media placeholders
pnpm --filter techmirai-web seed:booking   # booking services, resource and DEMO slots (Postgres only, same DATABASE_ENV guard)
```

Details: [docs/SEEDING.md](docs/SEEDING.md) and [apps/techmirai-web/README.md](apps/techmirai-web/README.md). The seeded booking slots are **demo availability** and must be replaced before launch (register J2-05). Because of guard 4, **the current scripts cannot seed a database that is not declared a development database**; how production content gets in is not defined (section 5).

## 5. Database

**Development.** Starting `pnpm dev` against a Postgres database creates and updates its tables automatically (`push: true`). This is a development stopgap: the schema push can ask interactive questions and has hung even when answered (`docs/ENGINE-FIXES.md`, 2026-10-06).

### HARD BLOCKER: production schema and migration (Jamal's decision needed)

Verified from the code and the logs, nothing assumed:

- `apps/techmirai-web/payload.config.ts` sets `push: true`, the `prodMigrations` array is commented out, and no `migrations/` folder exists in the app.
- The installed Postgres adapter (`@payloadcms/db-postgres` 3.85.0, `connect.js`) pushes the schema only when `NODE_ENV` is not `production`, and runs `prodMigrations` only when `NODE_ENV` is `production` and the array is set. With the config as it is, **a production start creates no tables and applies no indexes**. A comment in the config saying the indexes "run on production init" is inaccurate for the same reason.
- `payload migrate` fails in this monorepo, and the config states there is "no production-safe automated migration path" that "must be fixed before WO-8" (`docs/ENGINE-FIXES.md`, 2026-10-04, status open).
- `pnpm --filter techmirai-web db:apply-indexes` runs the booking, notification and customer-LINE indexes and constraints as idempotent `IF NOT EXISTS` SQL. It must run after the base tables exist. It does not set `NODE_ENV`; by reading the adapter code, its own start-up would run the development schema push first. **This was not run against an empty database and is unverified.**
- `db:migrate-faq-keywords-category` is a one-off for the development database. It drops a column and must not be used on a database that may hold real content.
- No script or procedure has been run to create the schema of an empty production database, and none is documented as supported.
- There is no automated backup (`docs/SEEDING.md`, section 5); Neon restore points are manual.

Open questions for Jamal (no answer is assumed anywhere in these docs):

1. Is the launch database a separate Neon database (WORK-ORDER decision 3), or something else?
2. Who creates its tables, and by what approved procedure?
3. How does production content get in, given that the seed refuses non-development databases?
4. Does Jamal want a code fix (for example generating migrations or enabling `prodMigrations`)? That would be a separate, approved change.

**Resetting the database.** No reset script or supported reset procedure exists, so none is described here. What the code does: the seed's clear step removes only named legacy collections and page slugs (`apps/techmirai-web/src/seed/lib/clear.ts`), and Neon restore points are taken manually in the Neon dashboard. A full reset procedure is part of the decision above.

## 6. Commands

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` | Turborepo dev server / production build |
| `pnpm --filter techmirai-web start` | Serve a finished build |
| `pnpm typecheck` | TypeScript check of all three packages (the `scripts/` folders are not covered) |
| `pnpm --filter techmirai-web test` | App unit tests (48 at O2) |
| `pnpm --filter @techmirai/cms-core test` | Engine unit tests (1,012 at O2, integration tests excluded) |
| `pnpm --filter @techmirai/reception-engine test` | Chat state-machine tests (47 at O2) |
| `pnpm a11y` | axe-core accessibility check of 46 routes (23 pages x ja and `/en`); needs a running app; fails on serious or critical violations |
| `pnpm preflight` | Static launch check; currently fails with 9 known leftover-wording hits |
| `pnpm preflight:launch` | Static check plus a rendered-page crawl (needs the app running at `http://localhost:3000`) |
| `CI=1 pnpm --filter techmirai-web exec playwright test e2e/seo.spec.ts` | GET-only SEO end-to-end check against a running app. Run only this file: the other three specs write to the database. `CI=1` stops Playwright from starting a dev server of its own. At O2, 38 passed and 14 failed on the known heading-order check. |
| `pnpm lint` | Turborepo runs it, but no package defines a `lint` script, so it checks nothing |

There is no root `test` script and no formatter. `*.integration.test.ts` files need a database and could not run on the developer machine (`docs/FINDINGS.md`, 2026-10-05, F2).

## 7. Launch gate

`pnpm preflight:launch` must fail **only** on items recorded in [docs/PLACEHOLDER-REGISTER.md](docs/PLACEHOLDER-REGISTER.md), each with an owner. Its rules (B1 to B7) are in `docs/WORK-ORDER.md` Appendix B: leftover template wording, old prices, banned claims and numbers, avoid-list words, glossary rules, bracket placeholders, and technical checks (robots, sitemap, hreflang, canonical, one `<h1>`, alt text, no placeholder images). Reviewed exceptions go in [docs/LAUNCH-SCAN-ALLOWLIST.json](docs/LAUNCH-SCAN-ALLOWLIST.json) with a written reason.

**Where it stands:** the last full crawl (O1, against the dev server, before the O1 fixes) reported 1,695 hits, mostly bracket placeholders, number-pattern noise and code-comment matches. It has not been rerun since. The gate is **not** passing: bracket placeholders (the register), nine static leftover hits, a stub allow-list for Sadiatec mentions, and placeholder images remain.

## 8. Repository map

```
apps/techmirai-web/        the deployable site: routes, site.config.ts, seed scripts, tests, e2e
packages/cms-core/         shared engine: Payload config factory, blocks, booking, notifications, chat content
packages/reception-engine/ framework-free chat state machine
scripts/                   preflight-check.mjs, launch-scan rules, create-client-app.mjs (template tool, not for this repo)
docs/                      Spec inputs, register, logs, reports, runbooks (index below)
```

`apps/techmirai-web/site.config.ts` holds this site's identity and feature flags. Brand colours live in two places (`site.config.ts` and the global stylesheet); change both.

## 9. Documentation index

| Document | Use it for |
|---|---|
| [docs/HANDOFF.md](docs/HANDOFF.md) | What is built, routes, open items, blockers, placeholders by owner |
| [docs/DEPLOY-NEW-CLIENT.md](docs/DEPLOY-NEW-CLIENT.md) | Deploy runbook for Jamal (read its top section first) |
| [docs/SEEDING.md](docs/SEEDING.md) | Seed guards and recovery |
| [docs/PLACEHOLDER-REGISTER.md](docs/PLACEHOLDER-REGISTER.md) | Every placeholder, with owner and status |
| [docs/FINDINGS.md](docs/FINDINGS.md), [docs/ENGINE-FIXES.md](docs/ENGINE-FIXES.md) | Dated logs of findings and shared-engine fixes |
| [docs/O2-ACCESSIBILITY.md](docs/O2-ACCESSIBILITY.md), [docs/O2-QUALITY-GATE.md](docs/O2-QUALITY-GATE.md), [docs/O2-CODE-REVIEW.md](docs/O2-CODE-REVIEW.md) | Test, accessibility and review results |
| [docs/IMAGE-SLOTS.md](docs/IMAGE-SLOTS.md) | Every image slot, with alt text and who supplies it |
| [docs/WORK-ORDER.md](docs/WORK-ORDER.md), [docs/packs/](docs/packs/) | The rulebook and step prompts |
| [docs/online-reservation.md](docs/online-reservation.md), [docs/line-reservation.md](docs/line-reservation.md), [docs/ai-receptionist.md](docs/ai-receptionist.md) | Feature notes from the clinic template; not reviewed in O3 and may contain clinic-era wording |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **Stale, out of scope.** Clinic-era content (it mentions the retired `seed:demo`). Not rewritten in O3. |

The Content Spec lives in `docs/_inputs/`, which is git-ignored on purpose (its Section 1 contains private notes).

## 10. Working rules

Standing rules for this repo are in [CLAUDE.md](CLAUDE.md): plan first, work only inside this repo, the developer commits, never commit secrets, never invent facts (use `[TBD: ...]` and a register row), Japanese copy comes from the Spec, no legal, tax or medical text, no generated images of people, and never weaken a test to make it pass.
